# auctions/views/bids.py

from rest_framework import permissions, viewsets
from ..models import Bid
from ..serializers import BidSerializer


class BidViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only ViewSet for Bid objects; limited to the current user's bids."""

    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Bid.objects.filter(bidder=user).order_by('-timestamp')
        bidder_param = self.request.query_params.get('bidder')
        if bidder_param:
            try:
                if int(bidder_param) == user.id:
                    return qs
            except (TypeError, ValueError):
                pass
        return qs
