"""
URL configuration for Rentally API.
Clean, organized routing following best practices.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views_new import (
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
    FavoritesCheckAPIView,
    # Messages
    MessageListAPIView,
    ConversationAPIView,
    # Categories & Regions
    CategoryListAPIView,
    RegionListAPIView,
    # Trending & Popular
    TrendingListingsAPIView,
    PopularListingsAPIView,
)

app_name = 'api'

urlpatterns = [
    # ─────────────────────────────────────────────────────────────────────
    # AUTH (JWT)
    # ─────────────────────────────────────────────────────────────────────
    path('auth/token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # ─────────────────────────────────────────────────────────────────────
    # LISTINGS
    # ─────────────────────────────────────────────────────────────────────
    path('listings/', ListingListAPIView.as_view(), name='listing-list'),
    path('listings/<int:pk>/', ListingDetailAPIView.as_view(), name='listing-detail'),
    
    # ─────────────────────────────────────────────────────────────────────
    # BOOKINGS
    # ─────────────────────────────────────────────────────────────────────
    path('bookings/', BookingListAPIView.as_view(), name='booking-list'),
    path('bookings/<int:pk>/', BookingDetailAPIView.as_view(), name='booking-detail'),
    
    # ─────────────────────────────────────────────────────────────────────
    # REVIEWS
    # ─────────────────────────────────────────────────────────────────────
    path('reviews/', ReviewListAPIView.as_view(), name='review-list'),
    path('reviews/<int:pk>/', ReviewDetailAPIView.as_view(), name='review-detail'),
    
    # ─────────────────────────────────────────────────────────────────────
    # FAVORITES
    # ─────────────────────────────────────────────────────────────────────
    path('favorites/', FavoriteListAPIView.as_view(), name='favorite-list'),
    path('favorites/<int:pk>/check/', FavoritesCheckAPIView.as_view(), name='favorite-check'),
    
    # ─────────────────────────────────────────────────────────────────────
    # MESSAGES
    # ─────────────────────────────────────────────────────────────────────
    path('messages/', MessageListAPIView.as_view(), name='message-list'),
    path('messages/<int:user_id>/', ConversationAPIView.as_view(), name='conversation'),
    
    # ─────────────────────────────────────────────────────────────────────
    # CATEGORIES & REGIONS
    # ─────────────────────────────────────────────────────────────────────
    path('categories/', CategoryListAPIView.as_view(), name='category-list'),
    path('regions/', RegionListAPIView.as_view(), name='region-list'),
    
    # ─────────────────────────────────────────────────────────────────────
    # TRENDING & POPULAR
    # ─────────────────────────────────────────────────────────────────────
    path('listings/trending/', TrendingListingsAPIView.as_view(), name='trending-listings'),
    path('listings/popular/', PopularListingsAPIView.as_view(), name='popular-listings'),
]
