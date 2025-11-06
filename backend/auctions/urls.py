# auctions/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # --- ViewSets (for the Router) ---
    AuctionItemViewSet,
    ChatMessageViewSet,
    NotificationViewSet,
    UserViewSet,
    BidViewSet,
    
    # --- APIViews & Generic Views (for manual paths) ---
    CreateDepositPaymentIntentView,
    RegisterView,
    StripeWebhookView,
    UserBalanceView,
    MyPurchasesView,
    CurrentUserView,
    CategoryListView,
    UserBidsView,
    FavoriteListCreateAPIView,
    FavoriteDeleteAPIView,
    DashboardStatsView,
    
    # --- Unused views removed (logic now in ViewSets) ---
    # SearchAuctionItemsView  <- REMOVED (search is in AuctionItemViewSet)
    # AuctionItemDetailView   <- REMOVED (detail is in AuctionItemViewSet)
)

# 1. ROUTER SETUP
# This is for ViewSets that handle many related URLs
router = DefaultRouter()
router.register(r"auction-items", AuctionItemViewSet, basename="auctionitem")
router.register(r"bids", BidViewSet, basename="bid")
router.register(r"users", UserViewSet, basename="user")
router.register(r"chat", ChatMessageViewSet, basename="chat")
router.register(r"notifications", NotificationViewSet, basename="notification")

# 2. URL PATTERNS
urlpatterns = [
    # All automatic URLs from the router are included here
    # This provides all auction-items/ URLs, chat/ URLs, etc.
    path("", include(router.urls)),
    
    # --- Manual APIView/GenericView URLs ---
    # These are for single, specific endpoints
    path("register/", RegisterView.as_view(), name="register"),
    path("users/me/", CurrentUserView.as_view(), name="current_user"),
    path("my-purchases/", MyPurchasesView.as_view(), name="my-purchases"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("my-bids/", UserBidsView.as_view(), name="my-bids"),
    path("favorites/", FavoriteListCreateAPIView.as_view(), name="favorite-list"),
    path(
        "favorites/<int:id>/", FavoriteDeleteAPIView.as_view(), name="favorite-delete"
    ),
    path("dashboard/", DashboardStatsView.as_view(), name="dashboard-stats"),
    
    # Stripe / Payment URLs
    path(
        "create-deposit-payment-intent/",
        CreateDepositPaymentIntentView.as_view(),
        name="create-deposit-payment-intent",
    ),
    path("stripe-webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("user-balance/", UserBalanceView.as_view(), name="user-balance"),
    
    # --- ALL THE CONFLICTING PATHS ARE NOW REMOVED ---
]
