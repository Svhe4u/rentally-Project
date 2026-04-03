"""
Service layer for business logic.
Separates complex operations from views for better maintainability.
"""

from django.db.models import Q, Avg, Count
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import (
    Listing, Booking, Review, Favorite, Message, Payment, UserProfile
)


class ListingService:
    """Service for listing operations."""
    
    @staticmethod
    def get_listings_queryset(filters=None):
        """Get filtered listings with optimized queries."""
        queryset = Listing.objects.filter(status='active').select_related(
            'owner', 'category', 'region'
        ).prefetch_related('images', 'reviews')
        
        if not filters:
            return queryset
        
        if filters.get('search'):
            search = filters['search']
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search)
            )
        
        if filters.get('category_id'):
            queryset = queryset.filter(category_id=filters['category_id'])
        
        if filters.get('region_id'):
            queryset = queryset.filter(region_id=filters['region_id'])
        
        if filters.get('min_price') is not None:
            queryset = queryset.filter(price__gte=filters['min_price'])
        
        if filters.get('max_price') is not None:
            queryset = queryset.filter(price__lte=filters['max_price'])
        
        if filters.get('is_featured'):
            queryset = queryset.filter(is_featured=True)
        
        return queryset
    
    @staticmethod
    def get_listing_detail(listing_id):
        """Get detailed listing info with stats."""
        try:
            listing = Listing.objects.prefetch_related(
                'images', 'reviews', 'features', 'bookings'
            ).select_related('owner', 'category', 'region', 'detail').get(id=listing_id)
            
            # Increment view count async (in production use Celery)
            listing.views_count += 1
            listing.save(update_fields=['views_count'])
            
            return listing
        except Listing.DoesNotExist:
            return None
    
    @staticmethod
    def create_listing(owner, data):
        """Create listing with validation."""
        listing = Listing.objects.create(
            owner=owner,
            category_id=data.get('category_id'),
            region_id=data.get('region_id'),
            title=data.get('title'),
            description=data.get('description'),
            address=data.get('address'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            price=data.get('price'),
            price_type=data.get('price_type', 'monthly'),
            status=data.get('status', 'active')
        )
        return listing
    
    @staticmethod
    def update_listing(listing, data):
        """Update listing with validation."""
        for field, value in data.items():
            if hasattr(listing, field) and value is not None:
                setattr(listing, field, value)
        listing.save()
        return listing
    
    @staticmethod
    def delete_listing(listing):
        """Soft delete listing."""
        listing.status = 'archived'
        listing.save()


class BookingService:
    """Service for booking operations."""
    
    @staticmethod
    def check_availability(listing, start_date, end_date, exclude_booking_id=None):
        """Check if listing is available for date range."""
        query = Booking.objects.filter(
            listing=listing,
            status__in=['confirmed', 'checked_in']
        ).filter(
            Q(start_date__lt=end_date) &
            Q(end_date__gt=start_date)
        )
        
        if exclude_booking_id:
            query = query.exclude(id=exclude_booking_id)
        
        return not query.exists()
    
    @staticmethod
    def calculate_total_price(listing, start_date, end_date):
        """Calculate booking total price."""
        nights = (end_date - start_date).days
        if nights <= 0:
            return None
        return Decimal(nights) * listing.price
    
    @staticmethod
    def create_booking(user, listing, data):
        """Create booking with validation."""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        # Check availability
        if not BookingService.check_availability(listing, start_date, end_date):
            raise ValueError("Listing is not available for selected dates")
        
        # Calculate total price
        total_price = BookingService.calculate_total_price(listing, start_date, end_date)
        
        booking = Booking.objects.create(
            listing=listing,
            user=user,
            start_date=start_date,
            end_date=end_date,
            total_price=total_price,
            status=data.get('status', 'pending'),
            notes=data.get('notes')
        )
        return booking
    
    @staticmethod
    def get_user_bookings(user, status=None):
        """Get user's bookings."""
        queryset = Booking.objects.filter(user=user).select_related(
            'listing', 'user'
        ).prefetch_related('listing__images')
        
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-created_at')
    
    @staticmethod
    def cancel_booking(booking):
        """Cancel booking."""
        if booking.status == 'cancelled':
            raise ValueError("Booking is already cancelled")
        
        booking.status = 'cancelled'
        booking.save()


class ReviewService:
    """Service for review operations."""
    
    @staticmethod
    def can_review(user, listing):
        """Check if user can review listing (must have completed booking)."""
        return Booking.objects.filter(
            user=user,
            listing=listing,
            status__in=['checked_out', 'completed']
        ).exists()
    
    @staticmethod
    def create_review(user, listing, data):
        """Create review with validation."""
        # Check if user has already reviewed
        if Review.objects.filter(user=user, listing=listing).exists():
            raise ValueError("You have already reviewed this listing")
        
        review = Review.objects.create(
            user=user,
            listing=listing,
            rating=data.get('rating'),
            comment=data.get('comment'),
            is_verified_booking=ReviewService.can_review(user, listing)
        )
        return review
    
    @staticmethod
    def get_listing_reviews(listing):
        """Get listing reviews with stats."""
        reviews = listing.reviews.select_related('user').order_by('-created_at')
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg']
        return {
            'reviews': reviews,
            'average_rating': avg_rating,
            'total_count': reviews.count()
        }


class FavoriteService:
    """Service for favorite operations."""
    
    @staticmethod
    def get_user_favorites(user):
        """Get user's favorite listings."""
        return Favorite.objects.filter(user=user).select_related(
            'listing'
        ).prefetch_related('listing__images').order_by('-created_at')
    
    @staticmethod
    def toggle_favorite(user, listing):
        """Toggle favorite status."""
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
    """Service for messaging operations."""
    
    @staticmethod
    def send_message(sender, recipient, content, listing=None):
        """Send message."""
        message = Message.objects.create(
            sender=sender,
            recipient=recipient,
            content=content,
            listing=listing
        )
        return message
    
    @staticmethod
    def get_conversation(user, other_user):
        """Get conversation between two users."""
        return Message.objects.filter(
            Q(sender=user, recipient=other_user) |
            Q(sender=other_user, recipient=user)
        ).select_related('sender', 'recipient').order_by('created_at')
    
    @staticmethod
    def get_conversations(user):
        """Get all conversations for user."""
        # Get unique users this user has messaged
        sent_to = Message.objects.filter(sender=user).values_list(
            'recipient_id', flat=True
        ).distinct()
        received_from = Message.objects.filter(recipient=user).values_list(
            'sender_id', flat=True
        ).distinct()
        
        user_ids = set(list(sent_to) + list(received_from))
        return user_ids
    
    @staticmethod
    def mark_as_read(message):
        """Mark message as read."""
        message.is_read = True
        message.read_at = timezone.now()
        message.save()
    
    @staticmethod
    def get_unread_count(user):
        """Get unread message count."""
        return Message.objects.filter(
            recipient=user,
            is_read=False
        ).count()


class PaymentService:
    """Service for payment operations."""
    
    @staticmethod
    def create_payment(booking, amount, payment_method='card'):
        """Create payment record."""
        payment = Payment.objects.create(
            booking=booking,
            amount=amount,
            currency='MNT',
            payment_method=payment_method,
            status='pending'
        )
        return payment
    
    @staticmethod
    def complete_payment(payment, transaction_id):
        """Mark payment as completed."""
        payment.status = 'completed'
        payment.transaction_id = transaction_id
        payment.completed_at = timezone.now()
        payment.save()
        
        # Update booking status
        payment.booking.status = 'confirmed'
        payment.booking.save()
    
    @staticmethod
    def refund_payment(payment):
        """Refund payment."""
        if payment.status != 'completed':
            raise ValueError("Only completed payments can be refunded")
        
        payment.status = 'refunded'
        payment.save()


class SearchService:
    """Service for advanced search and filtering."""
    
    @staticmethod
    def search(filters, page=1, page_size=20):
        """Perform search with pagination."""
        queryset = ListingService.get_listings_queryset(filters)
        
        # Count total
        total_count = queryset.count()
        
        # Paginate
        offset = (page - 1) * page_size
        results = queryset[offset:offset + page_size]
        
        return {
            'results': list(results),
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        }
    
    @staticmethod
    def trending_listings(days=7, limit=10):
        """Get trending listings based on views."""
        cutoff_date = timezone.now() - timedelta(days=days)
        return Listing.objects.filter(
            status='active',
            updated_at__gte=cutoff_date
        ).order_by('-views_count')[:limit]
    
    @staticmethod
    def popular_listings(limit=10):
        """Get popular listings based on reviews."""
        return Listing.objects.filter(
            status='active'
        ).annotate(
            review_count=Count('reviews'),
            avg_rating=Avg('reviews__rating')
        ).order_by('-review_count')[:limit]
