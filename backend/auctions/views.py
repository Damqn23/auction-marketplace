# backend/auctions/views.py

from django.shortcuts import render
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction
import stripe
from django.shortcuts import get_object_or_404
from django.conf import settings
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db.models import Q, Sum, Avg
from django.db.models.functions import TruncDay, TruncMonth
from datetime import timedelta
from rest_framework import viewsets, status, permissions, generics
from rest_framework.response import Response
from rest_framework.permissions import (
    IsAuthenticatedOrReadOnly,
    AllowAny,
    IsAuthenticated,
)
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import (
    AuctionImage,
    AuctionItem,
    Bid,
    Category,
    ChatMessage,
    Favorite,
    UserAccount,
    Transaction,
)
from .serializers import (
    CategorySerializer,
    ChatMessageSerializer,
    UserSerializer,
    AuctionItemSerializer,
    UserRegistrationSerializer,
    BidSerializer,
    FavoriteSerializer,
)
from .permissions import IsOwnerOrReadOnly, IsBidderOrReadOnly  # Custom Permissions
from decimal import Decimal, InvalidOperation
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


stripe.api_key = settings.STRIPE_SECRET_KEY


logger = logging.getLogger(__name__)


def levenshtein(a, b):
    """
    Returns the Levenshtein distance between two strings `a` and `b`.
    This is a measure of how many single-character edits (insertions,
    deletions, or substitutions) are needed to transform `a` into `b`.
    """
    # If `a` is shorter, swap them so we always iterate over the shorter string
    if len(a) < len(b):
        return levenshtein(b, a)
    if len(b) == 0:
        return len(a)

    # dp[j] will track distance for (some prefix of `a`) to (prefix of `b` up to j)
    dp = range(len(b) + 1)
    for i, char_a in enumerate(a):
        # At the start of each row i, we set new_dp[0] = i+1
        new_dp = [i + 1]
        for j, char_b in enumerate(b):
            cost = 0 if char_a == char_b else 1
            # Take the min of three edit operations:
            #  - dp[j] + cost: substitution (if chars differ),
            #  - dp[j+1] + 1: deletion,
            #  - new_dp[-1] + 1: insertion
            new_dp.append(
                min(
                    dp[j] + cost,  # substitution
                    dp[j + 1] + 1,  # deletion
                    new_dp[-1] + 1,  # insertion
                )
            )
        dp = new_dp
    return dp[-1]


