"""
URL configuration for Rentally API.
Clean, organized routing following best practices.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    # Listings
    ListingListAPIView,
    ListingDetailAPIView,
    ListingImageAPIView,

    # Bookings
    BookingListAPIView,
    BookingDetailAPIView,

    # Reviews
    ReviewListAPIView,
    ReviewDetailAPIView,

    # Favorites
    FavoriteListAPIView,
    FavoriteCheckAPIView,

    # Messages
    MessageListAPIView,
    ConversationAPIView,

    # Categories & Regions
    CategoryListAPIView,
    RegionListAPIView,

    # Trending & Popular
    TrendingListingsAPIView,
    PopularListingsAPIView,
    PopularAreasAPIView,

    # User Profiles
    UserProfileAPIView,
    PublicUserProfileAPIView,

    # Broker System
    BrokerListAPIView,
    BrokerProfileAPIView,
    BrokerApplyAPIView,
    BrokerReviewAPIView,

    # Payments
    PaymentAPIView,
    PaymentDetailAPIView,

    # Mongolia-specific
    MongoliaCitiesAPIView,
    UtilityEstimateAPIView,
    SeasonalTrendsAPIView,
    PopularNeighborhoodsAPIView,
)

from .auth_views import (
    RegisterAPIView,
    LoginResponseAPIView,
    ChangePasswordAPIView,
    UserRoleInfoAPIView,
)

app_name = "api"

urlpatterns = [

    # ───────────────────── AUTH (JWT) ─────────────────────
    path("auth/token/", TokenObtainPairView.as_view(), name="token-obtain"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    # ───────────────────── CUSTOM AUTH ─────────────────────
    path("auth/register/", RegisterAPIView.as_view(), name="auth-register"),
    path("auth/login/", LoginResponseAPIView.as_view(), name="auth-login"),
    path("auth/change-password/", ChangePasswordAPIView.as_view(), name="auth-change-password"),
    path("auth/role/", UserRoleInfoAPIView.as_view(), name="auth-role"),
    path("auth/broker-apply/", BrokerApplyAPIView.as_view(), name="auth-broker-apply"),

    # ───────────────────── LISTINGS ─────────────────────
    path("listings/", ListingListAPIView.as_view(), name="listing-list"),
    path("listings/<int:pk>/", ListingDetailAPIView.as_view(), name="listing-detail"),
    path("listing-images/", ListingImageAPIView.as_view(), name="listing-image-list"),
    path("listings/trending/", TrendingListingsAPIView.as_view(), name="trending-listings"),
    path("listings/popular/", PopularListingsAPIView.as_view(), name="popular-listings"),

    # ───────────────────── BOOKINGS ─────────────────────
    path("bookings/", BookingListAPIView.as_view(), name="booking-list"),
    path("bookings/<int:pk>/", BookingDetailAPIView.as_view(), name="booking-detail"),

    # ───────────────────── REVIEWS ─────────────────────
    path("reviews/", ReviewListAPIView.as_view(), name="review-list"),
    path("reviews/<int:pk>/", ReviewDetailAPIView.as_view(), name="review-detail"),

    # ───────────────────── FAVORITES ─────────────────────
    path("favorites/", FavoriteListAPIView.as_view(), name="favorite-list"),
    path("favorites/<int:pk>/check/", FavoriteCheckAPIView.as_view(), name="favorite-check"),

    # ───────────────────── MESSAGES ─────────────────────
    path("messages/", MessageListAPIView.as_view(), name="message-list"),
    path("messages/<int:user_id>/", ConversationAPIView.as_view(), name="conversation"),

    # ───────────────────── CATEGORIES & REGIONS ─────────────────────
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("regions/", RegionListAPIView.as_view(), name="region-list"),

    # ───────────────────── USER PROFILES ─────────────────────
    path("profile/", UserProfileAPIView.as_view(), name="user-profile"),
    path("users/<int:pk>/", PublicUserProfileAPIView.as_view(), name="public-user-profile"),

    # ───────────────────── BROKER SYSTEM ─────────────────────
    path("brokers/", BrokerListAPIView.as_view(), name="broker-list"),
    path("brokers/<int:pk>/", BrokerProfileAPIView.as_view(), name="broker-profile"),
    path("brokers/apply/", BrokerApplyAPIView.as_view(), name="broker-apply"),
    path("brokers/<int:pk>/review/", BrokerReviewAPIView.as_view(), name="broker-review"),

    # ───────────────────── PAYMENTS ─────────────────────
    path("payments/", PaymentAPIView.as_view(), name="payment-list"),
    path("payments/<int:pk>/", PaymentDetailAPIView.as_view(), name="payment-detail"),

    # ───────────────────── TRENDING & POPULAR ─────────────────────
    path("areas/popular/", PopularAreasAPIView.as_view(), name="popular-areas"),

    # ───────────────────── MONGOLIA-SPECIFIC ─────────────────────
    path("mongolia/cities/", MongoliaCitiesAPIView.as_view(), name="mongolia-cities"),
    path("mongolia/utility-estimate/", UtilityEstimateAPIView.as_view(), name="mongolia-utility-estimate"),
    path("mongolia/seasonal-trends/", SeasonalTrendsAPIView.as_view(), name="mongolia-seasonal-trends"),
    path("mongolia/neighborhoods/", PopularNeighborhoodsAPIView.as_view(), name="mongolia-neighborhoods"),
]