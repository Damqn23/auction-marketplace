# auctions/views/purchases.py

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import AuctionItem
from ..serializers import AuctionItemSerializer


class MyPurchasesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        buy_now_purchases = AuctionItem.objects.filter(buy_now_buyer=user)
        bid_purchases = AuctionItem.objects.filter(winner=user)
        purchases = buy_now_purchases.union(bid_purchases)
        serializer = AuctionItemSerializer(purchases, many=True, context={"request": request})
        return Response(serializer.data, status=200)
