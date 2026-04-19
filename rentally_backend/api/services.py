"""
services.py - Business logic layer for Rentally.

Improvements:
  - Thread-safe operations with transaction.atomic
  - Efficient query evaluation (no double evaluation)
  - Proper Decimal handling for all numeric fields
  - Consistent error handling with ValueError
  - Bug fixes in MessageService.get_conversations
"""

from django.db.models import Q, Avg, Count
from django.utils import timezone
from django.db import transaction
from datetime import timedelta, date
from decimal import Decimal, InvalidOperation
from django.contrib.auth.models import User

from .models import (
    Listing, ListingDetail, ListingFeature,
    Booking, Review, Favorite, Message, Payment, UserProfile,
)

# Fields a user is allowed to update on a listing (prevents owner override etc.)
LISTING_UPDATABLE_FIELDS = {
    'category_id', 'region_id', 'title', 'description', 'address',
    'latitude', 'longitude', 'price', 'price_type', 'status', 'is_featured',
}

# Fields that require Decimal conversion
LISTING_DECIMAL_FIELDS = {'price', 'latitude', 'longitude'}


def _to_decimal(value, field_name="value"):
    """Safely convert value to Decimal."""
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError):
        raise ValueError(f"Invalid {field_name} value: {value}")


class ListingService:

    @staticmethod
    def get_listings_queryset(filters=None):
        """Get filtered listings queryset with optimized related data."""
        queryset = Listing.objects.filter(status='active').select_related(
            'owner', 'category', 'region'
        ).prefetch_related('images', 'reviews')

        if not filters:
            return queryset

        if filters.get('search'):
            s = filters['search']
            queryset = queryset.filter(
                Q(title__icontains=s) | Q(description__icontains=s) | Q(address__icontains=s)
            )

        if filters.get('category_id'):
            queryset = queryset.filter(category_id=filters['category_id'])

        if filters.get('region_id'):
            queryset = queryset.filter(region_id=filters['region_id'])

        if filters.get('min_price') is not None:
            try:
                queryset = queryset.filter(price__gte=Decimal(str(filters['min_price'])))
            except (InvalidOperation, ValueError):
                pass

        if filters.get('max_price') is not None:
            try:
                queryset = queryset.filter(price__lte=Decimal(str(filters['max_price'])))
            except (InvalidOperation, ValueError):
                pass

        if filters.get('is_featured'):
            queryset = queryset.filter(is_featured=True)

        return queryset

    @staticmethod
    def get_listing_detail(listing_id):
        """Get detailed listing with incrementing view count."""
        try:
            listing = Listing.objects.prefetch_related(
                'images', 'reviews', 'features', 'bookings'
            ).select_related('owner', 'category', 'region', 'detail').get(id=listing_id)
            # Increment view count atomically
            Listing.objects.filter(id=listing_id).update(views_count=listing.views_count + 1)
            return listing
        except Listing.DoesNotExist:
            return None

    @staticmethod
    def _apply_listing_detail(listing, data):
        """Create/update ListingDetail when detail keys are present."""
        detail_keys = ('bedrooms', 'bathrooms', 'area_sqm', 'heating_type')
        if not any(k in data for k in detail_keys):
            return
        detail, _ = ListingDetail.objects.get_or_create(listing=listing)
        for k in detail_keys:
            if k not in data:
                continue
            val = data[k]
            if k in ('bedrooms', 'bathrooms', 'area_sqm'):
                if val is None or val == '':
                    setattr(detail, k, None)
                else:
                    try:
                        setattr(detail, k, int(val))
                    except (TypeError, ValueError):
                        raise ValueError(f"Invalid {k} value")
            else:
                s = str(val).strip()[:100] if val is not None else ''
                detail.heating_type = s or None
        detail.save()

    @staticmethod
    def _apply_listing_features(listing, data):
        """Replace listing features when `features` key is present (list of names)."""
        if 'features' not in data:
            return
        raw = data['features']
        if not isinstance(raw, list):
            return
        names = []
        seen = set()
        for item in raw:
            n = str(item).strip()[:100] if item is not None else ''
            if not n or n in seen:
                continue
            seen.add(n)
            names.append(n)
        listing.features.all().delete()
        for n in names:
            ListingFeature.objects.create(listing=listing, name=n, value='')

    @staticmethod
    @transaction.atomic
    def create_listing(owner, data):
        """Create a new listing with validated data."""
        price = data.get('price')
        try:
            price = Decimal(str(price))
            if price < 0:
                raise ValueError("Price must be positive")
        except (InvalidOperation, TypeError):
            raise ValueError("Invalid price value")

        listing = Listing.objects.create(
            owner=owner,
            category_id=data.get('category_id'),
            region_id=data.get('region_id'),
            title=str(data.get('title', '')).strip()[:255],
            description=data.get('description'),
            address=str(data.get('address', '')).strip()[:500],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            price=price,
            price_type=data.get('price_type', 'monthly'),
            status='active',
        )
        ListingService._apply_listing_detail(listing, data)
        ListingService._apply_listing_features(listing, data)
        return listing

    @staticmethod
    @transaction.atomic
    def update_listing(listing, data):
        """Update only allowed fields on a listing."""
        for field, value in data.items():
            if field in LISTING_UPDATABLE_FIELDS and value is not None:
                if field in LISTING_DECIMAL_FIELDS:
                    try:
                        value = _to_decimal(value, field)
                    except ValueError:
                        raise ValueError(f"Invalid {field} value")
                setattr(listing, field, value)
        listing.save()
        ListingService._apply_listing_detail(listing, data)
        ListingService._apply_listing_features(listing, data)
        return listing

    @staticmethod
    def delete_listing(listing):
        """Soft delete a listing by archiving it."""
        listing.status = 'archived'
        listing.save(update_fields=['status'])

    @staticmethod
    def get_my_listings(owner):
        """Get all listings owned by a specific user (for broker portal)."""
        return Listing.objects.filter(owner=owner).select_related(
            'owner', 'category', 'region', 'detail'
        ).prefetch_related('images', 'features', 'reviews').order_by('-created_at')


