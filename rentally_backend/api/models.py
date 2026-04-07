"""
Database models matching the existing PostgreSQL schema.
Uses unmanaged models for tables that already exist.
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MinValueValidator, MaxValueValidator


class UserManager(BaseUserManager):
    """Custom user manager for the users table."""

    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        if not email:
            raise ValueError('Email is required')
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_verified', True)
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model matching the 'users' table."""

    ROLE_CHOICES = [
        ('user', 'User'),
        ('broker', 'Broker'),
        ('admin', 'Admin'),
    ]

    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    # password is handled by AbstractBaseUser
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Django auth compatibility fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    objects = UserManager()

    class Meta:
        db_table = 'users'
        managed = False

    def __str__(self):
        return self.username

    def get_full_name(self):
        return self.username

    def get_short_name(self):
        return self.username


class Category(models.Model):
    """Property categories."""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'categories'
        managed = False

    def __str__(self):
        return self.name


class Region(models.Model):
    """Regions/districts."""
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    parent_id = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'regions'
        managed = False

    def __str__(self):
        return self.name


class Listing(models.Model):
    """Property listings."""

    PRICE_TYPE_CHOICES = [
        ('monthly', 'Monthly'),
        ('daily', 'Daily'),
        ('yearly', 'Yearly'),
        ('total', 'Total'),
    ]

    id = models.AutoField(primary_key=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, db_column='owner_id', related_name='listings')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, db_column='category_id')
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, db_column='region_id')

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    price_type = models.CharField(max_length=20, choices=PRICE_TYPE_CHOICES, default='monthly')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'listings'
        managed = False

    def __str__(self):
        return self.title


class ListingImage(models.Model):
    """Images for listings."""
    id = models.AutoField(primary_key=True)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, db_column='listing_id', related_name='images')
    image_url = models.TextField()
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'listing_images'
        managed = False

    def __str__(self):
        return f"Image for {self.listing.title}"


class ListingDetail(models.Model):
    """Detailed specs for listings."""
    listing = models.OneToOneField(Listing, on_delete=models.CASCADE, db_column='listing_id', primary_key=True, related_name='detail')
    floor_type = models.CharField(max_length=50, blank=True, null=True)
    balcony = models.BooleanField(null=True, blank=True)
    year_built = models.IntegerField(null=True, blank=True)
    garage = models.BooleanField(null=True, blank=True)
    window_type = models.CharField(max_length=50, blank=True, null=True)
    building_floors = models.IntegerField(null=True, blank=True)
    door_type = models.CharField(max_length=50, blank=True, null=True)
    area_sqm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    floor_number = models.IntegerField(null=True, blank=True)
    window_count = models.IntegerField(null=True, blank=True)
    payment_terms = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'listing_details'
        managed = False


class BrokerProfile(models.Model):
    """Broker profile matching the database schema."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, db_column='user_id', primary_key=True, related_name='broker_profile')
    license_no = models.CharField(max_length=100, blank=True, null=True)
    agency_name = models.CharField(max_length=150, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    profile_image = models.TextField(blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    listing_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'broker_profiles'
        managed = False

    def __str__(self):
        return f"{self.agency_name or self.user.username} (Broker)"


class BrokerApplication(models.Model):
    """Broker applications table."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='broker_applications')
    license_no = models.CharField(max_length=100, blank=True, null=True)
    agency_name = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    note = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reject_reason = models.TextField(blank=True, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='reviewed_by', related_name='reviewed_applications')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'broker_applications'
        managed = False

    def __str__(self):
        return f"Application from {self.user.username} - {self.status}"


class Booking(models.Model):
    """Bookings table."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    id = models.AutoField(primary_key=True)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, db_column='listing_id', related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='bookings')
    start_date = models.DateField()
    end_date = models.DateField()
    total_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings'
        managed = False

    def __str__(self):
        return f"Booking {self.id} - {self.user.username}"


class Review(models.Model):
    """Reviews table."""
    id = models.AutoField(primary_key=True)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, db_column='listing_id', related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='reviews')
    rating = models.SmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reviews'
        managed = False
        unique_together = ['listing', 'user']

    def __str__(self):
        return f"{self.user.username} - {self.rating}*"


class Favorite(models.Model):
    """Favorites table."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id', related_name='favorites')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, db_column='listing_id', related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'favorites'
        managed = False
        unique_together = ['user', 'listing']

    def __str__(self):
        return f"{self.user.username} saved {self.listing.title}"


class Message(models.Model):
    """Messages table."""
    id = models.AutoField(primary_key=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, db_column='sender_id', related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, db_column='receiver_id', related_name='received_messages')
    listing = models.ForeignKey(Listing, on_delete=models.SET_NULL, null=True, blank=True, db_column='listing_id', related_name='messages')
    content = models.TextField(db_column='message')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        managed = False

    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username}"


class Payment(models.Model):
    """Payments table."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    METHOD_CHOICES = [
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('qpay', 'QPay'),
        ('socialpay', 'SocialPay'),
        ('lendpay', 'LendPay'),
    ]

    id = models.AutoField(primary_key=True)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, db_column='booking_id', related_name='payment')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=30, choices=METHOD_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payments'
        managed = False

    def __str__(self):
        return f"Payment {self.id} - {self.status}"


# UserProfile for backward compatibility - maps to users table
class UserProfile(models.Model):
    """Compatibility wrapper around User."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='profile')
    role = models.CharField(max_length=20, default='user')
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        managed = False

    def __str__(self):
        return f"{self.user.username} Profile"
