"""
api_views.py - Rentally Backend API
Clean ORM-based views. No raw SQL anywhere.

Fixes over previous version:
  - All write endpoints require authentication
  - Ownership checks on edit/delete
  - BrokerReview requires IsAdminUser
  - Exception handling doesn't expose internals in production
  - Proper 403 vs 401 distinction
  - UserProfile from models used correctly
  - Message uses 'content' field (matches models.py)
  - listing_id param used to send messages (matches Message model)
  - ConversationAPIView marks messages as read on fetch
  - Pagination count fixed (total before slice)
  - No bare except Exception leaking stack traces
"""

from datetime import datetime
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.db.models import Count

from .locale_mn import (
    MONGOLIA_CITIES,
    ULAANBAATAR_DISTRICTS,
    format_mnt,
    get_season_tier,
    estimate_utilities_mnt,
    POPULAR_NEIGHBORHOODS,
    SEASONAL_TRENDS,
)

from .models import (
    Listing, Booking, Review, Favorite, Message,
    Category, Region, Payment, UserProfile, BrokerProfile
)
from .serializers import (
    ListingSerializer, ListingDetailedSerializer, BookingSerializer,
    ReviewSerializer, FavoriteSerializer, MessageSerializer,
    CategorySerializer, RegionSerializer, PaymentSerializer,
    UserProfileSerializer, BrokerProfileSerializer,
)
from .services import (
    ListingService, BookingService, ReviewService, FavoriteService,
    MessageService, PaymentService, SearchService
)


# ─────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────

