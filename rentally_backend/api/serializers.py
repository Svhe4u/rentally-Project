"""
REST Framework serializers for Rentally API.
Handles validation, data transformation, and nested relationships.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

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
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError("Passwords do not match")
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("Username already exists")
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Email already exists")
        return data
    
    def create(self, validated_data):
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
    
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['username', 'email', 'role', 'phone', 'address', 'profile_picture', 'is_verified']


class BrokerProfileSerializer(serializers.ModelSerializer):
    """Serializer for broker profile."""
    
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = BrokerProfile
        fields = [
            'username', 'email', 'company_name', 'registration_number',
            'description', 'website', 'status', 'verified_at'
        ]


# ─────────────────────────────────────────────────────────────────────────
# LISTING SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class ListingDetailSerializer(serializers.ModelSerializer):
    """Serializer for listing details."""
    
    class Meta:
        model = ListingDetail
        fields = ['bedrooms', 'bathrooms', 'area_sqm', 'utilities_estimated', 'heating_type', 'air_type']


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
    
    class Meta:
        model = Listing
        fields = [
            'id', 'owner', 'owner_username', 'category', 'category_name',
            'region', 'region_name', 'title', 'description', 'address',
            'latitude', 'longitude', 'price', 'price_type', 'status',
            'is_featured', 'views_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['views_count', 'created_at', 'updated_at']


class ListingDetailedSerializer(ListingSerializer):
    """Detailed serializer including nested relationships."""
    
    images = ListingImageSerializer(many=True, read_only=True)
    features = ListingFeatureSerializer(many=True, read_only=True)
    detail = ListingDetailSerializer(read_only=True)
    review_count = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    
    class Meta(ListingSerializer.Meta):
        fields = ListingSerializer.Meta.fields + ['images', 'features', 'detail', 'review_count', 'average_rating']
    
    def get_review_count(self, obj):
        return obj.reviews.count()
    
    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews:
            return None
        return sum(r.rating for r in reviews) / len(reviews)


# ─────────────────────────────────────────────────────────────────────────
# BOOKING SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class BookingSerializer(serializers.ModelSerializer):
    """Serializer for bookings."""
    
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    days_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'listing', 'listing_title', 'user', 'user_username',
            'start_date', 'end_date', 'total_price', 'status', 'notes',
            'created_at', 'updated_at', 'days_remaining'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError("End date must be after start date")
        return data
    
    def get_days_remaining(self, obj):
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if obj.end_date > now:
            return (obj.end_date - now).days
        return 0


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
        read_only_fields = ['helpful_count', 'created_at', 'updated_at']
    
    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


# ─────────────────────────────────────────────────────────────────────────
# FAVORITE SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer for favorites."""
    
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_price = serializers.DecimalField(source='listing.price', max_digits=10, decimal_places=2, read_only=True)
    listing_address = serializers.CharField(source='listing.address', read_only=True)
    listing_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Favorite
        fields = ['id', 'listing', 'listing_title', 'listing_price', 'listing_address', 'listing_image', 'created_at']
        read_only_fields = ['created_at']
    
    def get_listing_image(self, obj):
        image = obj.listing.images.filter(is_primary=True).first()
        if image:
            return image.image_url
        return None


# ─────────────────────────────────────────────────────────────────────────
# MESSAGE SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages."""
    
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True, allow_null=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_username', 'recipient', 'recipient_username',
            'listing', 'listing_title', 'content', 'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['read_at', 'created_at']


# ─────────────────────────────────────────────────────────────────────────
# CATEGORY & REGION SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    """Serializer for categories."""
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description']


class RegionSerializer(serializers.ModelSerializer):
    """Serializer for regions."""
    
    class Meta:
        model = Region
        fields = ['id', 'name', 'slug', 'country']


# ─────────────────────────────────────────────────────────────────────────
# PAYMENT SERIALIZERS
# ─────────────────────────────────────────────────────────────────────────

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for payments."""
    
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'booking', 'booking_id', 'amount', 'currency', 'status',
            'payment_method', 'transaction_id', 'created_at', 'completed_at'
        ]
        read_only_fields = ['created_at', 'completed_at']


# ---------------------------------------------------------------------------
# Request validation serializers (for POST/PUT)
# ---------------------------------------------------------------------------

class ListingCreateSerializer(serializers.Serializer):
    """Validate listing create/update payload."""
    owner_id = serializers.IntegerField(required=True)
    category_id = serializers.IntegerField(allow_null=True)
    region_id = serializers.IntegerField(allow_null=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    address = serializers.CharField(allow_blank=True, required=False)
    latitude = serializers.FloatField(allow_null=True, required=False)
    longitude = serializers.FloatField(allow_null=True, required=False)
    price = serializers.DecimalField(max_digits=14, decimal_places=0)  # MNT
    price_type = serializers.CharField(max_length=50, required=False, default="monthly")


class ReviewCreateSerializer(serializers.Serializer):
    """Validate review create/update payload."""
    listing = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(allow_blank=True, required=False)
