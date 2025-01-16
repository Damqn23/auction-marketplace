    # auctions/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuctionItemViewSet, RegisterView, UserViewSet, BidViewSet, MyPurchasesView, CurrentUserView, AuctionItemDetailView

router = DefaultRouter()
router.register(r'auction-items', AuctionItemViewSet, basename='auctionitem')
router.register(r'bids', BidViewSet, basename='bid')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
        path('', include(router.urls)),
        path('register/', RegisterView.as_view(), name='register'),
        path('users/me/', CurrentUserView.as_view(), name='current_user'),
        path('my-purchases/', MyPurchasesView.as_view(), name='my-purchases'),  # New Endpoint
        path('auction_items/<int:pk>/', AuctionItemDetailView.as_view(), name='auction-item-detail'),
        path('auction-items/<int:pk>/', AuctionItemDetailView.as_view(), name='auction-item-detail'),

    ]
