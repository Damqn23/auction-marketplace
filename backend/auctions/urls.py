    # auctions/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuctionItemViewSet

router = DefaultRouter()
router.register(r'auction-items', AuctionItemViewSet, basename='auctionitem')

urlpatterns = [
        path('', include(router.urls)),
    ]
