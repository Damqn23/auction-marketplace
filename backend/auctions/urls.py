    # auctions/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuctionItemViewSet, RegisterView, UserViewSet

router = DefaultRouter()
router.register(r'auction-items', AuctionItemViewSet, basename='auctionitem')

urlpatterns = [
        path('', include(router.urls)),
        path('register/', RegisterView.as_view(), name='register'),
        path('users/me/', UserViewSet.as_view({'get': 'list'}), name='user-me'),  # Add this line


    ]
