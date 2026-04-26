"""
Database models for Rentally backend.
Implements proper ORM structure using Django models for:
- Users (with broker profile)
- Listings (properties with images, details, features)
- Bookings (reservations)
- Reviews (ratings and comments)
- Messages (user-to-user communication)
- Favorites (saved listings)
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone
from django.core.exceptions import ValidationError


class UserProfile(models.Model):
    """Extended user profile for additional information."""

    ROLE_CHOICES = [
        ('user', 'User'),
        ('broker', 'Broker'),
        ('admin', 'Admin'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', primary_key=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'^[0-9+\-\s()]{8,20}$',
                message='Утасны дугаар зөв биш байна (жишээ: +976 9911 2233)'
            )
        ]
    )
    address = models.TextField(blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
        ordering = ['-created_at']


class BrokerProfile(models.Model):
    """Profile for broker users with company info."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='broker_profile', primary_key=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    registration_number = models.CharField(max_length=100, blank=True, null=True, unique=True)
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    license_document = models.URLField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate broker profile data."""
        if self.status == 'approved' and not self.verified_at:
            self.verified_at = timezone.now()
        super().clean()

    def __str__(self):
        return f"{self.company_name} ({self.status})"

    class Meta:
        verbose_name = "Broker Profile"
        verbose_name_plural = "Broker Profiles"
        ordering = ['-created_at']


class Category(models.Model):
    """Property categories (apartment, house, office, etc)."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']


class Region(models.Model):
    """Mongolian regions/districts."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    country = models.CharField(max_length=100, default='Mongolia')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Listing(models.Model):
    """Property listings."""

    PRICE_TYPE_CHOICES = [
        ('daily', 'Daily'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('sold', 'Sold'),
        ('archived', 'Archived'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True)

    title = models.CharField(max_length=255)
    description = models.TextField()
    address = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, blank=True, null=True)

    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    price_type = models.CharField(max_length=20, choices=PRICE_TYPE_CHOICES, default='monthly')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_featured = models.BooleanField(default=False)

    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['category', 'region']),
            models.Index(fields=['is_featured', '-created_at']),
            models.Index(fields=['price', 'price_type']),
        ]


class ListingImage(models.Model):
    """Images for listings."""

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Ensure only one primary image per listing."""
        if self.is_primary:
            # Reset other primary images
            ListingImage.objects.filter(listing=self.listing, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.listing.title}"

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name_plural = "Listing Images"


class ListingDetail(models.Model):
    """Detailed specs for listings (bedrooms, bathrooms, utilities)."""

    listing = models.OneToOneField(Listing, on_delete=models.CASCADE, related_name='detail')

    bedrooms = models.PositiveIntegerField(blank=True, null=True)
    bathrooms = models.PositiveIntegerField(blank=True, null=True)
    area_sqm = models.PositiveIntegerField(blank=True, null=True)

    floor_type = models.CharField(max_length=100, blank=True, null=True)
    window_type = models.CharField(max_length=100, blank=True, null=True)
    door_type = models.CharField(max_length=100, blank=True, null=True)
    balcony = models.BooleanField(default=False)
    garage = models.BooleanField(default=False)
    year_built = models.PositiveIntegerField(blank=True, null=True)
    floor_number = models.PositiveSmallIntegerField(blank=True, null=True)
    building_floors = models.PositiveSmallIntegerField(blank=True, null=True)
    window_count = models.PositiveSmallIntegerField(blank=True, null=True)
    payment_terms = models.TextField(blank=True, null=True)

    utilities_estimated = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, validators=[MinValueValidator(0)])
    heating_type = models.CharField(max_length=100, blank=True, null=True)
    air_type = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Details for {self.listing.title}"

    class Meta:
        verbose_name = "Listing Detail"
        verbose_name_plural = "Listing Details"


class ListingFeature(models.Model):
    """Individual features/amenities for listings."""

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='features')
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Listing Features"
        constraints = [
            models.UniqueConstraint(fields=['listing', 'name'], name='unique_listing_feature')
        ]

    def __str__(self):
        return f"{self.name}: {self.value}"


class Booking(models.Model):
    """Reservations for listings."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('cancelled', 'Cancelled'),
    ]

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')

    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    total_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, validators=[MinValueValidator(0)])

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        """Validate booking dates."""
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError({'end_date': 'Дуусах огноо эхлэх огнооноос хойш байх ёстой.'})
        super().clean()

    def save(self, *args, **kwargs):
        """Auto-calculate total price before saving."""
        if self.start_date and self.end_date and self.listing:
            duration_days = (self.end_date - self.start_date).days
            if duration_days > 0 and not self.total_price:
                from decimal import Decimal
                self.total_price = Decimal(duration_days) * self.listing.price
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.id} - {self.user.username}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['listing', 'status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['status', 'created_at']),
        ]


class Review(models.Model):
    """Reviews and ratings for listings."""

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')

    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)

    is_verified_booking = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.rating}★ for {self.listing.title}"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['listing', 'user']
        indexes = [
            models.Index(fields=['listing', 'rating']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_verified_booking', '-created_at']),
        ]


class Favorite(models.Model):
    """User's saved listings."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='favorited_by')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} saved {self.listing.title}"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'listing']
        verbose_name_plural = "Favorites"


class Message(models.Model):
    """Direct messages between users."""

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', db_column='receiver_id')
    listing = models.ForeignKey(Listing, on_delete=models.SET_NULL, null=True, blank=True, related_name='messages')

    content = models.TextField(db_column='message')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        """Prevent sending messages to self."""
        if self.sender == self.recipient:
            raise ValidationError({'recipient': 'Өөртөө мессеж илгээх боломжгүй.'})
        if not self.content or not str(self.content).strip():
            raise ValidationError({'content': 'Мессеж хоосон байж болохгүй.'})
        super().clean()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sender', 'recipient']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]


class Payment(models.Model):
    """Payment records for bookings."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')

    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='MNT')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    payment_method = models.CharField(max_length=100, blank=True, null=True)
    transaction_id = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    def clean(self):
        """Validate transaction_id is unique when set."""
        if self.transaction_id:
            existing = Payment.objects.filter(transaction_id=self.transaction_id).exclude(pk=self.pk).first()
            if existing:
                raise ValidationError({'transaction_id': 'Энэ гүйлгээний ID өмнө ашиглагдсан байна.'})
        super().clean()

    def __str__(self):
        return f"Payment {self.id} - {self.status}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