class APIError:
    """Standardized error responses."""

    @staticmethod
    def bad_request(message):
        return Response({"error": message, "code": "BAD_REQUEST"},
                        status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def not_found(message="Not found"):
        return Response({"error": message, "code": "NOT_FOUND"},
                        status=status.HTTP_404_NOT_FOUND)

    @staticmethod
    def forbidden(message="You do not have permission to perform this action"):
        return Response({"error": message, "code": "FORBIDDEN"},
                        status=status.HTTP_403_FORBIDDEN)

    @staticmethod
    def conflict(message):
        return Response({"error": message, "code": "CONFLICT"},
                        status=status.HTTP_409_CONFLICT)

    @staticmethod
    def server_error(message="Something went wrong. Please try again."):
        # Never expose raw exception messages to clients
        return Response({"error": message, "code": "SERVER_ERROR"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_pagination_params(request):
    """Extract and validate pagination params."""
    try:
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
    except (ValueError, TypeError):
        page, page_size = 1, 20
    return page, page_size


def paginate_queryset(queryset, page, page_size):
    """Return paginated slice + metadata."""
    total = queryset.count()
    offset = (page - 1) * page_size
    results = queryset[offset:offset + page_size]
    return results, {
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size,
    }


# ─────────────────────────────────────────────────────────────────────────
# LISTINGS
# ─────────────────────────────────────────────────────────────────────────

class ListingListAPIView(APIView):
    """
    GET  /api/listings/  — public search with filters
    POST /api/listings/  — create listing (authenticated)
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request):
        filters = {
            'search':      request.query_params.get('search'),
            'category_id': request.query_params.get('category_id'),
            'region_id':   request.query_params.get('region_id'),
            'min_price':   request.query_params.get('min_price'),
            'max_price':   request.query_params.get('max_price'),
            'is_featured': request.query_params.get('is_featured') == 'true',
        }
        # Remove None/empty values
        filters = {k: v for k, v in filters.items() if v}

        page, page_size = get_pagination_params(request)
        result = SearchService.search(filters, page, page_size)

        serializer = ListingSerializer(result['results'], many=True)
        return Response({
            'total':       result['total_count'],
            'page':        result['page'],
            'page_size':   result['page_size'],
            'total_pages': result['total_pages'],
            'results':     serializer.data,
        })

    def post(self, request):
        required = ['title', 'description', 'address', 'price']
        missing = [f for f in required if not request.data.get(f)]
        if missing:
            return APIError.bad_request(f"Required fields missing: {', '.join(missing)}")

        try:
            listing = ListingService.create_listing(request.user, request.data)
            return Response(ListingSerializer(listing).data, status=status.HTTP_201_CREATED)
        except (ValueError, TypeError) as e:
            return APIError.bad_request(str(e))
        except Exception:
            return APIError.server_error()


class ListingDetailAPIView(APIView):
    """
    GET    /api/listings/<pk>/  — public
    PUT    /api/listings/<pk>/  — owner only
    DELETE /api/listings/<pk>/  — owner only (soft delete)
    """

    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, pk):
        listing = ListingService.get_listing_detail(pk)
        if not listing:
            return APIError.not_found("Listing not found")
        return Response(ListingDetailedSerializer(listing).data)

    def put(self, request, pk):
        listing = get_object_or_404(Listing, id=pk)
        if listing.owner != request.user:
            return APIError.forbidden("You can only edit your own listings")
        try:
            updated = ListingService.update_listing(listing, request.data)
            return Response(ListingSerializer(updated).data)
        except (ValueError, TypeError) as e:
            return APIError.bad_request(str(e))
        except Exception:
            return APIError.server_error()

    def delete(self, request, pk):
        listing = get_object_or_404(Listing, id=pk)
        if listing.owner != request.user:
            return APIError.forbidden("You can only delete your own listings")
        ListingService.delete_listing(listing)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────
# BOOKINGS
# ─────────────────────────────────────────────────────────────────────────

class BookingListAPIView(APIView):
    """
    GET  /api/bookings/  — authenticated user's bookings
    POST /api/bookings/  — create booking (authenticated)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get('status')
        bookings = BookingService.get_user_bookings(request.user, status_filter)

        page, page_size = get_pagination_params(request)
        results, meta = paginate_queryset(bookings, page, page_size)

        return Response({'meta': meta, 'results': BookingSerializer(results, many=True).data})

    def post(self, request):
        required = ['listing_id', 'start_date', 'end_date']
        missing = [f for f in required if not request.data.get(f)]
        if missing:
            return APIError.bad_request(f"Required fields missing: {', '.join(missing)}")

        listing = get_object_or_404(Listing, id=request.data.get('listing_id'), status='active')

        try:
            booking = BookingService.create_booking(request.user, listing, request.data)
            return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return APIError.bad_request(str(e))
        except Exception:
            return APIError.server_error()


class BookingDetailAPIView(APIView):
    """
    GET    /api/bookings/<pk>/  — owner only
    PUT    /api/bookings/<pk>/  — update pending booking (owner only)
    DELETE /api/bookings/<pk>/  — cancel booking (owner only)
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_own_booking(self, pk):
        return get_object_or_404(Booking, id=pk, user=request.user)

    def get(self, request, pk):
        booking = get_object_or_404(Booking, id=pk, user=request.user)
        return Response(BookingSerializer(booking).data)

    def put(self, request, pk):
        booking = get_object_or_404(Booking, id=pk, user=request.user)

        if booking.status != 'pending':
            return APIError.bad_request("Only pending bookings can be updated")

        new_status = request.data.get('status', booking.status)
        allowed_by_user = {'pending', 'cancelled'}
        if new_status not in allowed_by_user:
            return APIError.forbidden(f"You can only set status to: {', '.join(allowed_by_user)}")

        for field in ['start_date', 'end_date', 'notes']:
            if field in request.data:
                setattr(booking, field, request.data[field])
        booking.status = new_status

        try:
            booking.full_clean()
            booking.save()
            return Response(BookingSerializer(booking).data)
        except Exception as e:
            return APIError.bad_request(str(e))

    def delete(self, request, pk):
        booking = get_object_or_404(Booking, id=pk, user=request.user)
        try:
            BookingService.cancel_booking(booking)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return APIError.bad_request(str(e))


# ─────────────────────────────────────────────────────────────────────────
# REVIEWS
# ─────────────────────────────────────────────────────────────────────────

class ReviewListAPIView(APIView):
    """
    GET  /api/reviews/?listing_id=X  — public
    POST /api/reviews/               — authenticated
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request):
        listing_id = request.query_params.get('listing_id')
        if not listing_id:
            return APIError.bad_request("listing_id parameter is required")

        listing = get_object_or_404(Listing, id=listing_id)
        data = ReviewService.get_listing_reviews(listing)

        page, page_size = get_pagination_params(request)
        results, meta = paginate_queryset(data['reviews'], page, page_size)

        return Response({
            'meta':           meta,
            'average_rating': data['average_rating'],
            'results':        ReviewSerializer(results, many=True).data,
        })

    def post(self, request):
        if not request.data.get('listing_id') or not request.data.get('rating'):
            return APIError.bad_request("listing_id and rating are required")

        listing = get_object_or_404(Listing, id=request.data.get('listing_id'))

        try:
            review = ReviewService.create_review(request.user, listing, request.data)
            return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return APIError.conflict(str(e))
        except Exception:
            return APIError.server_error()


class ReviewDetailAPIView(APIView):
    """
    GET    /api/reviews/<pk>/  — public
    PUT    /api/reviews/<pk>/  — author only
    DELETE /api/reviews/<pk>/  — author only
    """

    def get_permissions(self):
        if self.request.method in ('PUT', 'DELETE'):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, pk):
        review = get_object_or_404(Review, id=pk)
        return Response(ReviewSerializer(review).data)

    def put(self, request, pk):
        review = get_object_or_404(Review, id=pk)
        if review.user != request.user:
            return APIError.forbidden("You can only edit your own reviews")

        if 'rating' in request.data:
            review.rating = request.data['rating']
        if 'comment' in request.data:
            review.comment = request.data['comment']

        try:
            review.full_clean()
            review.save()
            return Response(ReviewSerializer(review).data)
        except Exception as e:
            return APIError.bad_request(str(e))

    def delete(self, request, pk):
        review = get_object_or_404(Review, id=pk)
        if review.user != request.user:
            return APIError.forbidden("You can only delete your own reviews")
        review.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────────────────────────────────

class FavoriteListAPIView(APIView):
    """
    GET  /api/favorites/  — user's favorites
    POST /api/favorites/  — toggle favorite
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favorites = FavoriteService.get_user_favorites(request.user)
        page, page_size = get_pagination_params(request)
        results, meta = paginate_queryset(favorites, page, page_size)
        return Response({'meta': meta, 'results': FavoriteSerializer(results, many=True).data})

    def post(self, request):
        if not request.data.get('listing_id'):
            return APIError.bad_request("listing_id is required")

        listing = get_object_or_404(Listing, id=request.data.get('listing_id'))
        is_added = FavoriteService.toggle_favorite(request.user, listing)

        return Response({
            "is_favorited": is_added,
            "detail": "Added to favorites" if is_added else "Removed from favorites",
        })


class FavoriteCheckAPIView(APIView):
    """GET /api/favorites/<listing_id>/check/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        listing = get_object_or_404(Listing, id=pk)
        return Response({"is_favorited": FavoriteService.is_favorited(request.user, listing)})


# ─────────────────────────────────────────────────────────────────────────
# MESSAGES
# ─────────────────────────────────────────────────────────────────────────

class MessageListAPIView(APIView):
    """
    GET  /api/messages/  — inbox summary (conversation list)
    POST /api/messages/  — send a message
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        inbox = MessageService.get_inbox(request.user)
        unread_total = MessageService.get_unread_count(request.user)
        return Response({
            "conversations": inbox,
            "unread_total":  unread_total,
        })

    def post(self, request):
        if not request.data.get('recipient_id') or not request.data.get('content'):
            return APIError.bad_request("recipient_id and content are required")

        if len(str(request.data.get('content', ''))) > 2000:
            return APIError.bad_request("Message cannot exceed 2000 characters")

        recipient = get_object_or_404(User, id=request.data.get('recipient_id'))

        # Prevent messaging yourself
        if recipient == request.user:
            return APIError.bad_request("You cannot send a message to yourself")

        # Optional listing context
        listing = None
        if request.data.get('listing_id'):
            listing = get_object_or_404(Listing, id=request.data.get('listing_id'))

        try:
            message = MessageService.send_message(
                sender=request.user,
                recipient=recipient,
                content=request.data.get('content'),
                listing=listing,
            )
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
        except Exception:
            return APIError.server_error()


class ConversationAPIView(APIView):
    """
    GET /api/messages/conversation/<user_id>/
    Returns full conversation thread, marks unread messages as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        other_user = get_object_or_404(User, id=user_id)
        messages = MessageService.get_conversation(request.user, other_user)

        # Mark unread messages sent to current user as read
        for msg in messages:
            if msg.recipient == request.user and not msg.is_read:
                MessageService.mark_as_read(msg)

        return Response({
            "with_user_id":  other_user.id,
            "with_username": other_user.username,
            "message_count": messages.count(),
            "messages":      MessageSerializer(messages, many=True).data,
        })


# ─────────────────────────────────────────────────────────────────────────
# CATEGORIES & REGIONS
# ─────────────────────────────────────────────────────────────────────────

class CategoryListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by('name')
        return Response(CategorySerializer(categories, many=True).data)

    def post(self, request):
        # Only admins should create categories
        if not request.user.is_staff:
            return APIError.forbidden("Only admins can create categories")
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return APIError.bad_request(str(serializer.errors))


class RegionListAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        regions = Region.objects.all().order_by('name')
        return Response(RegionSerializer(regions, many=True).data)

    def post(self, request):
        if not request.user.is_staff:
            return APIError.forbidden("Only admins can create regions")
        serializer = RegionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return APIError.bad_request(str(serializer.errors))


# ─────────────────────────────────────────────────────────────────────────
# USER PROFILE
# ─────────────────────────────────────────────────────────────────────────

class UserProfileAPIView(APIView):
    """
    GET /api/profile/      — own profile
    PUT /api/profile/      — update own profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        # Never allow role or is_verified to be set by user
        safe_data = {k: v for k, v in request.data.items()
                     if k not in ('role', 'is_verified', 'user')}
        serializer = UserProfileSerializer(profile, data=safe_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return APIError.bad_request(str(serializer.errors))


class PublicUserProfileAPIView(APIView):
    """GET /api/users/<pk>/  — public profile (limited fields)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        user = get_object_or_404(User, id=pk)
        profile = UserProfile.objects.filter(user=user).first()
        return Response({
            "id":         user.id,
            "username":   user.username,
            "role":       profile.role if profile else "user",
            "joined":     user.date_joined,
            "listing_count": Listing.objects.filter(owner=user, status='active').count(),
        })


# ─────────────────────────────────────────────────────────────────────────
# BROKER
# ─────────────────────────────────────────────────────────────────────────

class BrokerListAPIView(APIView):
    """GET /api/brokers/  — public list of approved brokers"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        brokers = BrokerProfile.objects.filter(
            status='approved'
        ).select_related('user').order_by('-verified_at')
        return Response(BrokerProfileSerializer(brokers, many=True).data)


class BrokerProfileAPIView(APIView):
    """
    GET /api/brokers/<pk>/  — public
    PUT /api/brokers/<pk>/  — own profile only
    """

    def get_permissions(self):
        if self.request.method == 'PUT':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get(self, request, pk):
        broker = get_object_or_404(BrokerProfile, user_id=pk)
        return Response(BrokerProfileSerializer(broker).data)

    def put(self, request, pk):
        broker = get_object_or_404(BrokerProfile, user_id=pk)
        if broker.user != request.user:
            return APIError.forbidden("You can only edit your own broker profile")

        # Don't allow user to self-approve
        safe_data = {k: v for k, v in request.data.items()
                     if k not in ('status', 'verified_at', 'user')}
        serializer = BrokerProfileSerializer(broker, data=safe_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return APIError.bad_request(str(serializer.errors))


class BrokerApplyAPIView(APIView):
    """
    GET  /api/broker/apply/  — own applications
    POST /api/broker/apply/  — submit application
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        applications = BrokerProfile.objects.filter(user=request.user)
        return Response(BrokerProfileSerializer(applications, many=True).data)

    def post(self, request):
        # Check if already a broker or has pending application
        existing = BrokerProfile.objects.filter(user=request.user).first()
        if existing:
            if existing.status == 'approved':
                return APIError.bad_request("You are already an approved broker")
            if existing.status == 'pending':
                return APIError.bad_request("You already have a pending application")

        serializer = BrokerProfileSerializer(data={**request.data, 'status': 'pending'})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return APIError.bad_request(str(serializer.errors))


class BrokerReviewAPIView(APIView):
    """
    POST /api/broker/applications/<pk>/review/
    ADMIN ONLY — approve or reject broker applications.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        action = request.data.get('action')
        if action not in ('approve', 'reject'):
            return APIError.bad_request("action must be 'approve' or 'reject'")

        broker = get_object_or_404(BrokerProfile, id=pk)

        if broker.status != 'pending':
            return APIError.bad_request(f"Application is already '{broker.status}'")

        from django.utils import timezone
        if action == 'approve':
            broker.status = 'approved'
            broker.verified_at = timezone.now()
            # Promote user role in UserProfile
            profile, _ = UserProfile.objects.get_or_create(user=broker.user)
            profile.role = 'broker'
            profile.save()
        else:
            broker.status = 'rejected'

        broker.save()
        return Response({
            "detail":      "Broker approved." if action == 'approve' else "Application rejected.",
            "application": BrokerProfileSerializer(broker).data,
        })


# ─────────────────────────────────────────────────────────────────────────
# PAYMENTS
# ─────────────────────────────────────────────────────────────────────────

class PaymentAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Only show payments for user's own bookings
        payments = Payment.objects.filter(
            booking__user=request.user
        ).select_related('booking').order_by('-created_at')

        if request.query_params.get('booking_id'):
            payments = payments.filter(booking_id=request.query_params.get('booking_id'))

        page, page_size = get_pagination_params(request)
        results, meta = paginate_queryset(payments, page, page_size)
        return Response({'meta': meta, 'results': PaymentSerializer(results, many=True).data})

    def post(self, request):
        if not request.data.get('booking_id') or not request.data.get('amount'):
            return APIError.bad_request("booking_id and amount are required")

        # Verify booking belongs to user
        booking = get_object_or_404(Booking, id=request.data.get('booking_id'), user=request.user)

        try:
            payment = PaymentService.create_payment(
                booking=booking,
                amount=request.data.get('amount'),
                payment_method=request.data.get('payment_method', 'card'),
            )
            return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
        except Exception:
            return APIError.server_error()


class PaymentDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        payment = get_object_or_404(Payment, id=pk, booking__user=request.user)
        return Response(PaymentSerializer(payment).data)


# ─────────────────────────────────────────────────────────────────────────
# TRENDING & POPULAR
# ─────────────────────────────────────────────────────────────────────────

class TrendingListingsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            days  = int(request.query_params.get('days', 7))
            limit = int(request.query_params.get('limit', 10))
            limit = min(limit, 50)  # Cap at 50
        except (ValueError, TypeError):
            days, limit = 7, 10

        listings = SearchService.trending_listings(days, limit)
        return Response(ListingSerializer(listings, many=True).data)


class PopularListingsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            limit = min(int(request.query_params.get('limit', 10)), 50)
        except (ValueError, TypeError):
            limit = 10

        listings = SearchService.popular_listings(limit)
        return Response(ListingSerializer(listings, many=True).data)


class PopularAreasAPIView(APIView):
    """
    Popular areas ranked by listing count.
    Returns regions with most listings for map highlights.
    ORM-based implementation (replaces raw SQL from mongolia_views.py).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        areas = Region.objects.annotate(
            listing_count=Count('listing')
        ).filter(listing_count__gt=0).order_by('-listing_count')[:20]

        rows = [
            {
                "id": area.id,
                "name": area.name,
                "listing_count": area.listing_count
            }
            for area in areas
        ]
        return Response({"areas": rows})


# ─────────────────────────────────────────────────────────────────────────
# MONGOLIA-SPECIFIC
# ─────────────────────────────────────────────────────────────────────────

class MongoliaCitiesAPIView(APIView):
    """
    List major Mongolian cities and Ulaanbaatar districts.
    Use for filters, region selectors, and location-aware search.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cities = MONGOLIA_CITIES.copy()
        districts = ULAANBAATAR_DISTRICTS.copy()
        return Response({
            "cities": cities,
            "ulaanbaatar_districts": districts,
            "all_regions": cities + districts,
        })


class UtilityEstimateAPIView(APIView):
    """
    Estimate monthly utility cost (MNT) based on apartment area (m²).
    Typical for Ulaanbaatar: heating, electricity, water.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        area = request.query_params.get("area_sqm")
        try:
            area = float(area) if area else None
        except (TypeError, ValueError):
            area = None

        result = estimate_utilities_mnt(area)
        return Response({
            "area_sqm": area,
            "estimated_monthly_mnt": result,
            "formatted": {
                "min": format_mnt(result["min"]),
                "max": format_mnt(result["max"]),
            },
            "note_mn": result.get("note", "Дулаан/цахилгаан/ус"),
        })


class SeasonalTrendsAPIView(APIView):
    """
    Seasonal rental demand tiers for Mongolia.
    High: Sept–Oct, Mar–Apr (school/work season).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        month = request.query_params.get("month")
        if month:
            try:
                m = int(month)
                if 1 <= m <= 12:
                    tier = get_season_tier(m)
                    return Response({
                        "month": m,
                        "tier": tier,
                        "months": {t: months for t, months in SEASONAL_TRENDS.items()},
                    })
            except (TypeError, ValueError):
                pass

        return Response({
            "current_month": datetime.now().month,
            "current_tier": get_season_tier(datetime.now().month),
            "tiers": {
                "high": "Өндөр эрэлт (9, 10, 3, 4-р сар)",
                "medium": "Дунд эрэлт (5, 6, 11-р сар)",
                "low": "Бага эрэлт (1, 2, 7, 8, 12-р сар)",
            },
            "months": SEASONAL_TRENDS,
        })


class PopularNeighborhoodsAPIView(APIView):
    """
    Popular Ulaanbaatar neighborhoods for rental search/filters.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "neighborhoods": POPULAR_NEIGHBORHOODS,
        })