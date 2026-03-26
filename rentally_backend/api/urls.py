from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .mongolia_views import (
    MongoliaCitiesAPIView,
    UtilityEstimateAPIView,
    SeasonalTrendsAPIView,
    PopularNeighborhoodsAPIView,
    PopularAreasAPIView,
)
from .views import (
    # Listings
    ListingAPIView,
    ListingDetailAPIView,
    ListingFullDetailAPIView,
    # Listing sub-resources
    ListingAvailabilityAPIView,
    ListingAvailabilityDetailAPIView,
    ListingDetailsAPIView,
    ListingDetailsDetailAPIView,
    ListingExtraFeatureAPIView,
    ListingExtraFeatureDetailAPIView,
    ListingImageAPIView,
    ListingImageDetailAPIView,
    # Bookings
    BookingAPIView,
    BookingDetailAPIView,
    # Reviews
    ReviewAPIView,
    ReviewDetailAPIView,
    # Favorites
    FavoriteAPIView,
    FavoriteDetailAPIView,
    # Categories & Regions
    CategoryAPIView,
    CategoryDetailAPIView,
    RegionAPIView,
    RegionDetailAPIView,
    # Messages
    MessageAPIView,
    MessageDetailAPIView,
    MessageThreadsAPIView,
    # Payments
    PaymentAPIView,
    PaymentDetailAPIView,
    # Users
    UserAccountAPIView,
    UserAccountDetailAPIView,
    # Auth
    RegisterAPIView,
    RequestPasswordResetAPIView,
    ResetPasswordAPIView,
    ChangePasswordAPIView,
    # Broker system
    BrokerApplyAPIView,
    BrokerReviewAPIView,
    BrokerApplicationListAPIView,
    BrokerListAPIView,
    BrokerProfileAPIView,
)

urlpatterns = [

    # -------------------------------------------------------------------------
    # JWT
    # -------------------------------------------------------------------------
    path("token/",         TokenObtainPairView.as_view(), name="token-obtain"),
    path("token/refresh/", TokenRefreshView.as_view(),    name="token-refresh"),

    # -------------------------------------------------------------------------
    # Auth
    # -------------------------------------------------------------------------
    path("auth/register/",        RegisterAPIView.as_view(),             name="auth-register"),
    path("auth/forgot-password/", RequestPasswordResetAPIView.as_view(), name="auth-forgot-password"),
    path("auth/reset-password/",  ResetPasswordAPIView.as_view(),        name="auth-reset-password"),
    path("auth/change-password/", ChangePasswordAPIView.as_view(),       name="auth-change-password"),

    # -------------------------------------------------------------------------
    # Broker — application flow
    # -------------------------------------------------------------------------
    path("auth/broker-apply/",                 BrokerApplyAPIView.as_view(),           name="broker-apply"),
    path("auth/broker-apply/<int:pk>/review/", BrokerReviewAPIView.as_view(),          name="broker-review"),
    path("broker/applications/",               BrokerApplicationListAPIView.as_view(), name="broker-application-list"),

    # -------------------------------------------------------------------------
    # Broker — public profiles
    # -------------------------------------------------------------------------
    path("brokers/",               BrokerListAPIView.as_view(),    name="broker-list"),
    path("brokers/<int:user_id>/", BrokerProfileAPIView.as_view(), name="broker-profile"),

    # -------------------------------------------------------------------------
    # Listings
    # -------------------------------------------------------------------------
    path("listings/",              ListingAPIView.as_view(),           name="listing-list"),
    path("listings/<int:pk>/",     ListingDetailAPIView.as_view(),     name="listing-detail"),
    path("listings/<int:pk>/full/",ListingFullDetailAPIView.as_view(), name="listing-full-detail"),

    # Listing sub-resources
    path("listing-availability/",              ListingAvailabilityAPIView.as_view(),        name="listing-availability-list"),
    path("listing-availability/<int:pk>/",     ListingAvailabilityDetailAPIView.as_view(),  name="listing-availability-detail"),
    path("listing-details/",                   ListingDetailsAPIView.as_view(),             name="listing-details-list"),
    path("listing-details/<int:listing_id>/",  ListingDetailsDetailAPIView.as_view(),       name="listing-details-detail"),
    path("listing-extra-features/",            ListingExtraFeatureAPIView.as_view(),        name="listing-extra-features-list"),
    path("listing-extra-features/<int:pk>/",   ListingExtraFeatureDetailAPIView.as_view(),  name="listing-extra-features-detail"),
    path("listing-images/",                    ListingImageAPIView.as_view(),               name="listing-images-list"),
    path("listing-images/<int:pk>/",           ListingImageDetailAPIView.as_view(),         name="listing-images-detail"),

    # -------------------------------------------------------------------------
    # Bookings
    # -------------------------------------------------------------------------
    path("bookings/",          BookingAPIView.as_view(),       name="booking-list"),
    path("bookings/<int:pk>/", BookingDetailAPIView.as_view(), name="booking-detail"),

    # -------------------------------------------------------------------------
    # Reviews
    # -------------------------------------------------------------------------
    path("reviews/",          ReviewAPIView.as_view(),       name="review-list"),
    path("reviews/<int:pk>/", ReviewDetailAPIView.as_view(), name="review-detail"),

    # -------------------------------------------------------------------------
    # Favorites
    # -------------------------------------------------------------------------
    path("favorites/",          FavoriteAPIView.as_view(),       name="favorite-list"),
    path("favorites/<int:pk>/", FavoriteDetailAPIView.as_view(), name="favorite-detail"),

    # -------------------------------------------------------------------------
    # Categories & Regions
    # -------------------------------------------------------------------------
    path("categories/",          CategoryAPIView.as_view(),       name="category-list"),
    path("categories/<int:pk>/", CategoryDetailAPIView.as_view(), name="category-detail"),
    path("regions/",             RegionAPIView.as_view(),         name="region-list"),
    path("regions/<int:pk>/",    RegionDetailAPIView.as_view(),   name="region-detail"),

    # -------------------------------------------------------------------------
    # Messages
    # -------------------------------------------------------------------------
    path("messages/",          MessageAPIView.as_view(),        name="message-list"),
    path("messages/threads/",  MessageThreadsAPIView.as_view(), name="message-threads"),
    path("messages/<int:pk>/", MessageDetailAPIView.as_view(), name="message-detail"),

    # -------------------------------------------------------------------------
    # Payments
    # -------------------------------------------------------------------------
    path("payments/",          PaymentAPIView.as_view(),       name="payment-list"),
    path("payments/<int:pk>/", PaymentDetailAPIView.as_view(), name="payment-detail"),

    # -------------------------------------------------------------------------
    # Users
    # -------------------------------------------------------------------------
    path("users/",          UserAccountAPIView.as_view(),       name="useraccount-list"),
    path("users/<int:pk>/", UserAccountDetailAPIView.as_view(), name="useraccount-detail"),

    # -------------------------------------------------------------------------
    # Mongolia-specific
    # -------------------------------------------------------------------------
    path("mongolia/cities/",          MongoliaCitiesAPIView.as_view(),        name="mongolia-cities"),
    path("mongolia/utility-estimate/",UtilityEstimateAPIView.as_view(),       name="mongolia-utility-estimate"),
    path("mongolia/seasonal-trends/", SeasonalTrendsAPIView.as_view(),        name="mongolia-seasonal-trends"),
    path("mongolia/neighborhoods/",   PopularNeighborhoodsAPIView.as_view(),  name="mongolia-neighborhoods"),
    path("mongolia/popular-areas/",   PopularAreasAPIView.as_view(),          name="mongolia-popular-areas"),
]