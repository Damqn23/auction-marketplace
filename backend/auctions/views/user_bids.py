# auctions/views/user_bids.py

from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import AuctionItem, Bid
from ..serializers import AuctionItemSerializer


class UserBidsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_bids = Bid.objects.filter(bidder=user).values_list("auction_item", flat=True).distinct()
        auctions = AuctionItem.objects.filter(id__in=user_bids)
        now = timezone.now()

        winning_now = []
        won = []
        losing_now = []
        lost = []

        for auction in auctions:
            highest_bid = auction.bids.order_by("-amount").first()
            if auction.status == "active" and auction.end_time > now:
                if highest_bid and highest_bid.bidder == user:
                    winning_now.append(auction)
                else:
                    losing_now.append(auction)
            else:
                if auction.winner == user:
                    won.append(auction)
                else:
                    lost.append(auction)

        data = {
            "winning_now": AuctionItemSerializer(winning_now, many=True, context={"request": request}).data,
            "won": AuctionItemSerializer(won, many=True, context={"request": request}).data,
            "losing_now": AuctionItemSerializer(losing_now, many=True, context={"request": request}).data,
            "lost": AuctionItemSerializer(lost, many=True, context={"request": request}).data,
        }
        return Response(data)