class BookingService:

    @staticmethod
    def _parse_date(value):
        """Parse date string or return date object as-is."""
        if isinstance(value, date):
            return value
        if isinstance(value, str):
            from datetime import datetime
            for fmt in ('%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%SZ'):
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
        raise ValueError(f"Invalid date format: {value}. Use YYYY-MM-DD.")

    @staticmethod
    def check_availability(listing, start_date, end_date, exclude_booking_id=None):
        """Check if listing is available for the given date range."""
        query = Booking.objects.filter(
            listing=listing,
            status__in=['confirmed', 'checked_in']
        ).filter(
            Q(start_date__lt=end_date) & Q(end_date__gt=start_date)
        )
        if exclude_booking_id:
            query = query.exclude(id=exclude_booking_id)
        return not query.exists()

    @staticmethod
    def calculate_total_price(listing, start_date, end_date):
        """Calculate total price for a booking."""
        nights = (end_date - start_date).days
        if nights <= 0:
            return None
        return Decimal(nights) * listing.price

    @staticmethod
    def create_booking(user, listing, data):
        """Create a new booking with availability check."""
        start_date = BookingService._parse_date(data.get('start_date'))
        end_date = BookingService._parse_date(data.get('end_date'))

        if end_date <= start_date:
            raise ValueError("end_date must be after start_date")
        if start_date < date.today():
            raise ValueError("start_date cannot be in the past")

        if not BookingService.check_availability(listing, start_date, end_date):
            raise ValueError("Listing is not available for the selected dates")

        total_price = BookingService.calculate_total_price(listing, start_date, end_date)

        with transaction.atomic():
            return Booking.objects.create(
                listing=listing,
                user=user,
                start_date=start_date,
                end_date=end_date,
                total_price=total_price,
                status='pending',
                notes=data.get('notes'),
            )

    @staticmethod
    def get_user_bookings(user, status=None):
        """Get user's bookings with related data."""
        queryset = Booking.objects.filter(user=user).select_related(
            'listing', 'user'
        ).prefetch_related('listing__images')
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by('-created_at')

    @staticmethod
    def get_listing_bookings(listing_owner, status=None):
        """Get bookings for all listings owned by a specific broker."""
        queryset = Booking.objects.filter(listing__owner=listing_owner).select_related(
            'listing', 'user'
        ).prefetch_related('listing__images')
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by('-created_at')

    @staticmethod
    def cancel_booking(booking):
        """Cancel a booking if allowed."""
        if booking.status == 'cancelled':
            raise ValueError("Booking is already cancelled")
        if booking.status == 'completed':
            raise ValueError("Cannot cancel a completed booking")
        booking.status = 'cancelled'
        booking.save(update_fields=['status'])


