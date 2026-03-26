"""
views.py  –  Байр Real Estate API
Improvements over original:
  - Shared _fetch_one / _fetch_all helpers (no repeated cursor boilerplate)
  - ChangePasswordAPIView fixed to use public.users instead of missing user_accounts
  - BrokerRegisterAPIView removed (was broken) → replaced with proper broker flow
  - ListingAPIView.post validates owner exists before inserting
  - ListingFullDetailAPIView: also includes broker_profile when owner is a broker
  - ReviewAPIView.post: prevents duplicate review per user per listing
  - All 404 messages are consistent
  - price_type defaults to 'monthly' when missing on listing create
  - Pagination helper added (page / page_size query params) used on listings & reviews
"""

import base64
from django.db import connection
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

User = get_user_model()


# ============================================================
# SHARED HELPERS
# ============================================================

def _fetch_all(cursor):
    """Return all rows as a list of dicts."""
    cols = [c[0] for c in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def _fetch_one(cursor):
    """Return one row as a dict, or None."""
    row = cursor.fetchone()
    if not row:
        return None
    cols = [c[0] for c in cursor.description]
    return dict(zip(cols, row))


def _not_found(msg="Not found"):
    return Response({"error": msg}, status=status.HTTP_404_NOT_FOUND)


def _bad_request(msg):
    return Response({"error": msg}, status=status.HTTP_400_BAD_REQUEST)


def _paginate(query_params, base_query, params):
    """
    Add LIMIT / OFFSET to a query based on ?page=1&page_size=20.
    Returns (paginated_query, updated_params, meta_dict).
    """
    try:
        page = max(1, int(query_params.get("page", 1)))
        page_size = min(100, max(1, int(query_params.get("page_size", 20))))
    except ValueError:
        page, page_size = 1, 20

    offset = (page - 1) * page_size
    paginated = base_query + " LIMIT %s OFFSET %s"
    return paginated, params + [page_size, offset], {"page": page, "page_size": page_size}


def urlsafe_b64_encode(s):
    return base64.urlsafe_b64encode(s).decode("utf-8")


def urlsafe_b64_decode(s):
    # Add padding so decoding never fails on short strings
    padding = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * padding)


# ============================================================
# LISTINGS
# ============================================================

class ListingAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        search   = request.query_params.get("search")
        category = request.query_params.get("category")
        region   = request.query_params.get("region")
        min_price = request.query_params.get("min_price")
        max_price = request.query_params.get("max_price")

        query  = "SELECT * FROM listings WHERE is_active = true"
        params = []

        if search:
            query += " AND (title ILIKE %s OR description ILIKE %s)"
            params += [f"%{search}%", f"%{search}%"]
        if category:
            query += " AND category_id = %s"
            params.append(category)
        if region:
            query += " AND region_id = %s"
            params.append(region)
        if min_price:
            query += " AND price >= %s"
            params.append(min_price)
        if max_price:
            query += " AND price <= %s"
            params.append(max_price)

        query += " ORDER BY created_at DESC"
        query, params, meta = _paginate(request.query_params, query, params)

        with connection.cursor() as c:
            c.execute(query, params)
            listings = _fetch_all(c)

        return Response({"meta": meta, "results": listings})

    def post(self, request):
        data = request.data

        if not data.get("title") or not data.get("price"):
            return _bad_request("title and price are required")

        owner_id = data.get("owner_id")
        if not owner_id:
            return _bad_request("owner_id is required")

        # Verify owner exists
        with connection.cursor() as c:
            c.execute("SELECT id FROM users WHERE id = %s", [owner_id])
            if not c.fetchone():
                return _bad_request("owner_id does not match any user")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO listings
                    (owner_id, category_id, region_id, title, description,
                     address, latitude, longitude, price, price_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                [
                    owner_id,
                    data.get("category_id") or data.get("category"),
                    data.get("region_id")   or data.get("region"),
                    data.get("title"),
                    data.get("description"),
                    data.get("address"),
                    data.get("latitude"),
                    data.get("longitude"),
                    data.get("price"),
                    data.get("price_type", "monthly"),
                ],
            )
            listing = _fetch_one(c)

        return Response(listing, status=status.HTTP_201_CREATED)


class ListingDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listings WHERE id = %s", [pk])
            listing = _fetch_one(c)
        if not listing:
            return _not_found("Listing not found")
        return Response(listing)

    def put(self, request, pk):
        data = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listings
                SET owner_id    = %s,
                    category_id = %s,
                    region_id   = %s,
                    title       = %s,
                    description = %s,
                    address     = %s,
                    latitude    = %s,
                    longitude   = %s,
                    price       = %s,
                    price_type  = %s,
                    updated_at  = now()
                WHERE id = %s
                RETURNING *
                """,
                [
                    data.get("owner_id"),
                    data.get("category_id") or data.get("category"),
                    data.get("region_id")   or data.get("region"),
                    data.get("title"),
                    data.get("description"),
                    data.get("address"),
                    data.get("latitude"),
                    data.get("longitude"),
                    data.get("price"),
                    data.get("price_type", "monthly"),
                    pk,
                ],
            )
            listing = _fetch_one(c)
        if not listing:
            return _not_found("Listing not found")
        return Response(listing)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM listings WHERE id = %s RETURNING id", [pk])
            row = c.fetchone()
        if not row:
            return _not_found("Listing not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# BOOKINGS
# ============================================================

class BookingAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return _bad_request("user_id query parameter is required")

        with connection.cursor() as c:
            c.execute(
                "SELECT * FROM bookings WHERE user_id = %s ORDER BY created_at DESC",
                [user_id],
            )
            return Response(_fetch_all(c))

    def post(self, request):
        data    = request.data
        user_id = data.get("user_id")
        if not user_id:
            return _bad_request("user_id is required")

        if not data.get("start_date") or not data.get("end_date"):
            return _bad_request("start_date and end_date are required")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO bookings
                    (listing_id, user_id, start_date, end_date, total_price, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                [
                    data.get("listing_id") or data.get("listing"),
                    user_id,
                    data.get("start_date"),
                    data.get("end_date"),
                    data.get("total_price"),
                    data.get("status", "pending"),
                ],
            )
            booking = _fetch_one(c)
        return Response(booking, status=status.HTTP_201_CREATED)


class BookingDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def _get_booking(self, pk, user_id):
        with connection.cursor() as c:
            c.execute(
                "SELECT * FROM bookings WHERE id = %s AND user_id = %s",
                [pk, user_id],
            )
            return _fetch_one(c)

    def get(self, request, pk):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return _bad_request("user_id query parameter is required")
        booking = self._get_booking(pk, user_id)
        if not booking:
            return _not_found("Booking not found")
        return Response(booking)

    def put(self, request, pk):
        data    = request.data
        user_id = data.get("user_id")
        if not user_id:
            return _bad_request("user_id is required")

        with connection.cursor() as c:
            c.execute(
                """
                UPDATE bookings
                SET start_date  = %s,
                    end_date    = %s,
                    total_price = %s,
                    status      = %s
                WHERE id = %s AND user_id = %s
                RETURNING *
                """,
                [
                    data.get("start_date"),
                    data.get("end_date"),
                    data.get("total_price"),
                    data.get("status"),
                    pk,
                    user_id,
                ],
            )
            booking = _fetch_one(c)
        if not booking:
            return _not_found("Booking not found")
        return Response(booking)

    def delete(self, request, pk):
        user_id = request.query_params.get("user_id") or request.data.get("user_id")
        if not user_id:
            return _bad_request("user_id is required")

        with connection.cursor() as c:
            c.execute(
                "DELETE FROM bookings WHERE id = %s AND user_id = %s RETURNING id",
                [pk, user_id],
            )
            row = c.fetchone()
        if not row:
            return _not_found("Booking not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# REVIEWS
# ============================================================

class ReviewAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listing_id = request.query_params.get("listing")
        query  = "SELECT * FROM reviews WHERE 1=1"
        params = []
        if listing_id:
            query += " AND listing_id = %s"
            params.append(listing_id)
        query += " ORDER BY created_at DESC"
        query, params, meta = _paginate(request.query_params, query, params)

        with connection.cursor() as c:
            c.execute(query, params)
            return Response({"meta": meta, "results": _fetch_all(c)})

    def post(self, request):
        data    = request.data
        user_id = data.get("user_id")
        listing_id = data.get("listing_id") or data.get("listing")

        if not user_id:
            return _bad_request("user_id is required")
        if not listing_id:
            return _bad_request("listing_id is required")

        rating = data.get("rating")
        if rating is not None and not (1 <= int(rating) <= 5):
            return _bad_request("rating must be between 1 and 5")

        # Prevent duplicate review by same user on same listing
        with connection.cursor() as c:
            c.execute(
                "SELECT id FROM reviews WHERE listing_id = %s AND user_id = %s",
                [listing_id, user_id],
            )
            if c.fetchone():
                return Response(
                    {"error": "You have already reviewed this listing"},
                    status=status.HTTP_409_CONFLICT,
                )

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO reviews (listing_id, user_id, rating, comment)
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                [listing_id, user_id, rating, data.get("comment")],
            )
            review = _fetch_one(c)
        return Response(review, status=status.HTTP_201_CREATED)


class ReviewDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM reviews WHERE id = %s", [pk])
            review = _fetch_one(c)
        if not review:
            return _not_found("Review not found")
        return Response(review)

    def put(self, request, pk):
        data    = request.data
        user_id = data.get("user_id")
        if not user_id:
            return _bad_request("user_id is required")

        rating = data.get("rating")
        if rating is not None and not (1 <= int(rating) <= 5):
            return _bad_request("rating must be between 1 and 5")

        with connection.cursor() as c:
            c.execute(
                """
                UPDATE reviews
                SET rating = %s, comment = %s
                WHERE id = %s AND user_id = %s
                RETURNING *
                """,
                [rating, data.get("comment"), pk, user_id],
            )
            review = _fetch_one(c)
        if not review:
            return _not_found("Review not found or permission denied")
        return Response(review)

    def delete(self, request, pk):
        user_id = request.query_params.get("user_id") or request.data.get("user_id")
        if not user_id:
            return _bad_request("user_id is required")

        with connection.cursor() as c:
            c.execute(
                "DELETE FROM reviews WHERE id = %s AND user_id = %s RETURNING id",
                [pk, user_id],
            )
            row = c.fetchone()
        if not row:
            return _not_found("Review not found or permission denied")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# FAVORITES
# ============================================================

class FavoriteAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return _bad_request("user_id query parameter is required")

        with connection.cursor() as c:
            c.execute(
                """
                SELECT f.*, l.title, l.price, l.address
                FROM favorites f
                JOIN listings l ON l.id = f.listing_id
                WHERE f.user_id = %s
                ORDER BY f.created_at DESC
                """,
                [user_id],
            )
            return Response(_fetch_all(c))

    def post(self, request):
        data       = request.data
        user_id    = data.get("user_id")
        listing_id = data.get("listing_id") or data.get("listing")

        if not user_id or not listing_id:
            return _bad_request("user_id and listing_id are required")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO favorites (user_id, listing_id)
                VALUES (%s, %s)
                ON CONFLICT (user_id, listing_id) DO NOTHING
                RETURNING *
                """,
                [user_id, listing_id],
            )
            row = _fetch_one(c)

        if not row:
            return Response({"detail": "Already in favorites"}, status=status.HTTP_200_OK)
        return Response(row, status=status.HTTP_201_CREATED)


class FavoriteDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return _bad_request("user_id query parameter is required")

        with connection.cursor() as c:
            c.execute(
                "SELECT * FROM favorites WHERE listing_id = %s AND user_id = %s",
                [pk, user_id],
            )
            fav = _fetch_one(c)
        if not fav:
            return _not_found("Favorite not found")
        return Response(fav)

    def delete(self, request, pk):
        user_id = request.query_params.get("user_id") or request.data.get("user_id")
        if not user_id:
            return _bad_request("user_id is required")

        with connection.cursor() as c:
            c.execute(
                "DELETE FROM favorites WHERE listing_id = %s AND user_id = %s RETURNING listing_id",
                [pk, user_id],
            )
            row = c.fetchone()
        if not row:
            return _not_found("Favorite not found")
        return Response({"deleted_listing": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# CATEGORIES
# ============================================================

class CategoryAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM categories ORDER BY name")
            return Response(_fetch_all(c))

    def post(self, request):
        name = request.data.get("name")
        if not name:
            return _bad_request("name is required")

        with connection.cursor() as c:
            c.execute("INSERT INTO categories (name) VALUES (%s) RETURNING *", [name])
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class CategoryDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM categories WHERE id = %s", [pk])
            cat = _fetch_one(c)
        if not cat:
            return _not_found("Category not found")
        return Response(cat)

    def put(self, request, pk):
        name = request.data.get("name")
        if not name:
            return _bad_request("name is required")

        with connection.cursor() as c:
            c.execute(
                "UPDATE categories SET name = %s WHERE id = %s RETURNING *",
                [name, pk],
            )
            cat = _fetch_one(c)
        if not cat:
            return _not_found("Category not found")
        return Response(cat)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM categories WHERE id = %s RETURNING id", [pk])
            row = c.fetchone()
        if not row:
            return _not_found("Category not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# REGIONS
# ============================================================

class RegionAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM regions ORDER BY name")
            return Response(_fetch_all(c))

    def post(self, request):
        name      = request.data.get("name")
        parent_id = request.data.get("parent_id")
        if not name:
            return _bad_request("name is required")

        with connection.cursor() as c:
            c.execute(
                "INSERT INTO regions (name, parent_id) VALUES (%s, %s) RETURNING *",
                [name, parent_id],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class RegionDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM regions WHERE id = %s", [pk])
            region = _fetch_one(c)
        if not region:
            return _not_found("Region not found")
        return Response(region)

    def put(self, request, pk):
        name      = request.data.get("name")
        parent_id = request.data.get("parent_id")
        if not name:
            return _bad_request("name is required")

        with connection.cursor() as c:
            c.execute(
                "UPDATE regions SET name = %s, parent_id = %s WHERE id = %s RETURNING *",
                [name, parent_id, pk],
            )
            region = _fetch_one(c)
        if not region:
            return _not_found("Region not found")
        return Response(region)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM regions WHERE id = %s RETURNING id", [pk])
            row = c.fetchone()
        if not row:
            return _not_found("Region not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# LISTING AVAILABILITY
# ============================================================

class ListingAvailabilityAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listing_id = request.query_params.get("listing_id")
        query  = "SELECT * FROM listing_availability WHERE 1=1"
        params = []
        if listing_id:
            query += " AND listing_id = %s"
            params.append(listing_id)
        query += " ORDER BY date ASC"

        with connection.cursor() as c:
            c.execute(query, params)
            return Response(_fetch_all(c))

    def post(self, request):
        data = request.data
        if not data.get("listing_id") or not data.get("date"):
            return _bad_request("listing_id and date are required")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO listing_availability (listing_id, date, is_available)
                VALUES (%s, %s, %s)
                ON CONFLICT (listing_id, date)
                    DO UPDATE SET is_available = EXCLUDED.is_available
                RETURNING *
                """,
                [data.get("listing_id"), data.get("date"), data.get("is_available", True)],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class ListingAvailabilityDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_availability WHERE id = %s", [pk])
            row = _fetch_one(c)
        if not row:
            return _not_found("Availability record not found")
        return Response(row)

    def put(self, request, pk):
        data = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listing_availability
                SET listing_id = %s, date = %s, is_available = %s
                WHERE id = %s
                RETURNING *
                """,
                [data.get("listing_id"), data.get("date"), data.get("is_available", True), pk],
            )
            row = _fetch_one(c)
        if not row:
            return _not_found("Availability record not found")
        return Response(row)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute(
                "DELETE FROM listing_availability WHERE id = %s RETURNING id", [pk]
            )
            row = c.fetchone()
        if not row:
            return _not_found("Availability record not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# LISTING DETAILS
# ============================================================

class ListingDetailsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_details")
            return Response(_fetch_all(c))

    def post(self, request):
        d = request.data
        if not d.get("listing_id"):
            return _bad_request("listing_id is required")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO listing_details (
                    listing_id, floor_type, balcony, year_built, garage,
                    window_type, building_floors, door_type, area_sqm,
                    floor_number, window_count, payment_terms
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING *
                """,
                [
                    d.get("listing_id"),   d.get("floor_type"),
                    d.get("balcony"),      d.get("year_built"),
                    d.get("garage"),       d.get("window_type"),
                    d.get("building_floors"), d.get("door_type"),
                    d.get("area_sqm"),     d.get("floor_number"),
                    d.get("window_count"), d.get("payment_terms"),
                ],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class ListingDetailsDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, listing_id):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_details WHERE listing_id = %s", [listing_id])
            row = _fetch_one(c)
        if not row:
            return _not_found("Listing details not found")
        return Response(row)

    def put(self, request, listing_id):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listing_details
                SET floor_type = %s, balcony = %s, year_built = %s, garage = %s,
                    window_type = %s, building_floors = %s, door_type = %s,
                    area_sqm = %s, floor_number = %s, window_count = %s,
                    payment_terms = %s
                WHERE listing_id = %s
                RETURNING *
                """,
                [
                    d.get("floor_type"),      d.get("balcony"),
                    d.get("year_built"),      d.get("garage"),
                    d.get("window_type"),     d.get("building_floors"),
                    d.get("door_type"),       d.get("area_sqm"),
                    d.get("floor_number"),    d.get("window_count"),
                    d.get("payment_terms"),   listing_id,
                ],
            )
            row = _fetch_one(c)
        if not row:
            return _not_found("Listing details not found")
        return Response(row)

    def delete(self, request, listing_id):
        with connection.cursor() as c:
            c.execute(
                "DELETE FROM listing_details WHERE listing_id = %s RETURNING listing_id",
                [listing_id],
            )
            row = c.fetchone()
        if not row:
            return _not_found("Listing details not found")
        return Response({"deleted_listing": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# LISTING EXTRA FEATURES
# ============================================================

class ListingExtraFeatureAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listing_id = request.query_params.get("listing_id")
        query  = "SELECT * FROM listing_extra_features WHERE 1=1"
        params = []
        if listing_id:
            query += " AND listing_id = %s"
            params.append(listing_id)

        with connection.cursor() as c:
            c.execute(query, params)
            return Response(_fetch_all(c))

    def post(self, request):
        d = request.data
        if not d.get("listing_id") or not d.get("key"):
            return _bad_request("listing_id and key are required")

        with connection.cursor() as c:
            c.execute(
                "INSERT INTO listing_extra_features (listing_id, key, value) VALUES (%s,%s,%s) RETURNING *",
                [d.get("listing_id"), d.get("key"), d.get("value")],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class ListingExtraFeatureDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_extra_features WHERE id = %s", [pk])
            row = _fetch_one(c)
        if not row:
            return _not_found("Extra feature not found")
        return Response(row)

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listing_extra_features
                SET listing_id = %s, key = %s, value = %s
                WHERE id = %s
                RETURNING *
                """,
                [d.get("listing_id"), d.get("key"), d.get("value"), pk],
            )
            row = _fetch_one(c)
        if not row:
            return _not_found("Extra feature not found")
        return Response(row)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute(
                "DELETE FROM listing_extra_features WHERE id = %s RETURNING id", [pk]
            )
            row = c.fetchone()
        if not row:
            return _not_found("Extra feature not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# LISTING IMAGES
# ============================================================

class ListingImageAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listing_id = request.query_params.get("listing_id")
        query  = "SELECT * FROM listing_images WHERE 1=1"
        params = []
        if listing_id:
            query += " AND listing_id = %s"
            params.append(listing_id)
        query += " ORDER BY sort_order ASC"

        with connection.cursor() as c:
            c.execute(query, params)
            return Response(_fetch_all(c))

    def post(self, request):
        d = request.data
        if not d.get("listing_id") or not d.get("image_url"):
            return _bad_request("listing_id and image_url are required")

        with connection.cursor() as c:
            c.execute(
                "INSERT INTO listing_images (listing_id, image_url, sort_order) VALUES (%s,%s,%s) RETURNING *",
                [d.get("listing_id"), d.get("image_url"), d.get("sort_order", 0)],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class ListingImageDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_images WHERE id = %s", [pk])
            row = _fetch_one(c)
        if not row:
            return _not_found("Image not found")
        return Response(row)

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listing_images
                SET listing_id = %s, image_url = %s, sort_order = %s
                WHERE id = %s
                RETURNING *
                """,
                [d.get("listing_id"), d.get("image_url"), d.get("sort_order", 0), pk],
            )
            row = _fetch_one(c)
        if not row:
            return _not_found("Image not found")
        return Response(row)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM listing_images WHERE id = %s RETURNING id", [pk])
            row = c.fetchone()
        if not row:
            return _not_found("Image not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# MESSAGES
# ============================================================

class MessageAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        sender_id   = request.query_params.get("sender_id")
        receiver_id = request.query_params.get("receiver_id")
        query  = "SELECT * FROM messages WHERE 1=1"
        params = []
        if sender_id:
            query += " AND sender_id = %s"
            params.append(sender_id)
        if receiver_id:
            query += " AND receiver_id = %s"
            params.append(receiver_id)
        query += " ORDER BY created_at DESC"

        with connection.cursor() as c:
            c.execute(query, params)
            return Response(_fetch_all(c))

    def post(self, request):
        d = request.data
        if not d.get("sender_id") or not d.get("receiver_id") or not d.get("message"):
            return _bad_request("sender_id, receiver_id and message are required")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO messages (sender_id, receiver_id, listing_id, message)
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                [d.get("sender_id"), d.get("receiver_id"), d.get("listing_id"), d.get("message")],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class MessageDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM messages WHERE id = %s", [pk])
            msg = _fetch_one(c)
        if not msg:
            return _not_found("Message not found")
        return Response(msg)

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE messages
                SET sender_id = %s, receiver_id = %s, listing_id = %s, message = %s
                WHERE id = %s
                RETURNING *
                """,
                [d.get("sender_id"), d.get("receiver_id"), d.get("listing_id"), d.get("message"), pk],
            )
            msg = _fetch_one(c)
        if not msg:
            return _not_found("Message not found")
        return Response(msg)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM messages WHERE id = %s RETURNING id", [pk])
            row = c.fetchone()
        if not row:
            return _not_found("Message not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# MESSAGE THREADS (INBOX)
# ============================================================

class MessageThreadsAPIView(APIView):
    """
    GET /api/messages/threads/?user_id=1
    Returns unique conversation threads for a user, with the most recent
    message, partner info, and listing context per thread.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return _bad_request("user_id is required")

        with connection.cursor() as c:
            # Find all unique partners the user has messaged with (as sender or receiver)
            c.execute(
                """
                WITH thread_list AS (
                    SELECT
                        DISTINCT
                        CASE
                            WHEN sender_id = %s THEN receiver_id
                            ELSE sender_id
                        END AS partner_id,
                        MAX(created_at) AS last_message_at
                    FROM messages
                    WHERE sender_id = %s OR receiver_id = %s
                    GROUP BY partner_id
                    ORDER BY last_message_at DESC
                )
                SELECT
                    tl.partner_id,
                    tl.last_message_at,
                    m.id               AS last_message_id,
                    m.message          AS last_message_text,
                    m.sender_id,
                    m.receiver_id,
                    m.listing_id,
                    m.created_at       AS last_message_created,
                    u.username         AS partner_name,
                    u.email            AS partner_email,
                    l.title            AS listing_title,
                    l.price            AS listing_price,
                    l.price_type       AS listing_price_type,
                    li.image_url       AS listing_thumb
                FROM thread_list tl
                JOIN messages m ON (
                    m.created_at = tl.last_message_at
                    AND (
                        (m.sender_id = %s AND m.receiver_id = tl.partner_id)
                        OR (m.receiver_id = %s AND m.sender_id = tl.partner_id)
                    )
                )
                LEFT JOIN users u ON u.id = tl.partner_id
                LEFT JOIN listings l ON l.id = m.listing_id
                LEFT JOIN listing_images li ON li.listing_id = m.listing_id AND li.sort_order = 0
                ORDER BY tl.last_message_at DESC
                """,
                [user_id, user_id, user_id, user_id, user_id],
            )
            cols = [col[0] for col in c.description]
            threads = [dict(zip(cols, row)) for row in c.fetchall()]
            return Response(threads)


# ============================================================
# PAYMENTS
# ============================================================

class PaymentAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        booking_id = request.query_params.get("booking_id")
        query  = "SELECT * FROM payments WHERE 1=1"
        params = []
        if booking_id:
            query += " AND booking_id = %s"
            params.append(booking_id)
        query += " ORDER BY paid_at DESC NULLS LAST"

        with connection.cursor() as c:
            c.execute(query, params)
            return Response(_fetch_all(c))

    def post(self, request):
        d = request.data
        if not d.get("booking_id") or not d.get("amount"):
            return _bad_request("booking_id and amount are required")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO payments (booking_id, amount, method, status, paid_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
                """,
                [
                    d.get("booking_id"), d.get("amount"),
                    d.get("method"),     d.get("status"),
                    d.get("paid_at"),
                ],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class PaymentDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM payments WHERE id = %s", [pk])
            pay = _fetch_one(c)
        if not pay:
            return _not_found("Payment not found")
        return Response(pay)

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE payments
                SET booking_id = %s, amount = %s, method = %s, status = %s, paid_at = %s
                WHERE id = %s
                RETURNING *
                """,
                [d.get("booking_id"), d.get("amount"), d.get("method"), d.get("status"), d.get("paid_at"), pk],
            )
            pay = _fetch_one(c)
        if not pay:
            return _not_found("Payment not found")
        return Response(pay)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM payments WHERE id = %s RETURNING id", [pk])
            row = c.fetchone()
        if not row:
            return _not_found("Payment not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# USERS (custom public.users table)
# ============================================================

class UserAccountAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            # Never expose password_hash
            c.execute(
                "SELECT id, username, email, phone, role, is_verified, created_at FROM users ORDER BY created_at DESC"
            )
            return Response(_fetch_all(c))

    def post(self, request):
        d = request.data
        if not d.get("username") or not d.get("email") or not d.get("password_hash"):
            return _bad_request("username, email and password_hash are required")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO users (username, email, password_hash, phone, role, is_verified)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, username, email, phone, role, is_verified, created_at
                """,
                [
                    d.get("username"), d.get("email"), d.get("password_hash"),
                    d.get("phone"), d.get("role", "user"), d.get("is_verified", False),
                ],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class UserAccountDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute(
                "SELECT id, username, email, phone, role, is_verified, created_at FROM users WHERE id = %s",
                [pk],
            )
            user = _fetch_one(c)
        if not user:
            return _not_found("User not found")
        return Response(user)

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE users
                SET username = %s, email = %s, password_hash = %s,
                    phone = %s, role = %s, is_verified = %s
                WHERE id = %s
                RETURNING id, username, email, phone, role, is_verified, created_at
                """,
                [
                    d.get("username"), d.get("email"), d.get("password_hash"),
                    d.get("phone"), d.get("role", "user"), d.get("is_verified", False), pk,
                ],
            )
            user = _fetch_one(c)
        if not user:
            return _not_found("User not found")
        return Response(user)

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM users WHERE id = %s RETURNING id", [pk])
            row = c.fetchone()
        if not row:
            return _not_found("User not found")
        return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ============================================================
# AUTH
# ============================================================

class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        email    = request.data.get("email")
        password = request.data.get("password")
        phone    = request.data.get("phone")

        if not username or not email or not password:
            return _bad_request("username, email and password are required")

        if User.objects.filter(username=username).exists():
            return Response({"detail": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"detail": "Email already in use"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)

        # Mirror into public.users so FK constraints work
        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO users (username, email, password_hash, phone, role, is_verified)
                VALUES (%s, %s, %s, %s, 'user', false)
                ON CONFLICT (email) DO NOTHING
                """,
                [username, email, user.password, phone],
            )

        return Response(
            {"id": user.id, "username": user.username, "email": user.email},
            status=status.HTTP_201_CREATED,
        )


class RequestPasswordResetAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return _bad_request("email is required")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't leak whether the account exists
            return Response(
                {"detail": "If this email is registered, a reset token has been generated."},
                status=status.HTTP_200_OK,
            )

        token_generator = PasswordResetTokenGenerator()
        uid   = urlsafe_b64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        return Response(
            {
                "uid": uid,
                "token": token,
                "detail": "POST uid + token to /api/auth/reset-password/ with new_password.",
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid          = request.data.get("uid")
        token        = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uid or not token or not new_password:
            return _bad_request("uid, token and new_password are required")

        try:
            user_id = force_str(urlsafe_b64_decode(uid))
            user    = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Keep public.users password_hash in sync
        with connection.cursor() as c:
            c.execute(
                "UPDATE users SET password_hash = %s WHERE email = %s",
                [user.password, user.email],
            )

        return Response({"detail": "Password reset successfully."}, status=status.HTTP_200_OK)


class ChangePasswordAPIView(APIView):
    """
    POST /api/auth/change-password/
    Body: { user_id, old_password, new_password }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data         = request.data
        user_id      = data.get("user_id")
        old_password = data.get("old_password")
        new_password = data.get("new_password")

        if not user_id or not old_password or not new_password:
            return _bad_request("user_id, old_password and new_password are required")

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return _not_found("User not found")

        if not user.check_password(old_password):
            return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Keep public.users in sync
        with connection.cursor() as c:
            c.execute(
                "UPDATE users SET password_hash = %s WHERE email = %s",
                [user.password, user.email],
            )

        return Response({"detail": "Password changed successfully."}, status=status.HTTP_200_OK)


# ============================================================
# BROKER SYSTEM
# ============================================================

class BrokerApplyAPIView(APIView):
    """
    GET  /api/auth/broker-apply/?user_id=X  → own applications
    POST /api/auth/broker-apply/            → submit application
    Body: { user_id, license_no, agency_name, phone, note }
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user_id = request.query_params.get("user_id")
        if not user_id:
            return _bad_request("user_id query parameter is required")

        with connection.cursor() as c:
            c.execute(
                "SELECT * FROM broker_applications WHERE user_id = %s ORDER BY created_at DESC",
                [user_id],
            )
            return Response(_fetch_all(c))

    def post(self, request):
        data    = request.data
        user_id = data.get("user_id")
        if not user_id:
            return _bad_request("user_id is required")

        with connection.cursor() as c:
            c.execute("SELECT id, role FROM users WHERE id = %s", [user_id])
            user = _fetch_one(c)

        if not user:
            return _not_found("User not found")
        if user["role"] == "broker":
            return _bad_request("User is already a broker")

        with connection.cursor() as c:
            c.execute(
                "SELECT id FROM broker_applications WHERE user_id = %s AND status = 'pending'",
                [user_id],
            )
            if c.fetchone():
                return _bad_request("A pending application already exists for this user")

        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO broker_applications
                    (user_id, license_no, agency_name, phone, note, status)
                VALUES (%s, %s, %s, %s, %s, 'pending')
                RETURNING *
                """,
                [
                    user_id,
                    data.get("license_no"),
                    data.get("agency_name"),
                    data.get("phone"),
                    data.get("note"),
                ],
            )
            return Response(_fetch_one(c), status=status.HTTP_201_CREATED)


class BrokerReviewAPIView(APIView):
    """
    POST /api/auth/broker-apply/<pk>/review/
    Body: { action: "approve"|"reject", reviewed_by, reject_reason? }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        data        = request.data
        action      = data.get("action")
        reviewed_by = data.get("reviewed_by")

        if action not in ("approve", "reject"):
            return _bad_request("action must be 'approve' or 'reject'")
        if not reviewed_by:
            return _bad_request("reviewed_by (admin user_id) is required")

        with connection.cursor() as c:
            c.execute("SELECT * FROM broker_applications WHERE id = %s", [pk])
            app = _fetch_one(c)

        if not app:
            return _not_found("Application not found")
        if app["status"] != "pending":
            return _bad_request(f"Application is already '{app['status']}'")

        new_status = "approved" if action == "approve" else "rejected"

        with connection.cursor() as c:
            c.execute(
                """
                UPDATE broker_applications
                SET status        = %s,
                    reject_reason = %s,
                    reviewed_by   = %s,
                    reviewed_at   = now()
                WHERE id = %s
                RETURNING *
                """,
                [
                    new_status,
                    data.get("reject_reason") if action == "reject" else None,
                    reviewed_by,
                    pk,
                ],
            )
            updated_app = _fetch_one(c)

            if action == "approve":
                c.execute("UPDATE users SET role = 'broker' WHERE id = %s", [app["user_id"]])
                c.execute(
                    """
                    INSERT INTO broker_profiles
                        (user_id, license_no, agency_name, is_verified, verified_at)
                    VALUES (%s, %s, %s, true, now())
                    ON CONFLICT (user_id) DO UPDATE
                        SET license_no  = EXCLUDED.license_no,
                            agency_name = EXCLUDED.agency_name,
                            is_verified = true,
                            verified_at = now(),
                            updated_at  = now()
                    """,
                    [app["user_id"], app.get("license_no"), app.get("agency_name")],
                )

        return Response(
            {
                "application": updated_app,
                "message": "Broker approved and profile created." if action == "approve" else "Application rejected.",
            }
        )


class BrokerApplicationListAPIView(APIView):
    """GET /api/broker/applications/?status=pending"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_filter = request.query_params.get("status")
        query  = """
            SELECT ba.*, u.username, u.email
            FROM broker_applications ba
            JOIN users u ON u.id = ba.user_id
            WHERE 1=1
        """
        params = []
        if status_filter:
            query += " AND ba.status = %s"
            params.append(status_filter)
        query += " ORDER BY ba.created_at DESC"

        with connection.cursor() as c:
            c.execute(query, params)
            return Response(_fetch_all(c))


class BrokerListAPIView(APIView):
    """GET /api/brokers/  — public list of approved brokers"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM broker_list ORDER BY broker_since DESC")
            return Response(_fetch_all(c))


class BrokerProfileAPIView(APIView):
    """GET/PUT /api/brokers/<user_id>/"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        with connection.cursor() as c:
            c.execute(
                """
                SELECT bp.*, u.username, u.email, u.phone
                FROM broker_profiles bp
                JOIN users u ON u.id = bp.user_id
                WHERE bp.user_id = %s
                """,
                [user_id],
            )
            profile = _fetch_one(c)
        if not profile:
            return _not_found("Broker profile not found")
        return Response(profile)

    def put(self, request, user_id):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE broker_profiles
                SET bio           = %s,
                    profile_image = %s,
                    agency_name   = %s,
                    license_no    = %s,
                    updated_at    = now()
                WHERE user_id = %s
                RETURNING *
                """,
                [d.get("bio"), d.get("profile_image"), d.get("agency_name"), d.get("license_no"), user_id],
            )
            profile = _fetch_one(c)
        if not profile:
            return _not_found("Broker profile not found")
        return Response(profile)


# ============================================================
# LISTING FULL DETAIL
# ============================================================

class ListingFullDetailAPIView(APIView):
    """
    GET /api/listings/<pk>/full/
    Returns everything about a listing in one request:
    listing + owner (+ broker profile if owner is broker)
    + category + region + details + images
    + extra_features + availability + reviews + rating
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:

            # 1. Main listing
            c.execute("SELECT * FROM listings WHERE id = %s", [pk])
            listing = _fetch_one(c)
            if not listing:
                return _not_found("Listing not found")

            # 2. Owner + optional broker profile
            c.execute(
                "SELECT id, username, email, phone, role FROM users WHERE id = %s",
                [listing["owner_id"]],
            )
            owner = _fetch_one(c)
            if owner and owner["role"] == "broker":
                c.execute(
                    "SELECT * FROM broker_profiles WHERE user_id = %s",
                    [owner["id"]],
                )
                owner["broker_profile"] = _fetch_one(c)
            listing["owner"] = owner

            # 3. Category
            c.execute("SELECT * FROM categories WHERE id = %s", [listing["category_id"]])
            listing["category"] = _fetch_one(c)

            # 4. Region (with parent name if available)
            c.execute(
                """
                SELECT r.*, p.name AS parent_name
                FROM regions r
                LEFT JOIN regions p ON p.id = r.parent_id
                WHERE r.id = %s
                """,
                [listing["region_id"]],
            )
            listing["region"] = _fetch_one(c)

            # 5. Listing details
            c.execute("SELECT * FROM listing_details WHERE listing_id = %s", [pk])
            listing["details"] = _fetch_one(c)

            # 6. Images
            c.execute(
                "SELECT * FROM listing_images WHERE listing_id = %s ORDER BY sort_order ASC",
                [pk],
            )
            listing["images"] = _fetch_all(c)

            # 7. Extra features
            c.execute("SELECT * FROM listing_extra_features WHERE listing_id = %s", [pk])
            listing["extra_features"] = _fetch_all(c)

            # 8. Availability (future dates only)
            c.execute(
                "SELECT * FROM listing_availability WHERE listing_id = %s AND date >= CURRENT_DATE ORDER BY date ASC",
                [pk],
            )
            listing["availability"] = _fetch_all(c)

            # 9. Reviews + reviewer username
            c.execute(
                """
                SELECT r.*, u.username
                FROM reviews r
                LEFT JOIN users u ON u.id = r.user_id
                WHERE r.listing_id = %s
                ORDER BY r.created_at DESC
                """,
                [pk],
            )
            reviews = _fetch_all(c)
            listing["reviews"]      = reviews
            listing["review_count"] = len(reviews)
            listing["rating_avg"]   = (
                round(
                    sum(r["rating"] for r in reviews if r["rating"]) /
                    len([r for r in reviews if r["rating"]]),
                    1,
                )
                if any(r["rating"] for r in reviews)
                else None
            )

        return Response(listing)