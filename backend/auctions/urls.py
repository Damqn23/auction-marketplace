# auctions/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuctionItemViewSet, ChatMessageViewSet, RegisterView, SearchAuctionItemsView, UserViewSet, \
    BidViewSet, MyPurchasesView, CurrentUserView, AuctionItemDetailView, CategoryListView, UserBidsView, \
    FavoriteListCreateAPIView, FavoriteDeleteAPIView

router = DefaultRouter()
router.register(r'auction-items', AuctionItemViewSet, basename='auctionitem')
router.register(r'bids', BidViewSet, basename='bid')
router.register(r'users', UserViewSet, basename='user')
router.register(r'chat', ChatMessageViewSet, basename='chat')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('users/me/', CurrentUserView.as_view(), name='current_user'),
    path('my-purchases/', MyPurchasesView.as_view(), name='my-purchases'),  # New Endpoint
    path('auction_items/<int:pk>/', AuctionItemDetailView.as_view(), name='auction-item-detail'),
    path('auction-items/<int:pk>/', AuctionItemDetailView.as_view(), name='auction-item-detail'),
    path('auction-items/search/', SearchAuctionItemsView.as_view(), name='search-auction-items'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('my-bids/', UserBidsView.as_view(), name='my-bids'),
    path('favorites/', FavoriteListCreateAPIView.as_view(), name='favorite-list'),
    path('favorites/<int:id>/', FavoriteDeleteAPIView.as_view(), name='favorite-delete'),
]