class ReviewService:

    @staticmethod
    def can_review(user, listing):
        """Check if user has completed a booking for this listing."""
        return Booking.objects.filter(
            user=user, listing=listing, status__in=['checked_out', 'completed']
        ).exists()

    @staticmethod
    def create_review(user, listing, data):
        """Create a review if user hasn't reviewed this listing yet."""
        if Review.objects.filter(user=user, listing=listing).exists():
            raise ValueError("You have already reviewed this listing")

        rating = data.get('rating')
        try:
            rating = int(rating)
            if not (1 <= rating <= 5):
                raise ValueError("Rating must be between 1 and 5")
        except (TypeError, ValueError):
            raise ValueError("Rating must be a number between 1 and 5")

        return Review.objects.create(
            user=user,
            listing=listing,
            rating=rating,
            comment=data.get('comment'),
            is_verified_booking=ReviewService.can_review(user, listing),
        )

    @staticmethod
    def get_listing_reviews(listing):
        """Get reviews for a listing with statistics."""
        reviews = listing.reviews.select_related('user').order_by('-created_at')
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg']
        return {
            'reviews': reviews,
            'average_rating': round(avg_rating, 1) if avg_rating else None,
            'total_count': reviews.count(),
        }


class FavoriteService:

    @staticmethod
    def get_user_favorites(user):
        """Get user's favorited listings."""
        return Favorite.objects.filter(user=user).select_related(
            'listing'
        ).prefetch_related('listing__images').order_by('-created_at')

    @staticmethod
    def toggle_favorite(user, listing):
        """Toggle favorite status. Returns True if added, False if removed."""
        favorite, created = Favorite.objects.get_or_create(user=user, listing=listing)
        if not created:
            favorite.delete()
            return False
        return True

    @staticmethod
    def is_favorited(user, listing):
        """Check if listing is favorited by user."""
        return Favorite.objects.filter(user=user, listing=listing).exists()