def fuzzy_match(candidate, query):
    """
    Returns True if `candidate` string "fuzzily" matches `query`.
    1) If query is a direct substring of candidate, return True immediately.
    2) Otherwise, for every query word, ensure it has at least one
       candidate word within a Levenshtein distance threshold.
    """
    candidate_lower = candidate.lower()
    query_lower = query.lower()

    # Quick check: exact substring => immediate True
    if query_lower in candidate_lower:
        return True

    # Split candidate and query into words
    candidate_words = candidate_lower.split()
    query_words = query_lower.split()

    # For every word in the query, we must find at least one "close enough" candidate word
    for qw in query_words:
        matched_this_query_word = False
        for cw in candidate_words:
            dist = levenshtein(cw, qw)
            # You can tune the threshold. A common approach:
            #   e.g. threshold = max(1, len(qw) // 3)
            # meaning "up to a third of the query word length in edits"
            threshold = max(1, len(qw) // 3)
            if dist <= threshold:
                matched_this_query_word = True
                break
        if not matched_this_query_word:
            # If we couldn't match this query word, entire fuzzy_match fails
            return False

    return True


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user  # Filter by current user

        period = request.query_params.get("period", "month")
        category_filter = request.query_params.get("category", None)

        # Calculate statistics only for auctions created by the user
        total_published = AuctionItem.objects.filter(owner=user).count()
        active_auctions = AuctionItem.objects.filter(
            owner=user, status="active", end_time__gt=timezone.now()
        ).count()

        # Closed auctions for sales stats
        closed_auctions = AuctionItem.objects.filter(owner=user).filter(
            Q(status="closed") | Q(end_time__lte=timezone.now())
        )

        if category_filter:
            closed_auctions = closed_auctions.filter(
                category__name__icontains=category_filter
            )

        total_revenue = (
            closed_auctions.aggregate(total=Sum("current_bid"))["total"] or 0
        )
        average_sale = closed_auctions.aggregate(avg=Avg("current_bid"))["avg"] or 0

        # For average bid, use bids made by the user
        average_bid = (
            Bid.objects.filter(bidder=user).aggregate(avg=Avg("amount"))["avg"] or 0
        )

        # Determine grouping based on period
        now = timezone.now()
        if period == "week":
            start_date = now - timedelta(days=7)
            trunc_func = TruncDay
        elif period == "year":
            start_date = now - timedelta(days=365)
            trunc_func = TruncMonth
        else:  # default to month
            start_date = now - timedelta(days=30)
            trunc_func = TruncDay

        # Chart data for closed auctions of this user
        chart_data_qs = (
            closed_auctions.filter(end_time__gte=start_date)
            .annotate(period=trunc_func("end_time"))
            .values("period")
            .annotate(total=Sum("current_bid"))
            .order_by("period")
        )
        chart_data = [
            {"period": data["period"].strftime("%Y-%m-%d"), "total": data["total"]}
            for data in chart_data_qs
        ]

        # Pie chart data: distribution by category
        pie_data_qs = closed_auctions.values("category__name").annotate(
            total=Sum("current_bid")
        )
        pie_data = [
            {"category": data["category__name"], "total": data["total"]}
            for data in pie_data_qs
        ]

        response_data = {
            "total_published": total_published,
            "active_auctions": active_auctions,
            "total_revenue": total_revenue,
            "average_bid": average_bid,
            "average_sale": average_sale,
            "line_chart_data": chart_data,
            "pie_chart_data": pie_data,
        }
        return Response(response_data)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class UserBidsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_bids = (
            Bid.objects.filter(bidder=user)
            .values_list("auction_item", flat=True)
            .distinct()
        )
        auctions = AuctionItem.objects.filter(id__in=user_bids)
        now = timezone.now()

        winning_now = []
        won = []
        losing_now = []
        lost = []

        for auction in auctions:
            highest_bid = auction.bids.order_by("-amount").first()
            # Consider auction closed if its end_time has passed
            if auction.status == "active" and auction.end_time > now:
                # Auction is still active
                if highest_bid and highest_bid.bidder == user:
                    winning_now.append(auction)
                else:
                    losing_now.append(auction)
            else:
                # Auction is closed (either by status or because its end_time has passed)
                if auction.winner == user:
                    won.append(auction)
                else:
                    lost.append(auction)

        data = {
            "winning_now": AuctionItemSerializer(
                winning_now, many=True, context={"request": request}
            ).data,
            "won": AuctionItemSerializer(
                won, many=True, context={"request": request}
            ).data,
            "losing_now": AuctionItemSerializer(
                losing_now, many=True, context={"request": request}
            ).data,
            "lost": AuctionItemSerializer(
                lost, many=True, context={"request": request}
            ).data,
        }

        return Response(data)


class AuctionItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Auction Items.
    """

    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        current_time = timezone.now()

        # 1) Auto-close ended auctions that are still "active"
        ended_auctions = AuctionItem.objects.filter(
            status="active", end_time__lte=current_time
        )
        for auction in ended_auctions:
            highest_bid = auction.bids.order_by("-amount").first()
            if highest_bid:
                auction.winner = highest_bid.bidder
            auction.status = "closed"
            auction.save()

        # 2) If this is a "list" action (GET /auction-items/), show only active items
        if self.action == "list":
            queryset = AuctionItem.objects.filter(
                status="active", end_time__gt=current_time
            )

            # --- Filtering ---
            min_price = self.request.query_params.get("min_price")
            max_price = self.request.query_params.get("max_price")
            condition = self.request.query_params.get("condition")
            location = self.request.query_params.get("location")
            category = self.request.query_params.get("category")
            q = self.request.query_params.get("q")

            if q:
                queryset = queryset.filter(
                    Q(title__icontains=q) | Q(description__icontains=q)
                )
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

            # --- Sorting ---
            sort_by = self.request.query_params.get(
                "sort_by", "newest"
            )  # Default to 'newest'
            if sort_by == "newest":
                queryset = queryset.order_by("-created_at")
            elif sort_by == "ending_soon":
                queryset = queryset.order_by("end_time")
            elif sort_by == "highest_bid":
                queryset = queryset.order_by("-current_bid")
            elif sort_by == "lowest_price":
                queryset = queryset.order_by("starting_bid")

            return queryset

        # 3) For detail actions (retrieve, update, mark_shipped, mark_received, etc.), return *all* items
        #    so we can find closed items as well.
        return AuctionItem.objects.all()

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[IsAuthenticated],
        url_path="my_bid_auctions",  # <--- EXACT path
    )
    def my_bid_auctions(self, request):
        """
        Returns all AuctionItems where the current user has placed a bid.
        """
        user = request.user
        bid_auction_ids = (
            Bid.objects.filter(bidder=user)
            .values_list("auction_item", flat=True)
            .distinct()
        )
        auctions = AuctionItem.objects.filter(id__in=bid_auction_ids)

        serializer = AuctionItemSerializer(
            auctions, many=True, context={"request": request}
        )
        return Response(serializer.data, status=200)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_auctions(self, request):
        """
        Get all auctions created by the current user.
        """
        user = request.user
        queryset = AuctionItem.objects.filter(owner=user).order_by("-created_at")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        """
        Assign the current user as the owner when creating an auction.
        Handle multiple images if provided.
        """
        auction_item = serializer.save(owner=self.request.user)
        images = self.request.FILES.getlist(
            "images"
        )  # Expecting multiple images with key 'images'

        for image in images:
            AuctionImage.objects.create(auction_item=auction_item, image=image)

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of auctions that have bids or have been purchased via Buy Now.
        """
        auction_item = self.get_object()
        if auction_item.bids.exists() or auction_item.buy_now_buyer is not None:
            return Response(
                {
                    "detail": "Cannot delete auction items that have received bids or been purchased via Buy Now."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Prevent updating auctions that have bids, have been purchased via Buy Now, or have ended.
        Handle updating images if provided.
        """
        auction_item = self.get_object()

        if auction_item.bids.exists() or auction_item.buy_now_buyer is not None:
            return Response(
                {
                    "detail": "Cannot update auction items that have received bids or been purchased via Buy Now."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if auction_item.end_time <= timezone.now():
            return Response(
                {"detail": "Cannot update auction items that have already ended."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Handle updating images
        images = request.FILES.getlist("images")
        if images:
            # Optionally, clear existing images or append new ones
            # Here, we'll append new images
            for image in images:
                AuctionImage.objects.create(auction_item=auction_item, image=image)

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_shipped(self, request, pk=None):
        """
        Seller marks the item as shipped.
        """
        item = self.get_object()

        # Check if current user is the owner (seller)
        if item.owner != request.user:
            return Response({"detail": "Only the seller can mark shipped."}, status=403)

        # The item must be sold (status="closed") and not already shipped
        if item.status != "closed":
            return Response(
                {"detail": "Item must be closed (sold) to mark shipped."}, status=400
            )
        if item.shipping_status != "not_shipped":
            return Response(
                {"detail": "Item is already shipped or received."}, status=400
            )

        # Update shipping status
        item.shipping_status = "shipped"
        item.save()

        return Response({"detail": "Item marked as shipped."}, status=200)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_received(self, request, pk=None):
        """
        Buyer marks the item as received.
        """
        item = self.get_object()

        # Check if the current user is the buyer (winner or buy_now_buyer)
        buyer = item.winner or item.buy_now_buyer
        if buyer != request.user:
            return Response({"detail": "Only the buyer can mark received."}, status=403)

        # Must already be shipped
        if item.shipping_status != "shipped":
            return Response(
                {"detail": "Cannot mark received unless the item is shipped."},
                status=400,
            )

        # Mark as received
        item.shipping_status = "received"
        item.save()

        # Now credit the seller's account (minus platform fee)
        seller = item.owner
        total_price = item.current_bid or item.buy_now_price
        if not total_price:
            return Response(
                {"detail": "No sale price found for this item."}, status=400
            )

        platform_fee = (Decimal("0.10") * total_price).quantize(
            Decimal("0.01")
        )  # 10% fee
        seller_amount = total_price - platform_fee

        with transaction.atomic():
            # Update seller's balance
            seller.account.balance += seller_amount
            seller.account.save()

            # Record a transaction for clarity
            Transaction.objects.create(
                user=seller,
                transaction_type="seller_payment",
                amount=seller_amount,
                status="completed",
                description=f"Payment for AuctionItem {item.id} minus fee of {platform_fee}.",
            )

        return Response(
            {"detail": "Item marked as received. Seller has been credited."}, status=200
        )

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticatedOrReadOnly],
        parser_classes=[JSONParser],
    )
    def bid(self, request, pk=None):
        auction_item = self.get_object()
        now = timezone.now()

        if auction_item.end_time <= now:
            highest_bid = auction_item.bids.order_by("-amount").first()
            if highest_bid:
                auction_item.winner = highest_bid.bidder
            auction_item.status = "closed"
            auction_item.save()
            return Response({"detail": "Bidding is closed for this item."}, status=400)
        # 1) Basic checks
        if auction_item.status == "active" and auction_item.end_time <= now:
            auction_item.status = "closed"
            auction_item.save()
            return Response({"detail": "Bidding is closed for this item."}, status=400)

        if auction_item.status != "active":
            return Response({"detail": "Bidding is closed for this item."}, status=400)

        if auction_item.owner == request.user:
            return Response(
                {"detail": "Owners cannot bid on their own items."}, status=403
            )

        if auction_item.buy_now_buyer is not None:
            return Response(
                {"detail": "This item has been purchased via Buy Now."}, status=400
            )

        amount_str = request.data.get("amount")
        if not amount_str:
            return Response({"detail": "Bid amount is required."}, status=400)

        try:
            amount = Decimal(str(amount_str))
        except (ValueError, InvalidOperation):
            return Response({"detail": "Invalid bid amount."}, status=400)

        # 2) Minimum bid checks
        min_bid = (
            auction_item.current_bid
            if auction_item.current_bid
            else auction_item.starting_bid
        )
        min_increment = (min_bid * Decimal("0.02")).quantize(Decimal("0.01"))
        min_required_bid = (min_bid + min_increment).quantize(Decimal("0.01"))

        if auction_item.buy_now_price and amount >= auction_item.buy_now_price:
            return Response(
                {
                    "detail": f"Bid must be less than Buy Now price of ${auction_item.buy_now_price}."
                },
                status=400,
            )

        if amount < min_required_bid:
            return Response(
                {"detail": f"Bid must be at least ${min_required_bid}."},
                status=400,
            )

        # 3) Extend auction if < 60 seconds remain
        time_left = auction_item.end_time - now
        if time_left.total_seconds() < 60:
            extension = timedelta(minutes=2)
            auction_item.end_time = now + extension
            auction_item.save()

        # 4) Check for an old highest bid
        old_highest_bid = auction_item.bids.order_by("-amount").first()
        channel_layer = get_channel_layer()

        if old_highest_bid:
            old_bidder = old_highest_bid.bidder
            old_amount = old_highest_bid.amount

            # If a DIFFERENT user was the old highest bidder
            if old_bidder != request.user:
                # Refund the old highest bid to that user
                with transaction.atomic():
                    old_bidder.account.balance += old_amount
                    old_bidder.account.save()

                # Notify the old bidder of their updated balance
                async_to_sync(channel_layer.group_send)(
                    f"user_balance_{old_bidder.id}",
                    {
                        "type": "balance_update",
                        "balance": str(old_bidder.account.balance),
                    },
                )

                # Deduct the entire new bid from the new bidder
                bidder_account = request.user.account
                if bidder_account.balance < amount:
                    return Response({"detail": "Insufficient funds."}, status=400)

                with transaction.atomic():
                    bidder_account.balance -= amount
                    bidder_account.save()

                    # Notify the new bidder of their updated balance
                    async_to_sync(channel_layer.group_send)(
                        f"user_balance_{request.user.id}",
                        {
                            "type": "balance_update",
                            "balance": str(bidder_account.balance),
                        },
                    )

                    new_bid = Bid.objects.create(
                        auction_item=auction_item, bidder=request.user, amount=amount
                    )
                    auction_item.current_bid = amount
                    auction_item.save()

                serializer = BidSerializer(new_bid)
                return Response(serializer.data, status=201)
            else:
                # The SAME user is increasing their own highest bid
                difference = amount - old_amount
                if difference <= 0:
                    return Response(
                        {
                            "detail": "New bid must be higher than your current highest bid."
                        },
                        status=400,
                    )

                bidder_account = request.user.account
                if bidder_account.balance < difference:
                    return Response({"detail": "Insufficient funds."}, status=400)

                with transaction.atomic():
                    bidder_account.balance -= difference
                    bidder_account.save()

                    # Notify the bidder of their updated balance
                    async_to_sync(channel_layer.group_send)(
                        f"user_balance_{request.user.id}",
                        {
                            "type": "balance_update",
                            "balance": str(bidder_account.balance),
                        },
                    )

                    new_bid = Bid.objects.create(
                        auction_item=auction_item, bidder=request.user, amount=amount
                    )
                    auction_item.current_bid = amount
                    auction_item.save()

                serializer = BidSerializer(new_bid)
                return Response(serializer.data, status=201)
        else:
            # No previous bids – first bid
            bidder_account = request.user.account
            if bidder_account.balance < amount:
                return Response({"detail": "Insufficient funds."}, status=400)

            with transaction.atomic():
                bidder_account.balance -= amount
                bidder_account.save()

                # Notify the bidder of their updated balance
                async_to_sync(channel_layer.group_send)(
                    f"user_balance_{request.user.id}",
                    {"type": "balance_update", "balance": str(bidder_account.balance)},
                )

                new_bid = Bid.objects.create(
                    auction_item=auction_item, bidder=request.user, amount=amount
                )
                auction_item.current_bid = amount
                auction_item.save()

            serializer = BidSerializer(new_bid)
            return Response(serializer.data, status=201)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def search(self, request):
        query = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "").strip()

        # Only get "active" items whose end_time hasn't passed
        qs = AuctionItem.objects.filter(status="active", end_time__gt=timezone.now())

        # 1) Direct substring search
        if query:
            direct_qs = qs.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )
        else:
            # If no query, just return all active, non-ended
            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data)

        # 2) Fuzzy pass – still within the same filtered qs
        fuzzy_matches = []
        if query:
            for item in qs:
                text_to_check = f"{item.title} {item.description}"
                if fuzzy_match(text_to_check, query):
                    fuzzy_matches.append(item.id)

        # Combine direct AND fuzzy
        combined_ids = set(direct_qs.values_list("id", flat=True)) | set(fuzzy_matches)
        qs = qs.filter(id__in=combined_ids)

        # 3) Filter by category if present
        if category:
            qs = qs.filter(category__name__icontains=category)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticatedOrReadOnly],
        parser_classes=[JSONParser],
    )
    def buy_now(self, request, pk=None):
        auction_item = self.get_object()

        if auction_item.status != "active":
            return Response(
                {"detail": "Cannot Buy Now on this item as the auction is not active."},
                status=400,
            )

        if auction_item.owner == request.user:
            return Response(
                {"detail": "Owners cannot Buy Now their own items."}, status=403
            )

        if auction_item.buy_now_buyer is not None:
            return Response(
                {"detail": "This item has already been purchased via Buy Now."},
                status=400,
            )

        if not auction_item.buy_now_price:
            return Response(
                {"detail": "Buy Now price is not set for this item."}, status=400
            )

        buyer_account = request.user.account
        channel_layer = get_channel_layer()

        # --- Refund the previous highest bid if it exists and isn't from the buyer ---
        old_highest_bid = auction_item.bids.order_by("-amount").first()
        if old_highest_bid and old_highest_bid.bidder != request.user:
            with transaction.atomic():
                old_bidder = old_highest_bid.bidder
                old_amount = old_highest_bid.amount
                old_bidder.account.balance += old_amount
                old_bidder.account.save()
            async_to_sync(channel_layer.group_send)(
                f"user_balance_{old_bidder.id}",
                {
                    "type": "balance_update",
                    "balance": str(old_bidder.account.balance),
                },
            )

        # --- Determine additional amount to charge ---
        user_bid = (
            auction_item.bids.filter(bidder=request.user).order_by("-amount").first()
        )
        if user_bid and auction_item.current_bid == user_bid.amount:
            additional_amount = auction_item.buy_now_price - user_bid.amount
        else:
            additional_amount = auction_item.buy_now_price

        if buyer_account.balance < additional_amount:
            return Response({"detail": "Insufficient funds to Buy Now."}, status=400)

        with transaction.atomic():
            # Deduct only the additional amount needed from the buyer
            buyer_account.balance -= additional_amount
            buyer_account.save()

            async_to_sync(channel_layer.group_send)(
                f"user_balance_{request.user.id}",
                {"type": "balance_update", "balance": str(buyer_account.balance)},
            )

            auction_item.buy_now_buyer = request.user
            auction_item.current_bid = auction_item.buy_now_price
            auction_item.status = "closed"
            auction_item.end_time = timezone.now()
            auction_item.save()

            # Optionally, update the winner if there are existing bids
            if not auction_item.winner and auction_item.bids.exists():
                highest_bid = auction_item.bids.order_by("-amount").first()
                auction_item.winner = highest_bid.bidder
                auction_item.save()

        serializer = AuctionItemSerializer(auction_item)
        return Response(serializer.data, status=200)


class FavoriteListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FavoriteDeleteAPIView(generics.DestroyAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)


class MyPurchasesView(APIView):
    """
    APIView to retrieve all purchases made by the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Items bought via Buy Now
        buy_now_purchases = AuctionItem.objects.filter(buy_now_buyer=user)
        # Items won via bidding
        bid_purchases = AuctionItem.objects.filter(winner=user)
        # Combine both querysets
        purchases = buy_now_purchases.union(bid_purchases)
        serializer = AuctionItemSerializer(
            purchases, many=True, context={"request": request}
        )
        return Response(serializer.data, status=200)


class BidViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for Bid objects.
    """

    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [IsBidderOrReadOnly]


class RegisterView(APIView):
    """
    APIView to handle user registration.
    """

    permission_classes = [AllowAny]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"message": "User registered successfully."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ViewSet):
    """
    ViewSet to retrieve authenticated user's details.
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CurrentUserView(generics.RetrieveAPIView):
    """
    Retrieve the currently authenticated user.
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AuctionItemDetailView(generics.RetrieveAPIView):
    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        user = request.user
        unread_messages = ChatMessage.objects.filter(
            recipient=user, is_read=False
        ).count()
        return Response({"unread_count": unread_messages})

    @action(detail=False, methods=["get"])
    def get_messages(self, request):
        user = request.user
        other_username = request.query_params.get("other_username")

        if other_username:
            try:
                other_user = User.objects.get(username=other_username)
            except User.DoesNotExist:
                return Response(
                    {"detail": "Recipient does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            messages = ChatMessage.objects.filter(
                Q(sender=user, recipient=other_user)
                | Q(sender=other_user, recipient=user)
            ).order_by("timestamp")
        else:
            # If no specific user is mentioned, return all messages where the user is sender or recipient
            messages = ChatMessage.objects.filter(
                Q(sender=user) | Q(recipient=user)
            ).order_by("-timestamp")

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def send_message(self, request):
        sender = request.user
        recipient_username = request.data.get("recipient_username")
        message = request.data.get("message")

        if not recipient_username or not message:
            return Response(
                {"detail": "Recipient and message are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            recipient = User.objects.get(username=recipient_username)
        except User.DoesNotExist:
            return Response(
                {"detail": "Recipient does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        chat_message = ChatMessage.objects.create(
            sender=sender, recipient=recipient, message=message
        )
        serializer = ChatMessageSerializer(chat_message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def get_chats(self, request):
        user = request.user
        sent_messages = ChatMessage.objects.filter(sender=user)
        received_messages = ChatMessage.objects.filter(recipient=user)

        # Get unique senders and recipients
        unique_senders = sent_messages.values_list(
            "recipient__username", flat=True
        ).distinct()
        unique_recipients = received_messages.values_list(
            "sender__username", flat=True
        ).distinct()

        unique_users = set(unique_senders).union(set(unique_recipients))

        # For each user, get the latest message
        chats = []
        for username in unique_users:
            latest_message = (
                ChatMessage.objects.filter(
                    (
                        Q(sender=user, recipient__username=username)
                        | Q(sender__username=username, recipient=user)
                    )
                )
                .order_by("-timestamp")
                .first()
            )
            if latest_message:
                chats.append(
                    {
                        "owner": username,
                        "lastMessage": latest_message.message,
                        "timestamp": latest_message.timestamp,
                    }
                )

        # Sort chats by latest message timestamp
        chats.sort(key=lambda x: x["timestamp"], reverse=True)

        return Response(chats)

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def mark_as_read(self, request):
        """
        Marks messages as read either globally or within a specific conversation.
        """
        user = request.user
        other_username = request.data.get("other_username")

        if other_username:
            try:
                other_user = User.objects.get(username=other_username)
            except User.DoesNotExist:
                return Response({"detail": "User not found."}, status=404)

            # Mark messages from other_user to the current user as read
            updated = ChatMessage.objects.filter(
                sender=other_user, recipient=user, is_read=False
            ).update(is_read=True)
        else:
            # Mark all unread messages for the current user as read
            updated = ChatMessage.objects.filter(recipient=user, is_read=False).update(
                is_read=True
            )

        return Response({"status": f"{updated} messages marked as read."}, status=200)


class SearchAuctionItemsView(APIView):
    """
    API View to handle searching of Auction Items based on query parameter 'q'.
    """

    def get(self, request, format=None):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response(
                {"detail": "Please provide a search query parameter 'q'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter AuctionItems where 'q' is in title or description, and status is 'active'
        auction_items = AuctionItem.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query), status="active"
        )

        serializer = AuctionItemSerializer(
            auction_items, many=True, context={"request": request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateDepositPaymentIntentView(APIView):
    """
    Create a PaymentIntent for depositing funds.
    The frontend will use the returned client secret to complete the payment.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        amount_str = request.data.get("amount")
        if not amount_str:
            return Response(
                {"detail": "Deposit amount is required."},
                status=400,
            )
        try:
            amount = Decimal(amount_str)
        except Exception:
            return Response(
                {"detail": "Invalid amount format."},
                status=400,
            )
        if amount <= 0:
            return Response(
                {"detail": "Deposit amount must be positive."},
                status=400,
            )

        # Stripe expects the amount in the smallest currency unit (e.g. cents)
        amount_cents = int(amount * 100)

        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="usd",
                metadata={"user_id": request.user.id, "deposit_amount": str(amount)},
                # Optionally, add receipt_email or other parameters.
            )
        except Exception as e:
            logger.error(f"Stripe PaymentIntent creation failed: {e}")
            return Response(
                {"detail": "Error creating PaymentIntent."},
                status=500,
            )

        return Response(
            {"client_secret": intent.client_secret},
            status=200,
        )


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """
    Listens for Stripe webhook events. Specifically, we'll handle payment_intent.succeeded
    to credit the user's account when the deposit is confirmed.
    """

    permission_classes = []  # Webhook doesn't send an auth token, so typically no auth.

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET  # Make sure this is set

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        except (ValueError, stripe.error.SignatureVerificationError):
            # Invalid payload or signature
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # Handle the event
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            metadata = payment_intent.get("metadata", {})
            user_id = metadata.get("user_id")
            deposit_amount_str = metadata.get("deposit_amount")

            if user_id and deposit_amount_str:
                try:
                    deposit_amount = Decimal(deposit_amount_str)
                    user = User.objects.get(id=user_id)

                    # Atomically update the balance and create a Transaction record
                    with transaction.atomic():
                        user.account.balance += deposit_amount
                        user.account.save()
                        Transaction.objects.create(
                            user=user,
                            transaction_type="deposit",
                            amount=deposit_amount,
                            status="completed",
                            description="Deposit completed via Stripe.",
                        )
                except Exception as e:
                    logger.error(f"Error handling payment_intent.succeeded: {e}")
                    return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif event["type"] == "payment_intent.payment_failed":
            # Optionally handle failed payments
            pass

        # Return a 200 to acknowledge receipt of the event
        return Response(status=status.HTTP_200_OK)


class UserBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Assume every user has an associated UserAccount (thanks to your post_save signal)
        user_account = request.user.account
        return Response({"balance": str(user_account.balance)}, status=200)
