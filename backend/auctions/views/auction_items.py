# auctions/views/auction_items.py

from decimal import Decimal, InvalidOperation
from datetime import timedelta

from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from ..models import AuctionItem, AuctionImage, Bid, Notification, UserAccount
from ..serializers import AuctionItemSerializer, BidSerializer
from ..permissions import IsOwnerOrReadOnly
from ..utils.search import fuzzy_match

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class AuctionItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Auction Items."""

    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        current_time = timezone.now()

        # 1) Auto-close ended auctions that are still "active"
        ended_auctions = AuctionItem.objects.filter(status="active", end_time__lte=current_time)
        for auction in ended_auctions:
            highest_bid = auction.bids.order_by("-amount").first()
            if highest_bid:
                auction.winner = highest_bid.bidder
            auction.status = "closed"
            auction.save()

        if self.action == "list":
            queryset = AuctionItem.objects.filter(status="active", end_time__gt=current_time)

            # Filtering
            min_price = self.request.query_params.get("min_price")
            max_price = self.request.query_params.get("max_price")
            condition = self.request.query_params.get("condition")
            location = self.request.query_params.get("location")
            category = self.request.query_params.get("category")
            q = self.request.query_params.get("q")

            if q:
                queryset = queryset.filter(Q(title__icontains=q) | Q(description__icontains=q))
            if min_price:
                queryset = queryset.filter(starting_bid__gte=Decimal(min_price))
            if max_price:
                queryset = queryset.filter(starting_bid__lte=Decimal(max_price))
            if condition:
                queryset = queryset.filter(condition__iexact=condition)
            if location:
                queryset = queryset.filter(location__icontains=location)
            if category:
                queryset = queryset.filter(category__name__icontains=category)

            # Sorting
            sort_by = self.request.query_params.get("sort_by", "newest")
            if sort_by == "newest":
                queryset = queryset.order_by("-created_at")
            elif sort_by == "ending_soon":
                queryset = queryset.order_by("end_time")
            elif sort_by == "highest_bid":
                queryset = queryset.order_by("-current_bid")
            elif sort_by == "lowest_price":
                queryset = queryset.order_by("starting_bid")

            return queryset

        return AuctionItem.objects.all()

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="my_bid_auctions")
    def my_bid_auctions(self, request):
        user = request.user
        bid_auction_ids = (
            Bid.objects.filter(bidder=user).values_list("auction_item", flat=True).distinct()
        )
        auctions = AuctionItem.objects.filter(id__in=bid_auction_ids)

        serializer = AuctionItemSerializer(auctions, many=True, context={"request": request})
        return Response(serializer.data, status=200)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_auctions(self, request):
        user = request.user
        queryset = AuctionItem.objects.filter(owner=user).order_by("-created_at")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        auction_item = serializer.save(owner=self.request.user)
        images = self.request.FILES.getlist("images")
        for image in images:
            AuctionImage.objects.create(auction_item=auction_item, image=image)

    def destroy(self, request, *args, **kwargs):
        auction_item = self.get_object()
        if auction_item.bids.exists() or auction_item.buy_now_buyer is not None:
            return Response({"detail": "Cannot delete auction items that have received bids or been purchased via Buy Now."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        auction_item = self.get_object()

        if auction_item.bids.exists() or auction_item.buy_now_buyer is not None:
            return Response({"detail": "Cannot update auction items that have received bids or been purchased via Buy Now."}, status=status.HTTP_400_BAD_REQUEST)

        if auction_item.end_time <= timezone.now():
            return Response({"detail": "Cannot update auction items that have already ended."}, status=status.HTTP_400_BAD_REQUEST)

        images = request.FILES.getlist("images")
        if images:
            for image in images:
                AuctionImage.objects.create(auction_item=auction_item, image=image)

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_shipped(self, request, pk=None):
        item = self.get_object()
        if item.owner != request.user:
            return Response({"detail": "Only the seller can mark shipped."}, status=403)
        if item.status != "closed":
            return Response({"detail": "Item must be closed (sold) to mark shipped."}, status=400)
        if item.shipping_status != "not_shipped":
            return Response({"detail": "Item is already shipped or received."}, status=400)
        item.shipping_status = "shipped"
        item.save()
        return Response({"detail": "Item marked as shipped."}, status=200)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_received(self, request, pk=None):
        item = self.get_object()
        buyer = item.winner or item.buy_now_buyer
        if buyer != request.user:
            return Response({"detail": "Only the buyer can mark received."}, status=403)
        if item.shipping_status != "shipped":
            return Response({"detail": "Cannot mark received unless the item is shipped."}, status=400)
        item.shipping_status = "received"
        item.save()

        seller = item.owner
        total_price = item.current_bid or item.buy_now_price
        if not total_price:
            return Response({"detail": "No sale price found for this item."}, status=400)

        platform_fee = (Decimal("0.10") * total_price).quantize(Decimal("0.01"))
        seller_amount = total_price - platform_fee

        with transaction.atomic():
            seller.account.balance += seller_amount
            seller.account.save()
            from ..models import Transaction
            Transaction.objects.create(
                user=seller,
                transaction_type="seller_payment",
                amount=seller_amount,
                status="completed",
                description=f"Payment for AuctionItem {item.id} minus fee of {platform_fee}.",
            )

        return Response({"detail": "Item marked as received. Seller has been credited."}, status=200)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticatedOrReadOnly], parser_classes=[JSONParser])
    def bid(self, request, pk=None):
        channel_layer = get_channel_layer()

        def notify(group_name, payload):
            transaction.on_commit(lambda: async_to_sync(channel_layer.group_send)(group_name, payload))

        with transaction.atomic():
            auction_item = AuctionItem.objects.select_for_update().select_related("owner").get(pk=pk)
            now = timezone.now()

            last_bid = Bid.objects.filter(auction_item=auction_item, bidder=request.user).order_by("-timestamp").first()
            if last_bid and (now - last_bid.timestamp).total_seconds() < 30:
                remaining = 30 - int((now - last_bid.timestamp).total_seconds())
                return Response({"detail": f"You must wait {remaining} more seconds before bidding again."}, status=400)

            if auction_item.end_time <= now:
                highest_bid = auction_item.bids.order_by("-amount").first()
                if highest_bid:
                    auction_item.winner = highest_bid.bidder
                auction_item.status = "closed"
                auction_item.save()
                return Response({"detail": "Bidding is closed for this item."}, status=400)

            if auction_item.status != "active":
                return Response({"detail": "Bidding is closed for this item."}, status=400)

            if auction_item.owner == request.user:
                return Response({"detail": "Owners cannot bid on their own items."}, status=403)

            if auction_item.buy_now_buyer is not None:
                return Response({"detail": "This item has been purchased via Buy Now."}, status=400)

            amount_str = request.data.get("amount")
            if not amount_str:
                return Response({"detail": "Bid amount is required."}, status=400)

            try:
                amount = Decimal(str(amount_str))
            except (ValueError, InvalidOperation):
                return Response({"detail": "Invalid bid amount."}, status=400)

            min_bid = auction_item.current_bid or auction_item.starting_bid
            min_increment = (min_bid * Decimal("0.02")).quantize(Decimal("0.01"))
            min_required_bid = (min_bid + min_increment).quantize(Decimal("0.01"))

            if auction_item.buy_now_price and amount >= auction_item.buy_now_price:
                return Response({"detail": f"Bid must be less than Buy Now price of ${auction_item.buy_now_price}."}, status=400)

            if amount < min_required_bid:
                return Response({"detail": f"Bid must be at least ${min_required_bid}."}, status=400)

            time_left = auction_item.end_time - now
            if time_left.total_seconds() < 60:
                auction_item.end_time = now + timedelta(minutes=2)
                auction_item.save()

            old_highest_bid = auction_item.bids.order_by("-amount").first()

            if old_highest_bid:
                old_bidder = old_highest_bid.bidder
                old_amount = old_highest_bid.amount

                if old_bidder != request.user:
                    old_account = UserAccount.objects.select_for_update().get(user=old_bidder)
                    old_account.balance += old_amount
                    old_account.save()

                    Notification.objects.create(
                        user=old_bidder,
                        notification_type="outbid",
                        title=f"You have been outbid on \"{auction_item.title}\"",
                        message=(f"Someone placed a higher bid of ${amount}. Current bid is now ${amount}."),
                        auction_item=auction_item,
                    )

                    notify(f"user_balance_{old_bidder.id}", {"type": "balance_update", "balance": str(old_account.balance)})

                    bidder_account = UserAccount.objects.select_for_update().get(user=request.user)
                    if bidder_account.balance < amount:
                        return Response({"detail": "Insufficient funds."}, status=400)
                    bidder_account.balance -= amount
                    bidder_account.save()

                    notify(f"user_balance_{request.user.id}", {"type": "balance_update", "balance": str(bidder_account.balance)})

                    new_bid = Bid.objects.create(auction_item=auction_item, bidder=request.user, amount=amount)
                    auction_item.current_bid = amount
                    auction_item.save()

                    if auction_item.owner != request.user:
                        Notification.objects.create(
                            user=auction_item.owner,
                            notification_type="bid",
                            title=f"New bid placed on \"{auction_item.title}\"",
                            message=f"{request.user.username} placed a bid of ${amount} on your auction.",
                            auction_item=auction_item,
                        )

                    serializer = BidSerializer(new_bid)
                    return Response(serializer.data, status=201)
                else:
                    difference = amount - old_amount
                    if difference <= 0:
                        return Response({"detail": "New bid must be higher than your current highest bid."}, status=400)

                    bidder_account = UserAccount.objects.select_for_update().get(user=request.user)
                    if bidder_account.balance < difference:
                        return Response({"detail": "Insufficient funds."}, status=400)
                    bidder_account.balance -= difference
                    bidder_account.save()

                    notify(f"user_balance_{request.user.id}", {"type": "balance_update", "balance": str(bidder_account.balance)})

                    new_bid = Bid.objects.create(auction_item=auction_item, bidder=request.user, amount=amount)
                    auction_item.current_bid = amount
                    auction_item.save()

                    if auction_item.owner != request.user:
                        Notification.objects.create(
                            user=auction_item.owner,
                            notification_type="bid",
                            title=f"Bid increased on \"{auction_item.title}\"",
                            message=f"{request.user.username} increased their bid to ${amount} on your auction.",
                            auction_item=auction_item,
                        )

                    serializer = BidSerializer(new_bid)
                    return Response(serializer.data, status=201)
            else:
                bidder_account = UserAccount.objects.select_for_update().get(user=request.user)
                if bidder_account.balance < amount:
                    return Response({"detail": "Insufficient funds."}, status=400)
                bidder_account.balance -= amount
                bidder_account.save()

                notify(f"user_balance_{request.user.id}", {"type": "balance_update", "balance": str(bidder_account.balance)})

                new_bid = Bid.objects.create(auction_item=auction_item, bidder=request.user, amount=amount)
                auction_item.current_bid = amount
                auction_item.save()

                if auction_item.owner != request.user:
                    Notification.objects.create(
                        user=auction_item.owner,
                        notification_type="bid",
                        title=f"New bid placed on \"{auction_item.title}\"",
                        message=f"{request.user.username} placed a bid of ${amount} on your auction.",
                        auction_item=auction_item,
                    )

                serializer = BidSerializer(new_bid)
                return Response(serializer.data, status=201)

    @action(detail=False, methods=["get"], permission_classes=[])
    def search(self, request):
        from django.utils import timezone as dj_tz
        query = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "").strip()

        qs = AuctionItem.objects.filter(status="active", end_time__gt=dj_tz.now())

        if query:
            direct_qs = qs.filter(Q(title__icontains=query) | Q(description__icontains=query))
        else:
            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data)

        fuzzy_matches = []
        if query:
            for item in qs:
                text_to_check = f"{item.title} {item.description}"
                if fuzzy_match(text_to_check, query):
                    fuzzy_matches.append(item.id)

        combined_ids = set(direct_qs.values_list("id", flat=True)) | set(fuzzy_matches)
        qs = qs.filter(id__in=combined_ids)

        if category:
            qs = qs.filter(category__name__icontains=category)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticatedOrReadOnly], parser_classes=[JSONParser])
    def buy_now(self, request, pk=None):
        channel_layer = get_channel_layer()

        def notify(group_name, payload):
            transaction.on_commit(lambda: async_to_sync(channel_layer.group_send)(group_name, payload))

        with transaction.atomic():
            auction_item = AuctionItem.objects.select_for_update().select_related("owner").get(pk=pk)

            if auction_item.status != "active":
                return Response({"detail": "Cannot Buy Now on this item as the auction is not active."}, status=400)

            if auction_item.owner == request.user:
                return Response({"detail": "Owners cannot Buy Now their own items."}, status=403)

            if auction_item.buy_now_buyer is not None:
                return Response({"detail": "This item has already been purchased via Buy Now."}, status=400)

            if not auction_item.buy_now_price:
                return Response({"detail": "Buy Now price is not set for this item."}, status=400)

            old_highest_bid = auction_item.bids.order_by("-amount").first()
            if old_highest_bid and old_highest_bid.bidder != request.user:
                old_bidder = old_highest_bid.bidder
                old_amount = old_highest_bid.amount
                old_account = UserAccount.objects.select_for_update().get(user=old_bidder)
                old_account.balance += old_amount
                old_account.save()
                notify(f"user_balance_{old_bidder.id}", {"type": "balance_update", "balance": str(old_account.balance)})

            user_bid = auction_item.bids.filter(bidder=request.user).order_by("-amount").first()
            if user_bid and auction_item.current_bid == user_bid.amount:
                additional_amount = auction_item.buy_now_price - user_bid.amount
            else:
                additional_amount = auction_item.buy_now_price

            buyer_account = UserAccount.objects.select_for_update().get(user=request.user)
            if buyer_account.balance < additional_amount:
                return Response({"detail": "Insufficient funds to Buy Now."}, status=400)

            buyer_account.balance -= additional_amount
            buyer_account.save()
            notify(f"user_balance_{request.user.id}", {"type": "balance_update", "balance": str(buyer_account.balance)})

            auction_item.buy_now_buyer = request.user
            auction_item.current_bid = auction_item.buy_now_price
            auction_item.status = "closed"
            auction_item.end_time = timezone.now()
            auction_item.save()

            if not auction_item.winner and auction_item.bids.exists():
                highest_bid = auction_item.bids.order_by("-amount").first()
                auction_item.winner = highest_bid.bidder
                auction_item.save()

            serializer = AuctionItemSerializer(auction_item)
            return Response(serializer.data, status=200)