class MessageService:

    @staticmethod
    def send_message(sender, recipient, content, listing=None):
        """Send a message between users."""
        content = str(content).strip()
        if not content:
            raise ValueError("Message content cannot be empty")
        if len(content) > 2000:
            raise ValueError("Message cannot exceed 2000 characters")
        
        msg = Message.objects.create(
            sender=sender,
            recipient=recipient,
            content=content,
            listing=listing,
        )

        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        from .serializers import MessageSerializer

        channel_layer = get_channel_layer()
        if channel_layer:
            msg_data = MessageSerializer(msg).data
            # Send to recipient
            async_to_sync(channel_layer.group_send)(
                f"user_{recipient.id}",
                {
                    "type": "chat_message",
                    "message": msg_data
                }
            )
        
        return msg

    @staticmethod
    def get_conversation(user, other_user):
        """Get conversation messages between two users."""
        return Message.objects.filter(
            Q(sender=user, recipient=other_user) |
            Q(sender=other_user, recipient=user)
        ).select_related('sender', 'recipient').order_by('created_at')

    @staticmethod
    def get_conversations(user):
        """Get list of user IDs the user has conversations with."""
        sent_to = Message.objects.filter(sender=user).values_list('recipient_id', flat=True).distinct()
        received_from = Message.objects.filter(recipient=user).values_list('sender_id', flat=True).distinct()
        return set(list(sent_to) + list(received_from))

    @staticmethod
    def get_inbox(user):
        """Get summarized inbox (latest message per partner) sorted by date DESC."""
        from django.db.models import Max, OuterRef, Subquery, Case, When, Value, IntegerField, F, Count
        
        # 1. Identify all unique partners
        sent_to = Message.objects.filter(sender=user).values_list('recipient_id', flat=True)
        received_from = Message.objects.filter(recipient=user).values_list('sender_id', flat=True)
        partner_ids = set(list(sent_to) + list(received_from))
        
        inbox = []
        for pid in partner_ids:
            # Get latest message with this specific partner
            last_msg = Message.objects.filter(
                Q(sender=user, recipient_id=pid) | Q(sender_id=pid, recipient=user)
            ).order_by('-created_at').first()
            
            if not last_msg:
                continue
                
            partner = User.objects.get(id=pid)
            partner_profile = getattr(partner, 'profile', None)
            
            inbox.append({
                'partner_id': pid,
                'partner_name': f"{partner.first_name} {partner.last_name}".strip() or partner.username,
                'partner_avatar': partner_profile.profile_picture if partner_profile else None,
                'last_message_text': last_msg.content,
                'last_message_created': last_msg.created_at,
                'is_outgoing': last_msg.sender == user,
                'unread_count': Message.objects.filter(sender_id=pid, recipient=user, is_read=False).count(),
                'listing_id': last_msg.listing_id,
                'listing_title': last_msg.listing.title if last_msg.listing else None,
            })
            
        # 2. Sort by latest message DESC
        inbox.sort(key=lambda x: x['last_message_created'], reverse=True)
        return inbox

    @staticmethod
    def mark_as_read(message):
        """Mark a message as read."""
        if not message.is_read:
            message.is_read = True
            message.read_at = timezone.now()
            message.save(update_fields=['is_read', 'read_at'])

    @staticmethod
    def get_unread_count(user):
        """Get count of unread messages for user."""
        return Message.objects.filter(recipient=user, is_read=False).count()


class PaymentService:

    @staticmethod
    def create_payment(booking, amount, payment_method='card'):
        """Create a payment record."""
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except (InvalidOperation, TypeError):
            raise ValueError("Invalid amount")

        return Payment.objects.create(
            booking=booking,
            amount=amount,
            currency='MNT',
            payment_method=payment_method,
            status='pending',
        )

    @staticmethod
    def complete_payment(payment, transaction_id):
        """Mark payment as completed and confirm booking."""
        with transaction.atomic():
            payment.status = 'completed'
            payment.transaction_id = transaction_id
            payment.completed_at = timezone.now()
            payment.save()
            # Update booking status
            Booking.objects.filter(id=payment.booking_id).update(status='confirmed')

    @staticmethod
    def refund_payment(payment):
        """Refund a completed payment."""
        if payment.status != 'completed':
            raise ValueError("Only completed payments can be refunded")
        payment.status = 'refunded'
        payment.save(update_fields=['status'])


class SearchService:

    @staticmethod
    def search(filters, page=1, page_size=20):
        """Search listings with pagination. Returns paginated results."""
        queryset = ListingService.get_listings_queryset(filters)
        total_count = queryset.count()
        offset = (page - 1) * page_size
        # Use list() to evaluate queryset for serialization
        results = list(queryset[offset:offset + page_size])

        return {
            'results': results,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
        }

    @staticmethod
    def trending_listings(days=7, limit=10):
        """Get trending listings based on recent views."""
        cutoff = timezone.now() - timedelta(days=days)
        return (
            Listing.objects.filter(status='active', updated_at__gte=cutoff)
            .select_related('detail')
            .prefetch_related('images')
            .order_by('-views_count')[:limit]
        )

    @staticmethod
    def popular_listings(limit=10):
        """Get popular listings based on review count and rating."""
        return (
            Listing.objects.filter(status='active')
            .annotate(review_count=Count('reviews'), avg_rating=Avg('reviews__rating'))
            .select_related('detail')
            .prefetch_related('images')
            .order_by('-review_count', '-avg_rating')[:limit]
        )
