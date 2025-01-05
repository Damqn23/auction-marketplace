from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from .models import AuctionItem, Bid
from .serializers import UserSerializer
from decimal import Decimal, InvalidOperation
from django.utils import timezone
from .serializers import AuctionItemSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.decorators import action, parser_classes
from django.contrib.auth.models import User
from .models import AuctionItem
from .serializers import AuctionItemSerializer, UserRegistrationSerializer, BidSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .permissions import IsOwnerOrReadOnly, IsBidderOrReadOnly  # Import the custom permission

class AuctionItemViewSet(viewsets.ModelViewSet):
    queryset = AuctionItem.objects.all()
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]  # Include JSONParser

    def get_queryset(self):
        # Before returning the queryset, update the status of auctions that have ended
        current_time = timezone.now()
        active_auctions = AuctionItem.objects.filter(status='active', end_time__lte=current_time)
        active_auctions.update(status='closed')
        return super().get_queryset()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        auction_item = self.get_object()
        if auction_item.bids.exists():
            return Response(
                {'detail': 'Cannot delete auction items that have received bids.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        auction_item = self.get_object()

        # Check if auction has received any bids
        if auction_item.bids.exists():
            return Response(
                {'detail': 'Cannot update auction items that have received bids.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the auction has already ended
        if auction_item.end_time <= timezone.now():
            return Response(
                {'detail': 'Cannot update auction items that have already ended.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticatedOrReadOnly], parser_classes=[JSONParser])
    def bid(self, request, pk=None):
        auction_item = self.get_object()

        # Update status if auction has ended
        if auction_item.status == 'active' and auction_item.end_time <= timezone.now():
            auction_item.status = 'closed'
            auction_item.save()
            return Response({'detail': 'Bidding is closed for this item.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if auction is active
        if auction_item.status != 'active':
            return Response({'detail': 'Bidding is closed for this item.'}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent the owner from bidding on their own item
        if auction_item.owner == request.user:
            return Response({'detail': 'Owners cannot bid on their own items.'}, status=status.HTTP_403_FORBIDDEN)

        # Get bid amount from request data
        amount = request.data.get('amount')
        if not amount:
            return Response({'detail': 'Bid amount is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Convert amount to Decimal
            amount = Decimal(str(amount))
        except (ValueError, InvalidOperation):
            return Response({'detail': 'Invalid bid amount.'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine the minimum bid (2% increment)
        min_bid = auction_item.current_bid if auction_item.current_bid else auction_item.starting_bid
        min_increment = (min_bid * Decimal('0.02')).quantize(Decimal('0.01'))
        min_required_bid = (min_bid + min_increment).quantize(Decimal('0.01'))

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



class BidViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [IsBidderOrReadOnly]

from rest_framework.views import APIView

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)