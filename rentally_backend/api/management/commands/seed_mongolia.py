# -*- coding: utf-8 -*-
"""
Seed Mongolian cities, districts, and categories.

Usage: python manage.py seed_mongolia

Idempotent: safe to run multiple times (skips existing).
"""

from django.core.management.base import BaseCommand
from django.db import connection
from api.locale_mn import MONGOLIA_CITIES, ULAANBAATAR_DISTRICTS


class Command(BaseCommand):
    help = "Seed Mongolian cities, districts, and default categories"

    def handle(self, *args, **options):
        try:
            with connection.cursor() as c:
                self._ensure_categories(c)
                self._ensure_regions(c)
            self.stdout.write(self.style.SUCCESS("Mongolia seed complete."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Seed failed: {e}. Ensure tables exist (see SCHEMA_REFERENCE.sql)."))

    def _ensure_categories(self, c):
        """Insert default listing categories (Mongolian market)."""
        categories = [
            ("Орон сууц",),   # Apartment
            ("Хувийн байшин",),  # Private house
            ("Гэр",),         # Ger (yurt)
            ("Оффис",),       # Office
            ("Агуулах",),     # Warehouse
        ]
        for (name,) in categories:
            c.execute(
                "SELECT id FROM categories WHERE name = %s",
                [name],
            )
            if c.fetchone():
                continue
            c.execute("INSERT INTO categories (name) VALUES (%s)", [name])
            self.stdout.write(f"  Added category: {name}")

    def _ensure_regions(self, c):
        """Insert Mongolian cities and Ulaanbaatar districts."""
        from django.utils.text import slugify

        all_regions = MONGOLIA_CITIES + ULAANBAATAR_DISTRICTS
        for r in all_regions:
            c.execute("SELECT id FROM regions WHERE name = %s", [r["name"]])
            if c.fetchone():
                continue
            parent_id = r.get("parent_id")
            # Generate slug from English name for consistent transliteration
            slug = slugify(r.get("name_en", r["name"]), allow_unicode=False)
            c.execute(
                "INSERT INTO regions (name, slug, parent_id) VALUES (%s, %s, %s)",
                [r["name"], slug, parent_id],
            )
            self.stdout.write(f"  Added region: {r['name']} (slug: {slug})")
