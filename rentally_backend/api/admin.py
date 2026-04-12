from django.contrib import admin
from django.utils.html import format_html
from .models import (
    UserProfile, BrokerProfile, Category, Region, Listing, 
    ListingImage, ListingDetail, ListingFeature, Booking, Review, 
    Favorite, Message, Payment
)

# ─────────────────────────────────────────────────────────────────────────
# SITE BRANDING
# ─────────────────────────────────────────────────────────────────────────

admin.site.site_header = "Rentally Admin Portal"
admin.site.site_title = "Rentally Admin"
admin.site.index_title = "Welcome to Rentally Management"

# ─────────────────────────────────────────────────────────────────────────
# INLINES
# ─────────────────────────────────────────────────────────────────────────

class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1
    fields = ('image_url', 'is_primary', 'order', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if obj.image_url:
            return format_html('<img src="{}" style="width: 50px; height: auto; border-radius: 4px;" />', obj.image_url)
        return "-"

class ListingDetailInline(admin.StackedInline):
    model = ListingDetail
    can_delete = False

# ─────────────────────────────────────────────────────────────────────────
# MODEL ADMINS
# ─────────────────────────────────────────────────────────────────────────

@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'price', 'price_type', 'owner', 'category', 'region', 'status', 'is_featured', 'created_at')
    list_filter = ('status', 'price_type', 'category', 'region', 'is_featured')
    search_fields = ('title', 'address', 'owner__username', 'owner__email')
    list_editable = ('status', 'is_featured')
    inlines = [ListingImageInline, ListingDetailInline]
    date_hierarchy = 'created_at'

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone', 'is_verified', 'created_at')
    list_filter = ('role', 'is_verified')
    search_fields = ('user__username', 'user__email', 'phone')
    list_editable = ('role', 'is_verified')

@admin.register(BrokerProfile)
class BrokerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company_name', 'registration_number', 'status', 'verified_at')
    list_filter = ('status',)
    search_fields = ('company_name', 'registration_number', 'user__username')
    actions = ['approve_brokers', 'reject_brokers']

    def approve_brokers(self, request, queryset):
        queryset.update(status='approved')
    approve_brokers.short_description = "Approve selected broker applications"

    def reject_brokers(self, request, queryset):
        queryset.update(status='rejected')
    reject_brokers.short_description = "Reject selected broker applications"

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('listing', 'user', 'start_date', 'end_date', 'total_price', 'status')
    list_filter = ('status', 'start_date')
    search_fields = ('listing__title', 'user__username')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('listing', 'user', 'rating', 'created_at')
    list_filter = ('rating',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'country')
    prepopulated_fields = {"slug": ("name",)}

# ─────────────────────────────────────────────────────────────────────────
# SIMPLE REGISTRATIONS
# ─────────────────────────────────────────────────────────────────────────

admin.site.register(ListingFeature)
admin.site.register(Favorite)
admin.site.register(Message)
admin.site.register(Payment)
