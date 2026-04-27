"""
REST Framework serializers for Rentally API.
Handles validation, data transformation, and nested relationships.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.db.models import Avg
from decimal import Decimal
from datetime import date, datetime

from .models import (
    UserProfile, BrokerProfile, Category, Region, Listing, ListingImage,
    ListingDetail, ListingFeature, Booking, Review, Favorite, Message, Payment
)


# ─────────────────────────────────────────────────────────────────────────
# AUTH SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────


class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, data):
        # Validate passwords match first
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password2": "Нууц үг таарахгүй байна."})
        return data

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Энэ хэрэглэгчийн нэр бүртгэгдсэн байна.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Энэ имэйл хаяг бүртгэгдсэн байна.")
        return value

    def create(self, validated_data):
        # Remove password2 before creating user
        validated_data.pop('password2', None)
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""

    id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'address', 'profile_picture', 'is_verified', 'created_at']
        read_only_fields = ['role', 'is_verified', 'created_at']

    def validate_phone(self, value):
        """Validate Mongolian phone number."""
        if value:
            import re
            digits = re.sub(r'\D', '', value)
            if len(digits) < 8:
                raise serializers.ValidationError("Утасны дугаар хэт богино байна.")
            if len(digits) > 12:
                raise serializers.ValidationError("Утасны дугаар хэт урт байна.")
        return value

    def update(self, instance, validated_data):
        # Extract user data from validated_data (nested source)
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Update User model fields
        if 'username' in user_data:
            user.username = user_data['username']
        if 'email' in user_data:
            user.email = user_data['email']
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        
        if user_data:
            user.save()

        # Update UserProfile fields
        return super().update(instance, validated_data)


class BrokerProfileSerializer(serializers.ModelSerializer):
    """Serializer for broker profile."""

    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = BrokerProfile
        fields = [
            'username', 'email', 'company_name', 'registration_number',
            'description', 'website', 'status', 'verified_at', 'created_at'
        ]
        read_only_fields = ['status', 'verified_at', 'created_at']


class UserPublicSerializer(serializers.ModelSerializer):
    """Serializer for public user info including broker profile."""
    broker_profile = BrokerProfileSerializer(read_only=True)
    phone = serializers.CharField(source='profile.phone', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'phone', 'broker_profile']


# ─────────────────────────────────────────────────────────────────────────
# REVIEW SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews."""

    user_username = serializers.CharField(source='user.username', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'listing', 'listing_title', 'user', 'user_username',
            'rating', 'comment', 'is_verified_booking', 'helpful_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['helpful_count', 'created_at', 'updated_at', 'is_verified_booking']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Үнэлгээ 1-5 хооронд байх ёстой.")
        return value



class ReviewCreateSerializer(serializers.Serializer):
    """Validate review create payload."""

    listing_id = serializers.IntegerField(required=True)
    rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    comment = serializers.CharField(allow_blank=True, required=False)


# ─────────────────────────────────────────────────────────────────────────
# LISTING SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class ListingDetailSerializer(serializers.ModelSerializer):
    """Serializer for listing details."""

    class Meta:
        model = ListingDetail
        fields = [
            'bedrooms', 'bathrooms', 'area_sqm', 'utilities_estimated', 
            'heating_type', 'air_type', 'floor_type', 'window_type', 
            'door_type', 'balcony', 'garage', 'year_built', 
            'floor_number', 'building_floors', 'window_count', 'payment_terms'
        ]


class ListingImageSerializer(serializers.ModelSerializer):
    """Serializer for listing images."""

    class Meta:
        model = ListingImage
        fields = ['id', 'image_url', 'alt_text', 'is_primary', 'order']


class ListingFeatureSerializer(serializers.ModelSerializer):
    """Serializer for listing features."""

    class Meta:
        model = ListingFeature
        fields = ['id', 'name', 'value']


class ListingSerializer(serializers.ModelSerializer):
    """Serializer for listing basic info."""

    owner_username = serializers.CharField(source='owner.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    region_name = serializers.CharField(source='region.name', read_only=True)
    bedrooms = serializers.IntegerField(source='detail.bedrooms', read_only=True, default=0)
    area_sqm = serializers.DecimalField(source='detail.area_sqm', max_digits=10, decimal_places=2, read_only=True, default=0)
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'owner', 'owner_username', 'category', 'category_name',
            'region', 'region_name', 'title', 'description', 'address',
            'latitude', 'longitude', 'price', 'price_type', 'status',
            'is_featured', 'views_count', 'bedrooms', 'area_sqm', 'cover_image',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['views_count', 'created_at', 'updated_at']

    def get_cover_image(self, obj):
        """Primary image URL for list cards (prefetch images on queryset)."""
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first = obj.images.first()
        return first.image_url if first else None


class MyListingSerializer(ListingSerializer):
    """Broker portal listing row including thumbnails, detail, and features for editing."""

    images = ListingImageSerializer(many=True, read_only=True)
    features = ListingFeatureSerializer(many=True, read_only=True)
    detail = ListingDetailSerializer(read_only=True)

    class Meta(ListingSerializer.Meta):
        fields = ListingSerializer.Meta.fields + ['images', 'features', 'detail']


class ListingDetailedSerializer(ListingSerializer):
    """Detailed serializer including nested relationships."""

    owner = UserPublicSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    features = ListingFeatureSerializer(many=True, read_only=True)
    detail = ListingDetailSerializer(read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta(ListingSerializer.Meta):
        fields = ListingSerializer.Meta.fields + ['images', 'features', 'detail', 'reviews', 'review_count', 'average_rating']

    def get_review_count(self, obj):
        """Review тоог annotate-аас эсвэл count-аас авна."""
        if hasattr(obj, '_prefetched_objects_cache') and 'reviews' in obj._prefetched_objects_cache:
            return len(obj._prefetched_objects_cache['reviews'])
        return obj.reviews.count()

    def get_average_rating(self, obj):
        """Aggregate ашиглан дундаж үнэлгээг тооцно."""
        avg = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(float(avg), 1) if avg is not None else None


# ─────────────────────────────────────────────────────────────────────────
# BOOKING SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class BookingSerializer(serializers.ModelSerializer):
    """Serializer for bookings."""

    listing_title = serializers.CharField(source='listing.title', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    duration_days = serializers.SerializerMethodField()
    
    # Force Date representation to avoid aware/naive DateTimeField crashes
    start_date = serializers.DateField()
    end_date = serializers.DateField()

    class Meta:
        model = Booking
        fields = [
            'id', 'listing', 'listing_title', 'user', 'user_username',
            'start_date', 'end_date', 'duration_days', 'total_price', 'status', 'notes',
            'created_at', 'updated_at', 'days_remaining'
        ]
        read_only_fields = ['created_at', 'updated_at', 'total_price']

    def validate(self, data):
        start_date = data.get('start_date')
        end_date = data.get('end_date')

        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError({"end_date": "Дуусах огноо эхлэх огнооноос хойш байх ёстой."})

            # Check if booking is in the past
            if start_date < timezone.now():
                raise serializers.ValidationError({"start_date": "Эхлэх огноо өнгөрсөн цаг байж болохгүй."})

        return data

    def get_duration_days(self, obj):
        """Хэд хоног захиалсан."""
        if obj.start_date and obj.end_date:
            return (obj.end_date - obj.start_date).days
        return 0

    def get_days_remaining(self, obj):
        today = date.today() # This returns a date object
        if obj.start_date > today: 
            return (obj.start_date - today).days
        return 0


class BookingCreateSerializer(serializers.Serializer):
    """Validate booking create payload."""

    listing_id = serializers.IntegerField(required=True)
    start_date = serializers.DateTimeField(required=True)
    end_date = serializers.DateTimeField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError({"end_date": "Дуусах огноо эхлэх огнооноос хойш байх ёстой."})
        if data['start_date'] < timezone.now():
            raise serializers.ValidationError({"start_date": "Эхлэх огноо өнгөрсөн цаг байж болохгүй."})
        return data




# ─────────────────────────────────────────────────────────────────────────
# FAVORITE SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer for favorites."""

    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_price = serializers.DecimalField(source='listing.price', max_digits=10, decimal_places=2, read_only=True)
    listing_address = serializers.CharField(source='listing.address', read_only=True)
    listing_image = serializers.SerializerMethodField()
    listing_status = serializers.CharField(source='listing.status', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'listing', 'listing_title', 'listing_price', 'listing_address', 'listing_image', 'listing_status', 'created_at']
        read_only_fields = ['created_at']

    def get_listing_image(self, obj):
        image = obj.listing.images.filter(is_primary=True).first()
        if image:
            return image.image_url
        # Return first image if no primary
        first_image = obj.listing.images.first()
        if first_image:
            return first_image.image_url
        return None


class FavoriteToggleSerializer(serializers.Serializer):
    """Serializer for toggling favorite."""

    listing_id = serializers.IntegerField(required=True)


# ─────────────────────────────────────────────────────────────────────────
# MESSAGE SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages."""

    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True, allow_null=True)
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_username', 'sender_avatar', 'recipient', 'recipient_username',
            'listing', 'listing_title', 'content', 'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['read_at', 'created_at', 'is_read']

    def get_sender_avatar(self, obj):
        if hasattr(obj.sender, 'profile') and obj.sender.profile.profile_picture:
            return obj.sender.profile.profile_picture
        return None

    def validate_content(self, value):
        """Message content validation."""
        if not value or not str(value).strip():
            raise serializers.ValidationError("Мессеж хоосон байж болохгүй.")
        if len(str(value)) > 2000:
            raise serializers.ValidationError("Мессеж 2000 тэмдэгтээс хэтрэхгүй.")
        return value.strip()

    def validate(self, data):
        """Prevent sending to self."""
        request = self.context.get('request')
        if request:
            if data.get('recipient') == request.user:
                raise serializers.ValidationError({"recipient": "Өөртөө мессеж илгээх боломжгүй."})
        return data


class MessageCreateSerializer(serializers.Serializer):
    """Serializer for creating messages."""

    recipient_id = serializers.IntegerField(required=True)
    content = serializers.CharField(required=True, max_length=2000)
    listing_id = serializers.IntegerField(required=False, allow_null=True)


# ─────────────────────────────────────────────────────────────────────────
# CATEGORY & REGION SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories."""

    listing_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description', 'listing_count']

    def get_listing_count(self, obj):
        return obj.listing_set.filter(status='active').count()


class RegionSerializer(serializers.ModelSerializer):
    """Serializer for regions."""

    listing_count = serializers.SerializerMethodField()

    class Meta:
        model = Region
        fields = ['id', 'name', 'slug', 'country', 'listing_count']

    def get_listing_count(self, obj):
        return obj.listing_set.filter(status='active').count()


# ─────────────────────────────────────────────────────────────────────────
# PAYMENT SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments."""

    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    listing_title = serializers.CharField(source='booking.listing.title', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'booking_id', 'listing_title', 'amount', 'currency', 'status',
            'payment_method', 'transaction_id', 'created_at', 'completed_at'
        ]
        read_only_fields = ['created_at', 'completed_at', 'status']


class PaymentCreateSerializer(serializers.Serializer):
    """Validate payment create payload."""

    booking_id = serializers.IntegerField(required=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    payment_method = serializers.CharField(required=False, default='card')


class PaymentProcessSerializer(serializers.Serializer):
    """Serializer for processing payments."""

    transaction_id = serializers.CharField(required=True)


# ─────────────────────────────────────────────────────────────────────────
# SEARCH & FILTER SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class ListingSearchSerializer(serializers.Serializer):
    """Serializer for validating search parameters."""

    search = serializers.CharField(required=False, allow_blank=True)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    region_id = serializers.IntegerField(required=False, allow_null=True)
    min_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    max_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    is_featured = serializers.BooleanField(required=False, default=False)
    page = serializers.IntegerField(required=False, default=1, min_value=1)
    page_size = serializers.IntegerField(required=False, default=20, min_value=1, max_value=100)


class ContactBrokerSerializer(serializers.Serializer):
    """Serializer for contacting broker."""

    listing_id = serializers.IntegerField(required=True)
    message = serializers.CharField(required=True, min_length=10, max_length=2000)


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password2 = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "Нууц үг таарахгүй байна."})
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""

    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""

    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password2 = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({"new_password2": "Нууц үг таарахгүй байна."})
        return data
