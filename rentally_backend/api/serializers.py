from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Listing, ListingDetail, Booking, Review, Favorite, ListingImage

User = get_user_model()

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

# Listing Images
class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'image_url']

# Listing Detail Serializer
class ListingDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingDetail
        exclude = ['id', 'listing']

# Listing Serializer
class ListingSerializer(serializers.ModelSerializer):
    details = ListingDetailSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Listing
        fields = ['id', 'title', 'description', 'price', 'price_type', 'latitude', 'longitude', 'category', 'region', 'details', 'images']

# Booking Serializer
class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'listing', 'user', 'start_date', 'end_date', 'total_price', 'status', 'created_at']

# Review Serializer
class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'listing', 'user', 'rating', 'comment', 'created_at']

# Favorite Serializer
class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'listing', 'created_at']
