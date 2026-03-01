# -*- coding: utf-8 -*-
"""
Mongolia-specific API endpoints for Rentally.

Provides: cities/regions, utility estimates, seasonal trends, popular neighborhoods,
popular areas (by listing count).
"""

from datetime import datetime
from django.db import connection
from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from .locale_mn import (
    MONGOLIA_CITIES,
    ULAANBAATAR_DISTRICTS,
    format_mnt,
    get_season_tier,
    estimate_utilities_mnt,
    POPULAR_NEIGHBORHOODS,
    SEASONAL_TRENDS,
)


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


class PopularAreasAPIView(APIView):
    """
    Popular areas ranked by listing count (and optionally bookings).
    Returns regions with most listings for map highlights.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            with connection.cursor() as c:
                c.execute("""
                    SELECT r.id, r.name, COUNT(l.id) as listing_count
                    FROM regions r
                    LEFT JOIN listings l ON l.region_id = r.id
                    GROUP BY r.id, r.name
                    HAVING COUNT(l.id) > 0
                    ORDER BY listing_count DESC
                    LIMIT 20
                """)
                rows = [{"id": r[0], "name": r[1], "listing_count": r[2]} for r in c.fetchall()]
        except Exception:
            rows = []
        return Response({"areas": rows})
