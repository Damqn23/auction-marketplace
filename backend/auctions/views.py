# backend/auctions/views.py

from django.shortcuts import render
from django.contrib.auth.models import User
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Avg
from django.db.models.functions import TruncDay, TruncMonth
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
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
from .models import AuctionImage, AuctionItem, Bid, Category, ChatMessage, Favorite
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


logger = logging.getLogger(__name__)


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

        # Automatically close ended auctions...
        # (your existing code here)

        # Get active auctions
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

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticatedOrReadOnly],
        parser_classes=[JSONParser],
    )
    def bid(self, request, pk=None):
        """
        Custom action to place a bid on an auction item.
        Also, if a bid is placed with less than 60 seconds remaining,
        extend the auction time by 2 minutes.
        """
        auction_item = self.get_object()
        now = timezone.now()

        # If auction end time has passed, update status to closed.
        if auction_item.status == "active" and auction_item.end_time <= now:
            auction_item.status = "closed"
            auction_item.save()
            return Response(
                {"detail": "Bidding is closed for this item."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ensure auction is active
        if auction_item.status != "active":
            return Response(
                {"detail": "Bidding is closed for this item."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent owner from bidding on their own item.
        if auction_item.owner == request.user:
            return Response(
                {"detail": "Owners cannot bid on their own items."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prevent bidding if Buy Now has been used.
        if auction_item.buy_now_buyer is not None:
            return Response(
                {"detail": "This item has been purchased via Buy Now."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get bid amount from request.
        amount = request.data.get("amount")
        if not amount:
            return Response(
                {"detail": "Bid amount is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(str(amount))
        except (ValueError, InvalidOperation):
            return Response(
                {"detail": "Invalid bid amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine minimum bid (2% increment)
        min_bid = (
            auction_item.current_bid
            if auction_item.current_bid
            else auction_item.starting_bid
        )
        min_increment = (min_bid * Decimal("0.02")).quantize(Decimal("0.01"))
        min_required_bid = (min_bid + min_increment).quantize(Decimal("0.01"))

        # If Buy Now is set, ensure bid is less than the Buy Now price.
        if auction_item.buy_now_price:
            if amount >= auction_item.buy_now_price:
                return Response(
                    {
                        "detail": f"Bid must be less than Buy Now price of ${auction_item.buy_now_price}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if amount < min_required_bid:
            return Response(
                {"detail": f"Bid must be at least ${min_required_bid}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extend auction time if less than 60 seconds remain.
        time_left = auction_item.end_time - now
        if time_left.total_seconds() < 60:
            extension = timedelta(
                minutes=2
            )  # You can adjust the extension duration here.
            auction_item.end_time = now + extension
            auction_item.save()

        # Create the bid.
        bid = Bid.objects.create(
            auction_item=auction_item, bidder=request.user, amount=amount
        )
        # Update current bid.
        auction_item.current_bid = amount
        auction_item.save()

        serializer = BidSerializer(bid)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def search(self, request):
        """
        Custom search action that only filters by title.
        If a query word ends with an 's' (or equals 'часовници'),
        it also checks for the singular form.
        """
        query = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "").strip()
        qs = AuctionItem.objects.filter(status="active")
        if query:
            words = query.split()
            q_filter = Q()
            for word in words:
                # Check for a Bulgarian plural example and English 's'
                if word.lower() == "часовници":
                    singular = "часовник"
                elif word.endswith("s"):
                    singular = word[:-1]
                else:
                    singular = None
                if singular:
                    word_q = Q(title__icontains=word) | Q(title__icontains=singular)
                else:
                    word_q = Q(title__icontains=word)
                q_filter &= word_q
            qs = qs.filter(q_filter)
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
        """
        Custom action to purchase an auction item via Buy Now.
        """
        auction_item = self.get_object()

        # Check if auction is active
        if auction_item.status != "active":
            return Response(
                {"detail": "Cannot Buy Now on this item as the auction is not active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent owner from buying their own item
        if auction_item.owner == request.user:
            return Response(
                {"detail": "Owners cannot Buy Now their own items."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prevent multiple Buy Now purchases
        if auction_item.buy_now_buyer is not None:
            return Response(
                {"detail": "This item has already been purchased via Buy Now."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if Buy Now price is set
        if not auction_item.buy_now_price:
            return Response(
                {"detail": "Buy Now price is not set for this item."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Optionally, check user funds or other business logic here

        # Set buyer, update current bid, mark auction as closed,
        # and update the end_time to the current time (as if the auction has ended)
        auction_item.buy_now_buyer = request.user
        auction_item.current_bid = auction_item.buy_now_price
        auction_item.status = "closed"
        auction_item.end_time = timezone.now()
        auction_item.save()

        # Optionally, set winner if not already set via Buy Now (this block may be unnecessary since we've just set buy_now_buyer)
        if not auction_item.winner and auction_item.bids.exists():
            highest_bid = auction_item.bids.order_by("-amount").first()
            auction_item.winner = highest_bid.bidder
            auction_item.save()

        serializer = AuctionItemSerializer(auction_item)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FavoriteListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# API view to remove a favorite
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
