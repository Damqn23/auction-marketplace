    # auctions/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuctionItemViewSet, RegisterView, UserViewSet, BidViewSet, MyPurchasesView, CurrentUserView

router = DefaultRouter()
router.register(r'auction-items', AuctionItemViewSet, basename='auctionitem')
router.register(r'bids', BidViewSet, basename='bid')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
        path('', include(router.urls)),
        path('register/', RegisterView.as_view(), name='register'),
        path('users/me/', CurrentUserView.as_view(), name='current_user'),
        path('my-purchases/', MyPurchasesView.as_view(), name='my-purchases'),  # New Endpoint

    ]
