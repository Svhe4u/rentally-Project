from django.urls import path
from .mongolia_views import (
    MongoliaCitiesAPIView,
    UtilityEstimateAPIView,
    SeasonalTrendsAPIView,
    PopularNeighborhoodsAPIView,
    PopularAreasAPIView,
)
from .views import (
    ListingAPIView,
    ListingDetailAPIView,
    BookingAPIView,
    BookingDetailAPIView,
    ReviewAPIView,
    ReviewDetailAPIView,
    FavoriteAPIView,
    FavoriteDetailAPIView,
    CategoryAPIView,
    CategoryDetailAPIView,
    RegionAPIView,
    RegionDetailAPIView,
    ListingAvailabilityAPIView,
    ListingAvailabilityDetailAPIView,
    ListingDetailsAPIView,
    ListingDetailsDetailAPIView,
    ListingExtraFeatureAPIView,
    ListingExtraFeatureDetailAPIView,
    ListingImageAPIView,
    ListingImageDetailAPIView,
    MessageAPIView,
    MessageDetailAPIView,
    PaymentAPIView,
    PaymentDetailAPIView,
    UserAccountAPIView,
    UserAccountDetailAPIView,
    RegisterAPIView,
    BrokerRegisterAPIView,
    RequestPasswordResetAPIView,
    ResetPasswordAPIView,
    ChangePasswordAPIView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# CRUD endpoints overview:
# - Auth (JWT + register + reset):
#     POST /auth/register/          -> create Django user
#     POST /token/                  -> login (obtain JWT access/refresh)
#     POST /token/refresh/          -> refresh access token
#     POST /auth/forgot-password/   -> request password reset (get uid+token)
#     POST /auth/reset-password/    -> set new password with uid+token
# - Listings:
#     GET  /listings/           -> list listings
#     POST /listings/           -> create listing
#     GET  /listings/<pk>/      -> retrieve listing
#     PUT  /listings/<pk>/      -> update listing
#     DELETE /listings/<pk>/    -> delete listing
# - Bookings:
#     GET  /bookings/           -> list bookings
#     POST /bookings/           -> create booking
#     GET  /bookings/<pk>/      -> retrieve booking
#     PUT  /bookings/<pk>/      -> update booking
#     DELETE /bookings/<pk>/    -> delete booking
# - Reviews:
#     GET  /reviews/            -> list reviews
#     POST /reviews/            -> create review
#     GET  /reviews/<pk>/       -> retrieve review
#     PUT  /reviews/<pk>/       -> update review
#     DELETE /reviews/<pk>/     -> delete review
# - Favorites:
#     GET  /favorites/          -> list favorites
#     POST /favorites/          -> create favorite
#     GET  /favorites/<pk>/     -> retrieve favorite for listing
#     DELETE /favorites/<pk>/   -> delete favorite for listing
# - Categories:
#     GET  /categories/         -> list categories
#     POST /categories/         -> create category
#     GET  /categories/<pk>/    -> retrieve category
#     PUT  /categories/<pk>/    -> update category
#     DELETE /categories/<pk>/  -> delete category
# - Regions:
#     GET  /regions/            -> list regions
#     POST /regions/            -> create region
#     GET  /regions/<pk>/       -> retrieve region
#     PUT  /regions/<pk>/       -> update region
#     DELETE /regions/<pk>/     -> delete region
# - Listing availability:
#     GET  /listing-availability/            -> list availability rows
#     POST /listing-availability/            -> create availability row
#     GET  /listing-availability/<pk>/       -> retrieve availability row
#     PUT  /listing-availability/<pk>/       -> update availability row
#     DELETE /listing-availability/<pk>/     -> delete availability row
# - Listing details:
#     GET  /listing-details/                 -> list listing details
#     POST /listing-details/                 -> create listing details
#     GET  /listing-details/<listing_id>/    -> retrieve details for listing
#     PUT  /listing-details/<listing_id>/    -> update details for listing
#     DELETE /listing-details/<listing_id>/  -> delete details for listing
# - Listing extra features:
#     GET  /listing-extra-features/          -> list extra features
#     POST /listing-extra-features/          -> create extra feature
#     GET  /listing-extra-features/<pk>/     -> retrieve extra feature
#     PUT  /listing-extra-features/<pk>/     -> update extra feature
#     DELETE /listing-extra-features/<pk>/   -> delete extra feature
# - Listing images:
#     GET  /listing-images/                  -> list images
#     POST /listing-images/                  -> create image
#     GET  /listing-images/<pk>/             -> retrieve image
#     PUT  /listing-images/<pk>/             -> update image
#     DELETE /listing-images/<pk>/           -> delete image
# - Messages:
#     GET  /messages/                        -> list messages
#     POST /messages/                        -> create message
#     GET  /messages/<pk>/                   -> retrieve message
#     PUT  /messages/<pk>/                   -> update message
#     DELETE /messages/<pk>/                 -> delete message
# - Payments:
#     GET  /payments/                        -> list payments
#     POST /payments/                        -> create payment
#     GET  /payments/<pk>/                   -> retrieve payment
#     PUT  /payments/<pk>/                   -> update payment
#     DELETE /payments/<pk>/                 -> delete payment
# - Custom users table:
#     GET  /users/                           -> list users
#     POST /users/                           -> create user
#     GET  /users/<pk>/                      -> retrieve user
#     PUT  /users/<pk>/                      -> update user
#     DELETE /users/<pk>/                    -> delete user

urlpatterns = [
    # Mongolia-specific (localization, trends, estimates)
    path("mongolia/cities/", MongoliaCitiesAPIView.as_view(), name="mongolia-cities"),
    path("mongolia/utility-estimate/", UtilityEstimateAPIView.as_view(), name="mongolia-utility-estimate"),
    path("mongolia/seasonal-trends/", SeasonalTrendsAPIView.as_view(), name="mongolia-seasonal-trends"),
    path("mongolia/neighborhoods/", PopularNeighborhoodsAPIView.as_view(), name="mongolia-neighborhoods"),
    path("mongolia/popular-areas/", PopularAreasAPIView.as_view(), name="mongolia-popular-areas"),

    # Auth / JWT
    path("auth/register/", RegisterAPIView.as_view(), name="auth-register"),
    path("auth/broker-register/", BrokerRegisterAPIView.as_view(), name="auth-broker-register"),
    path("auth/forgot-password/", RequestPasswordResetAPIView.as_view(), name="auth-forgot-password"),
    path("auth/reset-password/", ResetPasswordAPIView.as_view(), name="auth-reset-password"),
    path("auth/change-password/", ChangePasswordAPIView.as_view(), name="auth-change-password"),
    
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Listings
    path("listings/", ListingAPIView.as_view(), name="listing-list"),
    path("listings/<int:pk>/", ListingDetailAPIView.as_view(), name="listing-detail"),

    # Bookings
    path("bookings/", BookingAPIView.as_view(), name="booking-list"),
    path("bookings/<int:pk>/", BookingDetailAPIView.as_view(), name="booking-detail"),

    # Reviews
    path("reviews/", ReviewAPIView.as_view(), name="review-list"),
    path("reviews/<int:pk>/", ReviewDetailAPIView.as_view(), name="review-detail"),

    # Favorites
    path("favorites/", FavoriteAPIView.as_view(), name="favorite-list"),
    path("favorites/<int:pk>/", FavoriteDetailAPIView.as_view(), name="favorite-detail"),

    # Categories
    path("categories/", CategoryAPIView.as_view(), name="category-list"),
    path("categories/<int:pk>/", CategoryDetailAPIView.as_view(), name="category-detail"),

    # Regions
    path("regions/", RegionAPIView.as_view(), name="region-list"),
    path("regions/<int:pk>/", RegionDetailAPIView.as_view(), name="region-detail"),

    # Listing availability
    path(
        "listing-availability/",
        ListingAvailabilityAPIView.as_view(),
        name="listing-availability-list",
    ),
    path(
        "listing-availability/<int:pk>/",
        ListingAvailabilityDetailAPIView.as_view(),
        name="listing-availability-detail",
    ),

    # Listing details
    path(
        "listing-details/",
        ListingDetailsAPIView.as_view(),
        name="listing-details-list",
    ),
    path(
        "listing-details/<int:listing_id>/",
        ListingDetailsDetailAPIView.as_view(),
        name="listing-details-detail",
    ),

    # Listing extra features
    path(
        "listing-extra-features/",
        ListingExtraFeatureAPIView.as_view(),
        name="listing-extra-features-list",
    ),
    path(
        "listing-extra-features/<int:pk>/",
        ListingExtraFeatureDetailAPIView.as_view(),
        name="listing-extra-features-detail",
    ),

    # Listing images
    path(
        "listing-images/",
        ListingImageAPIView.as_view(),
        name="listing-images-list",
    ),
    path(
        "listing-images/<int:pk>/",
        ListingImageDetailAPIView.as_view(),
        name="listing-images-detail",
    ),

    # Messages
    path("messages/", MessageAPIView.as_view(), name="message-list"),
    path("messages/<int:pk>/", MessageDetailAPIView.as_view(), name="message-detail"),

    # Payments
    path("payments/", PaymentAPIView.as_view(), name="payment-list"),
    path("payments/<int:pk>/", PaymentDetailAPIView.as_view(), name="payment-detail"),

    # Custom users table
    path("users/", UserAccountAPIView.as_view(), name="useraccount-list"),
    path("users/<int:pk>/", UserAccountDetailAPIView.as_view(), name="useraccount-detail"),
]
