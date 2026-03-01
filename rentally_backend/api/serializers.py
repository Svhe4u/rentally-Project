# -*- coding: utf-8 -*-
"""
DRF serializers for Rentally API.

Note: Views use raw SQL and return dicts; these serializers are for
future validation/response shaping or external use. No Django models
are defined in models.py (schema lives in PostgreSQL).
"""

from rest_framework import serializers


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
