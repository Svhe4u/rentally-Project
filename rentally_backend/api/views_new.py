"""
API Views for Rentally backend.
Clean, service-oriented architecture with proper error handling.
"""

from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Listing, Booking, Review, Favorite, Message, Category, Region, Payment
from .serializers import (
    ListingSerializer, ListingDetailedSerializer, BookingSerializer,
    ReviewSerializer, FavoriteSerializer, MessageSerializer,
    CategorySerializer, RegionSerializer, PaymentSerializer, UserProfileSerializer
)
from .services import (
    ListingService, BookingService, ReviewService, FavoriteService,
    MessageService, PaymentService, SearchService
)


# ─────────────────────────────────────────────────────────────────────────
# UTILITY HELPERS
# ─────────────────────────────────────────────────────────────────────────

class APIErrorResponse:
    """Standardized error responses."""
    
    @staticmethod
    def bad_request(message):
        return Response(
            {"error": message, "code": "BAD_REQUEST"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @staticmethod
    def not_found(message="Not found"):
        return Response(
            {"error": message, "code": "NOT_FOUND"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @staticmethod
    def unauthorized(message="Unauthorized"):
        return Response(
            {"error": message, "code": "UNAUTHORIZED"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    @staticmethod
    def conflict(message):
        return Response(
            {"error": message, "code": "CONFLICT"},
            status=status.HTTP_409_CONFLICT
        )
    
    @staticmethod
    def server_error(message="Internal server error"):
        return Response(
            {"error": message, "code": "SERVER_ERROR"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_pagination_params(request):
    """Extract pagination parameters from request."""
    try:
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
    except (ValueError, TypeError):
        page, page_size = 1, 20
    return page, page_size


# ─────────────────────────────────────────────────────────────────────────
# LISTINGS
# ─────────────────────────────────────────────────────────────────────────

class ListingListAPIView(APIView):
    """List and search listings."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            # Extract filters
            filters = {
                'search': request.query_params.get('search'),
                'category_id': request.query_params.get('category_id'),
                'region_id': request.query_params.get('region_id'),
                'min_price': request.query_params.get('min_price'),
                'max_price': request.query_params.get('max_price'),
                'is_featured': request.query_params.get('is_featured') == 'true',
            }
            
            # Remove None values
            filters = {k: v for k, v in filters.items() if v}
            
            # Get pagination
            page, page_size = get_pagination_params(request)
            
            # Search
            result = SearchService.search(filters, page, page_size)
            
            serializer = ListingSerializer(result['results'], many=True)
            return Response({
                'count': result['total_count'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages'],
                'results': serializer.data
            })
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def post(self, request):
        """Create listing."""
        try:
            # Validate required fields
            required_fields = ['title', 'description', 'address', 'price']
            if not all(request.data.get(f) for f in required_fields):
                return APIErrorResponse.bad_request(
                    f"Required fields: {', '.join(required_fields)}"
                )
            
            # Create listing
            listing = ListingService.create_listing(request.user, request.data)
            serializer = ListingSerializer(listing)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


class ListingDetailAPIView(APIView):
    """Retrieve, update, delete single listing."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, pk):
        try:
            listing = ListingService.get_listing_detail(pk)
            if not listing:
                return APIErrorResponse.not_found("Listing not found")
            
            serializer = ListingDetailedSerializer(listing)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def put(self, request, pk):
        """Update listing."""
        try:
            listing = get_object_or_404(Listing, id=pk)
            
            # Check ownership
            if listing.owner != request.user:
                return APIErrorResponse.unauthorized("You can only edit your own listings")
            
            # Update
            listing = ListingService.update_listing(listing, request.data)
            serializer = ListingSerializer(listing)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def delete(self, request, pk):
        """Delete listing."""
        try:
            listing = get_object_or_404(Listing, id=pk)
            
            # Check ownership
            if listing.owner != request.user:
                return APIErrorResponse.unauthorized("You can only delete your own listings")
            
            ListingService.delete_listing(listing)
            return Response(
                {"detail": "Listing archived successfully"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


# ─────────────────────────────────────────────────────────────────────────
# BOOKINGS
# ─────────────────────────────────────────────────────────────────────────

class BookingListAPIView(APIView):
    """List user bookings."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            status_filter = request.query_params.get('status')
            bookings = BookingService.get_user_bookings(request.user, status_filter)
            
            # Pagination
            page, page_size = get_pagination_params(request)
            paginated = bookings[page * page_size - page_size:page * page_size]
            
            serializer = BookingSerializer(paginated, many=True)
            return Response({
                'count': bookings.count(),
                'results': serializer.data
            })
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def post(self, request):
        """Create booking."""
        try:
            # Validate required fields
            required = ['listing_id', 'start_date', 'end_date']
            if not all(request.data.get(f) for f in required):
                return APIErrorResponse.bad_request(f"Required: {', '.join(required)}")
            
            # Get listing
            listing = get_object_or_404(Listing, id=request.data.get('listing_id'))
            
            # Create booking
            booking = BookingService.create_booking(request.user, listing, request.data)
            serializer = BookingSerializer(booking)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return APIErrorResponse.bad_request(str(e))
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


class BookingDetailAPIView(APIView):
    """Retrieve, update, cancel booking."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            booking = get_object_or_404(Booking, id=pk, user=request.user)
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def put(self, request, pk):
        """Update booking."""
        try:
            booking = get_object_or_404(Booking, id=pk, user=request.user)
            
            if booking.status != 'pending':
                return APIErrorResponse.bad_request(
                    "Can only update pending bookings"
                )
            
            for field in ['start_date', 'end_date', 'status', 'notes']:
                if field in request.data:
                    setattr(booking, field, request.data[field])
            
            booking.full_clean()
            booking.save()
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def delete(self, request, pk):
        """Cancel booking."""
        try:
            booking = get_object_or_404(Booking, id=pk, user=request.user)
            BookingService.cancel_booking(booking)
            return Response(
                {"detail": "Booking cancelled"},
                status=status.HTTP_204_NO_CONTENT
            )
        except ValueError as e:
            return APIErrorResponse.bad_request(str(e))
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


# ─────────────────────────────────────────────────────────────────────────
# REVIEWS
# ─────────────────────────────────────────────────────────────────────────

class ReviewListAPIView(APIView):
    """List reviews for listing."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            listing_id = request.query_params.get('listing_id')
            if not listing_id:
                return APIErrorResponse.bad_request("listing_id parameter required")
            
            listing = get_object_or_404(Listing, id=listing_id)
            review_data = ReviewService.get_listing_reviews(listing)
            
            # Pagination
            page, page_size = get_pagination_params(request)
            reviews = review_data['reviews']
            paginated = reviews[page * page_size - page_size:page * page_size]
            
            serializer = ReviewSerializer(paginated, many=True)
            return Response({
                'count': review_data['total_count'],
                'average_rating': review_data['average_rating'],
                'results': serializer.data
            })
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def post(self, request):
        """Create review."""
        try:
            required = ['listing_id', 'rating']
            if not all(request.data.get(f) for f in required):
                return APIErrorResponse.bad_request(f"Required: {', '.join(required)}")
            
            listing = get_object_or_404(Listing, id=request.data.get('listing_id'))
            review = ReviewService.create_review(request.user, listing, request.data)
            serializer = ReviewSerializer(review)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return APIErrorResponse.conflict(str(e))
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


class ReviewDetailAPIView(APIView):
    """Update, delete review."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            review = get_object_or_404(Review, id=pk)
            serializer = ReviewSerializer(review)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def put(self, request, pk):
        """Update review."""
        try:
            review = get_object_or_404(Review, id=pk, user=request.user)
            
            if 'rating' in request.data:
                review.rating = request.data['rating']
            if 'comment' in request.data:
                review.comment = request.data['comment']
            
            review.full_clean()
            review.save()
            serializer = ReviewSerializer(review)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def delete(self, request, pk):
        """Delete review."""
        try:
            review = get_object_or_404(Review, id=pk, user=request.user)
            review.delete()
            return Response(
                {"detail": "Review deleted"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


# ─────────────────────────────────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────────────────────────────────

class FavoriteListAPIView(APIView):
    """List user's favorite listings."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            favorites = FavoriteService.get_user_favorites(request.user)
            
            # Pagination
            page, page_size = get_pagination_params(request)
            paginated = favorites[page * page_size - page_size:page * page_size]
            
            serializer = FavoriteSerializer(paginated, many=True)
            return Response({
                'count': favorites.count(),
                'results': serializer.data
            })
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def post(self, request):
        """Toggle favorite."""
        try:
            listing_id = request.data.get('listing_id')
            if not listing_id:
                return APIErrorResponse.bad_request("listing_id required")
            
            listing = get_object_or_404(Listing, id=listing_id)
            is_added = FavoriteService.toggle_favorite(request.user, listing)
            
            return Response({
                "detail": "Added to favorites" if is_added else "Removed from favorites",
                "is_favorited": is_added
            })
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


class FavoritesCheckAPIView(APIView):
    """Check if listing is favorited."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            listing = get_object_or_404(Listing, id=pk)
            is_favorited = FavoriteService.is_favorited(request.user, listing)
            return Response({"is_favorited": is_favorited})
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


# ─────────────────────────────────────────────────────────────────────────
# MESSAGES
# ─────────────────────────────────────────────────────────────────────────

class MessageListAPIView(APIView):
    """List conversations and messages."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get all conversations for user."""
        try:
            conversation_ids = MessageService.get_conversations(request.user)
            unread_count = MessageService.get_unread_count(request.user)
            
            return Response({
                "conversation_count": len(conversation_ids),
                "unread_count": unread_count,
                "conversation_user_ids": list(conversation_ids)
            })
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
    
    def post(self, request):
        """Send message."""
        try:
            required = ['recipient_id', 'content']
            if not all(request.data.get(f) for f in required):
                return APIErrorResponse.bad_request(f"Required: {', '.join(required)}")
            
            from django.contrib.auth.models import User
            recipient = get_object_or_404(User, id=request.data.get('recipient_id'))
            
            message = MessageService.send_message(
                sender=request.user,
                recipient=recipient,
                content=request.data.get('content'),
                listing_id=request.data.get('listing_id')
            )
            serializer = MessageSerializer(message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


class ConversationAPIView(APIView):
    """Get conversation between two users."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            from django.contrib.auth.models import User
            other_user = get_object_or_404(User, id=user_id)
            
            messages = MessageService.get_conversation(request.user, other_user)
            serializer = MessageSerializer(messages, many=True)
            
            return Response({
                "with_user_id": other_user.id,
                "with_username": other_user.username,
                "message_count": messages.count(),
                "messages": serializer.data
            })
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


# ─────────────────────────────────────────────────────────────────────────
# CATEGORIES & REGIONS
# ─────────────────────────────────────────────────────────────────────────

class CategoryListAPIView(APIView):
    """List categories."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            categories = Category.objects.all().order_by('name')
            serializer = CategorySerializer(categories, many=True)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


class RegionListAPIView(APIView):
    """List regions."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            regions = Region.objects.all().order_by('name')
            serializer = RegionSerializer(regions, many=True)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


# ─────────────────────────────────────────────────────────────────────────
# TRENDING & POPULAR
# ─────────────────────────────────────────────────────────────────────────

class TrendingListingsAPIView(APIView):
    """Get trending listings."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            days = int(request.query_params.get('days', 7))
            limit = int(request.query_params.get('limit', 10))
            
            listings = SearchService.trending_listings(days, limit)
            serializer = ListingSerializer(listings, many=True)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))


class PopularListingsAPIView(APIView):
    """Get popular listings."""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 10))
            listings = SearchService.popular_listings(limit)
            serializer = ListingSerializer(listings, many=True)
            return Response(serializer.data)
        except Exception as e:
            return APIErrorResponse.server_error(str(e))
