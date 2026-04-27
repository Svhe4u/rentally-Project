# -*- coding: utf-8 -*-
"""
Mongolia localization utilities for Rentally.

Provides currency formatting (MNT), city/region constants, and helpers
adapted to Mongolian rental market (seasonal trends, utility estimates, etc.).
"""

# ----------------------
# CURRENCY
# ----------------------
CURRENCY_CODE = "MNT"
CURRENCY_SYMBOL = "₮"

def format_mnt(amount, include_symbol=True):
    """
    Format amount as Mongolian Tögrög.
    Uses space as thousands separator per Mongolian convention.
    Example: 1_500_000 -> "1 500 000 ₮"
    """
    if amount is None:
        return ""
    try:
        val = int(amount)
        formatted = f"{val:,}".replace(",", " ")
        return f"{formatted} {CURRENCY_SYMBOL}" if include_symbol else formatted
    except (TypeError, ValueError):
        return str(amount)


# ----------------------
# MAJOR MONGOLIAN CITIES & DISTRICTS (Баянзүрх, Хан-Уул, etc.)
# ----------------------
MONGOLIA_CITIES = [
    {"id": 1, "name": "Улаанбаатар", "name_en": "Ulaanbaatar", "parent_id": None},
    {"id": 2, "name": "Эрдэнет", "name_en": "Erdenet", "parent_id": None},
    {"id": 3, "name": "Дархан", "name_en": "Darkhan", "parent_id": None},
    {"id": 4, "name": "Чойбалсан", "name_en": "Choibalsan", "parent_id": None},
]

# Ulaanbaatar districts (as sub-regions)
ULAANBAATAR_DISTRICTS = [
    {"id": 10, "name": "Баянзүрх", "name_en": "Bayanzurkh", "parent_id": 1},
    {"id": 11, "name": "Сүхбаатар", "name_en": "Sukhbaatar", "parent_id": 1},
    {"id": 12, "name": "Хан-Уул", "name_en": "Khan-Uul", "parent_id": 1},
    {"id": 13, "name": "Баянгол", "name_en": "Bayangol", "parent_id": 1},
    {"id": 14, "name": "Сонгинохайрхан", "name_en": "Songino-Khairkhan", "parent_id": 1},
    {"id": 15, "name": "Чингэлтэй", "name_en": "Chingeltei", "parent_id": 1},
    {"id": 16, "name": "Налайх", "name_en": "Nalaikh", "parent_id": 1},
    {"id": 17, "name": "Багануур", "name_en": "Baganuur", "parent_id": 1},
]

# ----------------------
# SEASONAL RENTAL TRENDS (Монголд)
# ----------------------
# Peak rental season: Sept–Oct (back to school/work), March–April (new contracts)
SEASONAL_TRENDS = {
    "high": [9, 10, 3, 4],   # September, October, March, April
    "medium": [5, 6, 11],    # May, June, November
    "low": [1, 2, 7, 8, 12], # Jan, Feb, Jul, Aug, Dec
}

def get_season_tier(month):
    """Return 'high', 'medium', or 'low' for given month (1–12)."""
    for tier, months in SEASONAL_TRENDS.items():
        if month in months:
            return tier
    return "medium"


# ----------------------
# UTILITY COST ESTIMATES (MNT/month, Ulaanbaatar typical)
# ----------------------
UTILITY_ESTIMATES_MNT = {
    "small": {"min": 80000, "max": 150000, "sqm_range": (20, 50)},   # 1-2 room
    "medium": {"min": 120000, "max": 220000, "sqm_range": (50, 90)}, # 2-3 room
    "large": {"min": 180000, "max": 350000, "sqm_range": (90, 200)}, # 3+ room
}

def estimate_utilities_mnt(area_sqm):
    """
    Estimate monthly utility cost (electricity, heating, water) in MNT
    based on apartment area. Typical for Ulaanbaatar.
    """
    if area_sqm is None or area_sqm <= 0:
        return {"min": 80000, "max": 150000, "note": "Дундаж үнэлгээ"}
    for size, data in UTILITY_ESTIMATES_MNT.items():
        lo, hi = data["sqm_range"]
        if lo <= area_sqm < hi:
            return {"min": data["min"], "max": data["max"], "note": "Дулаан/цахилгаан/ус"}
    return {"min": 200000, "max": 400000, "note": "Том талбай"}


# ----------------------
# POPULAR NEIGHBORHOODS (Улаанбаатар)
# ----------------------
POPULAR_NEIGHBORHOODS = [
    {"name": "15-р хороо", "district": "Баянзүрх", "note": "Төв ойрхон"},
    {"name": "1-р хороо", "district": "Сүхбаатар", "note": "Худалдааны төв"},
    {"name": "Хан-Уул дүүрэг", "district": "Хан-Уул", "note": "Ойр хотын орчинд"},
    {"name": "Баянзүрх дүүрэг", "district": "Баянзүрх", "note": "Сургууль ихтэй"},
    {"name": "Сонгинохайрхан", "district": "Сонгинохайрхан", "note": "Хямд төлбөртэй"},
]
