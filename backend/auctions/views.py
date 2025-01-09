# backend/auctions/views.py

from django.shortcuts import render
from django.contrib.auth.models import User
from django.utils import timezone

from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import AuctionItem, Bid, AuctionImage
from .serializers import (
    UserSerializer,
    AuctionItemSerializer,
    UserRegistrationSerializer,
    BidSerializer,
    AuctionImageSerializer
)
from .permissions import IsOwnerOrReadOnly, IsBidderOrReadOnly  # Custom Permissions

from decimal import Decimal, InvalidOperation

import logging

# Initialize logger
logger = logging.getLogger(__name__)


class AuctionItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Auction Items.
    """
    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """
        Override get_queryset to process ended auctions (close them if past end_time).
        Only return active auctions that are not yet ended.
        """
        current_time = timezone.now()
        ended_auctions = AuctionItem.objects.filter(status='active', end_time__lte=current_time)
        
        for auction in ended_auctions:
            if auction.buy_now_buyer:
                # Auction closed via Buy Now
                auction.status = 'closed'
                auction.save()
            else:
                # Determine winner based on highest bid
                highest_bid = auction.bids.order_by('-amount').first()
                if highest_bid:
                    auction.winner = highest_bid.bidder
                auction.status = 'closed'
                auction.save()
        
        # Return only active auctions that haven't ended yet
        return AuctionItem.objects.filter(status='active', end_time__gt=current_time)

    def perform_create(self, serializer):
        """
        Assign the current user as the owner when creating an auction.
        Handle multiple images if provided (key='images').
        """
        auction_item = serializer.save(owner=self.request.user)
        images = self.request.FILES.getlist('images')  # Expecting multiple images with the key 'images'

        for image in images:
            AuctionImage.objects.create(auction_item=auction_item, image=image)

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deletion of auctions that have bids or have been purchased via Buy Now.
        """
        auction_item = self.get_object()
        if auction_item.bids.exists() or auction_item.buy_now_buyer is not None:
            return Response(
                {'detail': 'Cannot delete auction items that have received bids or been purchased via Buy Now.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Prevent updating auctions that have bids, have been purchased via Buy Now, or have ended.
        Also handle updating images if provided.
        """
        auction_item = self.get_object()

        if auction_item.bids.exists() or auction_item.buy_now_buyer is not None:
            return Response(
                {'detail': 'Cannot update auction items that have received bids or been purchased via Buy Now.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if auction_item.end_time <= timezone.now():
            return Response(
                {'detail': 'Cannot update auction items that have already ended.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Handle updating images if new ones are uploaded
        images = request.FILES.getlist('images')
        if images:
            # Example approach: append new images without deleting old ones
            for image in images:
                AuctionImage.objects.create(auction_item=auction_item, image=image)

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticatedOrReadOnly], parser_classes=[JSONParser])
    def bid(self, request, pk=None):
        """
        Custom action to place a bid on an auction item.
        """
        auction_item = self.get_object()

        # Check if auction is still active or has ended
        if auction_item.status == 'active' and auction_item.end_time <= timezone.now():
            auction_item.status = 'closed'
            auction_item.save()
            return Response({'detail': 'Bidding is closed for this item.'}, status=status.HTTP_400_BAD_REQUEST)

        if auction_item.status != 'active':
            return Response({'detail': 'Bidding is closed for this item.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent owner from bidding on their own item
        if auction_item.owner == request.user:
            return Response({'detail': 'Owners cannot bid on their own items.'}, status=status.HTTP_403_FORBIDDEN)

        # Prevent bidding if Buy Now has already been used
        if auction_item.buy_now_buyer is not None:
            return Response({'detail': 'This item has been purchased via Buy Now.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get bid amount
        amount = request.data.get('amount')
        if not amount:
            return Response({'detail': 'Bid amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount))
        except (ValueError, InvalidOperation):
            return Response({'detail': 'Invalid bid amount.'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine the minimum required bid (2% increment)
        min_bid = auction_item.current_bid if auction_item.current_bid else auction_item.starting_bid
        min_increment = (min_bid * Decimal('0.02')).quantize(Decimal('0.01'))
        min_required_bid = (min_bid + min_increment).quantize(Decimal('0.01'))

        # If Buy Now is set, ensure bids do not exceed it
        if auction_item.buy_now_price and amount >= auction_item.buy_now_price:
            return Response(
                {'detail': f'Bid must be less than Buy Now price of ${auction_item.buy_now_price}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if amount < min_required_bid:
            return Response({'detail': f'Bid must be at least ${min_required_bid}.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create the bid
        bid = Bid.objects.create(
            auction_item=auction_item,
            bidder=request.user,
            amount=amount
        )

        # Update the current bid
        auction_item.current_bid = amount
        auction_item.save()

        serializer = BidSerializer(bid)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticatedOrReadOnly], parser_classes=[JSONParser])
    def buy_now(self, request, pk=None):
        """
        Custom action to purchase an auction item via Buy Now.
        """
        auction_item = self.get_object()

        # Check if auction is active
        if auction_item.status != 'active':
            return Response(
                {'detail': 'Cannot Buy Now on this item as the auction is not active.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent owner from buying their own item
        if auction_item.owner == request.user:
            return Response({'detail': 'Owners cannot Buy Now their own items.'}, status=status.HTTP_403_FORBIDDEN)

        # Prevent multiple Buy Now purchases
        if auction_item.buy_now_buyer is not None:
            return Response({'detail': 'This item has already been purchased via Buy Now.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if Buy Now price is set
        if not auction_item.buy_now_price:
            return Response({'detail': 'Buy Now price is not set for this item.'}, status=status.HTTP_400_BAD_REQUEST)

        # (Optional) Check user funds or other business logic here

        # Mark as purchased via Buy Now
        auction_item.buy_now_buyer = request.user
        auction_item.current_bid = auction_item.buy_now_price
        auction_item.status = 'closed'
        auction_item.save()

        # Optionally, set winner if not already done
        if not auction_item.winner and auction_item.bids.exists():
            highest_bid = auction_item.bids.order_by('-amount').first()
            auction_item.winner = highest_bid.bidder
            auction_item.save()

        serializer = AuctionItemSerializer(auction_item)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
        serializer = AuctionItemSerializer(purchases, many=True)
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
            return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ViewSet):
    """
    ViewSet to retrieve authenticated user's details.
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


from rest_framework import generics, permissions

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
