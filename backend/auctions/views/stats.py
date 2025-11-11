# auctions/views/stats.py

from datetime import timedelta
from django.utils import timezone
from django.db.models import Q, Sum, Avg
from django.db.models.functions import TruncDay, TruncMonth
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics
from rest_framework.response import Response

from ..models import AuctionItem, Bid, Category
from ..serializers import CategorySerializer


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        period = request.query_params.get("period", "month")
        category_filter = request.query_params.get("category", None)

        total_published = AuctionItem.objects.filter(owner=user).count()
        active_auctions = AuctionItem.objects.filter(owner=user, status="active", end_time__gt=timezone.now()).count()

        closed_auctions = AuctionItem.objects.filter(owner=user).filter(Q(status="closed") | Q(end_time__lte=timezone.now()))

        if category_filter:
            closed_auctions = closed_auctions.filter(category__name__icontains=category_filter)

        total_revenue = closed_auctions.aggregate(total=Sum("current_bid"))["total"] or 0
        average_sale = closed_auctions.aggregate(avg=Avg("current_bid"))["avg"] or 0
        average_bid = Bid.objects.filter(bidder=user).aggregate(avg=Avg("amount"))["avg"] or 0

        now = timezone.now()
        if period == "week":
            start_date = now - timedelta(days=7)
            trunc_func = TruncDay
        elif period == "year":
            start_date = now - timedelta(days=365)
            trunc_func = TruncMonth
        else:
            start_date = now - timedelta(days=30)
            trunc_func = TruncDay

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

        pie_data_qs = closed_auctions.values("category__name").annotate(total=Sum("current_bid"))
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
