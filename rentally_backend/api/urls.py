"""
urls.py - API URL Configuration for Rentally.

Organized by resource type with consistent naming:
  - List views: *ListAPIView
  - Detail views: *DetailAPIView
  - Action views: Descriptive names
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    # Listings
    ListingListAPIView,
    ListingDetailAPIView,
    # Bookings
    BookingListAPIView,
    BookingDetailAPIView,
    # Reviews
    ReviewListAPIView,
    ReviewDetailAPIView,
    # Favorites
    FavoriteListAPIView,
    FavoriteCheckAPIView,
    # Categories & Regions
    CategoryListAPIView,
    RegionListAPIView,
    # Messages
    MessageListAPIView,
    ConversationAPIView,
    # Payments
    PaymentAPIView,
    PaymentDetailAPIView,
    # User Profiles
    UserProfileAPIView,
    PublicUserProfileAPIView,
    # Broker system
    BrokerApplyAPIView,
    BrokerReviewAPIView,
    BrokerListAPIView,
    BrokerProfileAPIView,
    # Trending & Popular
    TrendingListingsAPIView,
    PopularListingsAPIView,
    PopularAreasAPIView,
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

urlpatterns = [
    # -------------------------------------------------------------------------
    # JWT Authentication
    # -------------------------------------------------------------------------
    path("token/", TokenObtainPairView.as_view(), name="token-obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    # -------------------------------------------------------------------------
    # Custom Auth Endpoints (with role support)
    # -------------------------------------------------------------------------
    path("auth/register/", RegisterAPIView.as_view(), name="auth-register"),
    path("auth/login/", LoginResponseAPIView.as_view(), name="auth-login"),
    path("auth/change-password/", ChangePasswordAPIView.as_view(), name="auth-change-password"),
    path("auth/role/", UserRoleInfoAPIView.as_view(), name="auth-role"),

    # -------------------------------------------------------------------------
    # Broker System
    # -------------------------------------------------------------------------
    # Application flow
    path("brokers/apply/", BrokerApplyAPIView.as_view(), name="broker-apply"),
    path("brokers/apply/<int:pk>/review/", BrokerReviewAPIView.as_view(), name="broker-review"),
    # Public profiles
    path("brokers/", BrokerListAPIView.as_view(), name="broker-list"),
    path("brokers/<int:pk>/", BrokerProfileAPIView.as_view(), name="broker-profile"),

    # -------------------------------------------------------------------------
    # Listings
    # -------------------------------------------------------------------------
    path("listings/", ListingListAPIView.as_view(), name="listing-list"),
    path("listings/<int:pk>/", ListingDetailAPIView.as_view(), name="listing-detail"),

    # -------------------------------------------------------------------------
    # Bookings
    # -------------------------------------------------------------------------
    path("bookings/", BookingListAPIView.as_view(), name="booking-list"),
    path("bookings/<int:pk>/", BookingDetailAPIView.as_view(), name="booking-detail"),

    # -------------------------------------------------------------------------
    # Reviews
    # -------------------------------------------------------------------------
    path("reviews/", ReviewListAPIView.as_view(), name="review-list"),
    path("reviews/<int:pk>/", ReviewDetailAPIView.as_view(), name="review-detail"),

    # -------------------------------------------------------------------------
    # Favorites
    # -------------------------------------------------------------------------
    path("favorites/", FavoriteListAPIView.as_view(), name="favorite-list"),
    path("favorites/<int:pk>/check/", FavoriteCheckAPIView.as_view(), name="favorite-check"),

    # -------------------------------------------------------------------------
    # Categories & Regions
    # -------------------------------------------------------------------------
    path("categories/", CategoryListAPIView.as_view(), name="category-list"),
    path("regions/", RegionListAPIView.as_view(), name="region-list"),

    # -------------------------------------------------------------------------
    # Messages
    # -------------------------------------------------------------------------
    path("messages/", MessageListAPIView.as_view(), name="message-list"),
    path("messages/conversation/<int:user_id>/", ConversationAPIView.as_view(), name="message-conversation"),

    # -------------------------------------------------------------------------
    # Payments
    # -------------------------------------------------------------------------
    path("payments/", PaymentAPIView.as_view(), name="payment-list"),
    path("payments/<int:pk>/", PaymentDetailAPIView.as_view(), name="payment-detail"),

    # -------------------------------------------------------------------------
    # User Profile
    # -------------------------------------------------------------------------
    path("profile/", UserProfileAPIView.as_view(), name="user-profile"),
    path("users/<int:pk>/", PublicUserProfileAPIView.as_view(), name="public-user-profile"),

    # -------------------------------------------------------------------------
    # Trending & Popular
    # -------------------------------------------------------------------------
    path("listings/trending/", TrendingListingsAPIView.as_view(), name="listing-trending"),
    path("listings/popular/", PopularListingsAPIView.as_view(), name="listing-popular"),
    path("areas/popular/", PopularAreasAPIView.as_view(), name="areas-popular"),

    # -------------------------------------------------------------------------
    # Mongolia-specific
    # -------------------------------------------------------------------------
    path("mongolia/cities/", MongoliaCitiesAPIView.as_view(), name="mongolia-cities"),
    path("mongolia/utility-estimate/", UtilityEstimateAPIView.as_view(), name="mongolia-utility-estimate"),
    path("mongolia/seasonal-trends/", SeasonalTrendsAPIView.as_view(), name="mongolia-seasonal-trends"),
    path("mongolia/neighborhoods/", PopularNeighborhoodsAPIView.as_view(), name="mongolia-neighborhoods"),
]
