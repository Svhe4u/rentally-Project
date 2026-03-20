import base64
from django.db import connection
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response


def urlsafe_b64_encode(s):
    return base64.urlsafe_b64encode(s).decode('utf-8')


def urlsafe_b64_decode(s):
    return base64.urlsafe_b64decode(s + '==')  # padding-г нөхнө


User = get_user_model()


# ----------------------
# LISTINGS
# ----------------------
class ListingAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        search = request.query_params.get('search')
        category = request.query_params.get('category')
        region = request.query_params.get('region')

        query = "SELECT * FROM listings WHERE 1=1"
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

        with connection.cursor() as c:
            c.execute(query, params)
            columns = [col[0] for col in c.description]
            listings = [dict(zip(columns, row)) for row in c.fetchall()]

        return Response(listings)

    def post(self, request):
        data = request.data
        if not data.get('title') or not data.get('price'):
            return Response(
                {'error': 'title and price are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with connection.cursor() as c:
            c.execute("""
                INSERT INTO listings
                (owner_id, category_id, region_id, title, description, address, latitude, longitude, price, price_type)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *
            """, [
                data.get('owner_id'),
                data.get('category_id') or data.get('category'),
                data.get('region_id') or data.get('region'),
                data.get('title'),
                data.get('description'),
                data.get('address'),
                data.get('latitude'),
                data.get('longitude'),
                data.get('price'),
                data.get('price_type'),
            ])
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            listing = dict(zip(columns, row))

        return Response(listing, status=status.HTTP_201_CREATED)


class ListingDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listings WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        data = request.data
        with connection.cursor() as c:
            # FIX: corrected parameter order to match SQL placeholders
            c.execute("""
                UPDATE listings
                SET owner_id=%s, category_id=%s, region_id=%s,
                    title=%s, description=%s, address=%s,
                    latitude=%s, longitude=%s, price=%s, price_type=%s
                WHERE id=%s RETURNING *
            """, [
                data.get('owner_id'),
                data.get('category_id') or data.get('category'),
                data.get('region_id') or data.get('region'),
                data.get('title'),
                data.get('description'),
                data.get('address'),
                data.get('latitude'),
                data.get('longitude'),
                data.get('price'),
                data.get('price_type'),
                pk,
            ])
            row = c.fetchone()
            if not row:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM listings WHERE id=%s RETURNING id", [pk])
            row = c.fetchone()
            if not row:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'deleted': row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# BOOKINGS
# ----------------------
class BookingAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # FIX: use query param instead of request.user (AllowAny permission set)
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with connection.cursor() as c:
            c.execute("SELECT * FROM bookings WHERE user_id=%s", [user_id])
            columns = [col[0] for col in c.description]
            bookings = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(bookings)

    def post(self, request):
        data = request.data
        # FIX: use user_id from request body instead of request.user
        user_id = data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with connection.cursor() as c:
            c.execute("""
                INSERT INTO bookings
                (listing_id, user_id, start_date, end_date, total_price, status)
                VALUES (%s,%s,%s,%s,%s,%s) RETURNING *
            """, [
                data.get('listing_id') or data.get('listing'),
                user_id,
                data.get('start_date'),
                data.get('end_date'),
                data.get('total_price'),
                data.get('status', 'pending'),
            ])
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            booking = dict(zip(columns, row))
        return Response(booking, status=status.HTTP_201_CREATED)


class BookingDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_object(self, pk, user_id):
        with connection.cursor() as c:
            c.execute("SELECT * FROM bookings WHERE id=%s AND user_id=%s", [pk, user_id])
            row = c.fetchone()
            if not row:
                return None
            columns = [col[0] for col in c.description]
            return dict(zip(columns, row))

    def get(self, request, pk):
        # FIX: use query param
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        booking = self.get_object(pk, user_id)
        if not booking:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(booking)

    def put(self, request, pk):
        data = request.data
        user_id = data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute("""
                UPDATE bookings
                SET start_date=%s, end_date=%s, total_price=%s, status=%s
                WHERE id=%s AND user_id=%s RETURNING *
            """, [
                data.get('start_date'),
                data.get('end_date'),
                data.get('total_price'),
                data.get('status'),
                pk,
                user_id,
            ])
            row = c.fetchone()
            if not row:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        user_id = request.query_params.get('user_id') or request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute("DELETE FROM bookings WHERE id=%s AND user_id=%s RETURNING id", [pk, user_id])
            row = c.fetchone()
            if not row:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'deleted': row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# REVIEWS
# ----------------------
class ReviewAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listing_id = request.query_params.get('listing')
        query = "SELECT * FROM reviews WHERE 1=1"
        params = []
        if listing_id:
            query += " AND listing_id=%s"
            params.append(listing_id)

        with connection.cursor() as c:
            c.execute(query, params)
            columns = [col[0] for col in c.description]
            reviews = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(reviews)

    def post(self, request):
        data = request.data
        user_id = data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute("""
                INSERT INTO reviews
                (listing_id, user_id, rating, comment)
                VALUES (%s,%s,%s,%s) RETURNING *
            """, [
                data.get('listing_id') or data.get('listing'),
                user_id,
                data.get('rating'),
                data.get('comment'),
            ])
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            review = dict(zip(columns, row))
        return Response(review, status=status.HTTP_201_CREATED)


class ReviewDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_object(self, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM reviews WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return None
            columns = [col[0] for col in c.description]
            return dict(zip(columns, row))

    def get(self, request, pk):
        review = self.get_object(pk)
        if not review:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(review)

    def put(self, request, pk):
        data = request.data
        user_id = data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute("""
                UPDATE reviews
                SET rating=%s, comment=%s
                WHERE id=%s AND user_id=%s RETURNING *
            """, [
                data.get('rating'),
                data.get('comment'),
                pk,
                user_id,
            ])
            row = c.fetchone()
            if not row:
                return Response({'error': 'Not found or permission denied'}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        user_id = request.query_params.get('user_id') or request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute("DELETE FROM reviews WHERE id=%s AND user_id=%s RETURNING id", [pk, user_id])
            row = c.fetchone()
            if not row:
                return Response({'error': 'Not found or permission denied'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'deleted': row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# FAVORITES
# ----------------------
class FavoriteAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute("SELECT * FROM favorites WHERE user_id=%s", [user_id])
            columns = [col[0] for col in c.description]
            favorites = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(favorites)

    def post(self, request):
        data = request.data
        user_id = data.get('user_id')
        listing_id = data.get('listing_id') or data.get('listing')
        if not user_id or not listing_id:
            return Response({'error': 'user_id and listing_id are required'}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            # FIX: column order matches schema (user_id, listing_id); ON CONFLICT to avoid duplicate errors
            c.execute("""
                INSERT INTO favorites (user_id, listing_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
                RETURNING *
            """, [user_id, listing_id])
            row = c.fetchone()
            if not row:
                return Response({'detail': 'Already in favorites'}, status=status.HTTP_200_OK)
            columns = [col[0] for col in c.description]
            favorite = dict(zip(columns, row))
        return Response(favorite, status=status.HTTP_201_CREATED)


class FavoriteDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get_object(self, listing_id, user_id):
        with connection.cursor() as c:
            c.execute("SELECT * FROM favorites WHERE listing_id=%s AND user_id=%s", [listing_id, user_id])
            row = c.fetchone()
            if not row:
                return None
            columns = [col[0] for col in c.description]
            return dict(zip(columns, row))

    def get(self, request, pk):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        favorite = self.get_object(pk, user_id)
        if not favorite:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(favorite)

    def delete(self, request, pk):
        user_id = request.query_params.get('user_id') or request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute(
                "DELETE FROM favorites WHERE listing_id=%s AND user_id=%s RETURNING listing_id",
                [pk, user_id],
            )
            row = c.fetchone()
            if not row:
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'deleted_listing': row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# CATEGORIES
# ----------------------
class CategoryAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM categories")
            columns = [col[0] for col in c.description]
            categories = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(categories)

    def post(self, request):
        name = request.data.get("name")
        if not name:
            return Response({"detail": "name is required"}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute(
                "INSERT INTO categories (name) VALUES (%s) RETURNING *",
                [name],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            category = dict(zip(columns, row))
        return Response(category, status=status.HTTP_201_CREATED)


class CategoryDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM categories WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        name = request.data.get("name")
        with connection.cursor() as c:
            c.execute(
                "UPDATE categories SET name=%s WHERE id=%s RETURNING *",
                [name, pk],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM categories WHERE id=%s RETURNING id", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# REGIONS
# ----------------------
class RegionAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM regions")
            columns = [col[0] for col in c.description]
            regions = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(regions)

    def post(self, request):
        name = request.data.get("name")
        parent_id = request.data.get("parent_id")
        if not name:
            return Response({"detail": "name is required"}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as c:
            c.execute(
                "INSERT INTO regions (name, parent_id) VALUES (%s, %s) RETURNING *",
                [name, parent_id],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            region = dict(zip(columns, row))
        return Response(region, status=status.HTTP_201_CREATED)


class RegionDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM regions WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        name = request.data.get("name")
        parent_id = request.data.get("parent_id")
        with connection.cursor() as c:
            c.execute(
                "UPDATE regions SET name=%s, parent_id=%s WHERE id=%s RETURNING *",
                [name, parent_id, pk],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM regions WHERE id=%s RETURNING id", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# LISTING AVAILABILITY
# ----------------------
class ListingAvailabilityAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listing_id = request.query_params.get('listing_id')
        query = "SELECT * FROM listing_availability WHERE 1=1"
        params = []
        if listing_id:
            query += " AND listing_id=%s"
            params.append(listing_id)
        with connection.cursor() as c:
            c.execute(query, params)
            columns = [col[0] for col in c.description]
            rows = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(rows)

    def post(self, request):
        data = request.data
        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO listing_availability (listing_id, date, is_available)
                VALUES (%s, %s, %s)
                ON CONFLICT (listing_id, date) DO UPDATE SET is_available=EXCLUDED.is_available
                RETURNING *
                """,
                [
                    data.get("listing_id"),
                    data.get("date"),
                    data.get("is_available", True),
                ],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            created = dict(zip(columns, row))
        return Response(created, status=status.HTTP_201_CREATED)


class ListingAvailabilityDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_availability WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        data = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listing_availability
                SET listing_id=%s, date=%s, is_available=%s
                WHERE id=%s RETURNING *
                """,
                [
                    data.get("listing_id"),
                    data.get("date"),
                    data.get("is_available", True),
                    pk,
                ],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM listing_availability WHERE id=%s RETURNING id", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# LISTING DETAILS
# ----------------------
class ListingDetailsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_details")
            columns = [col[0] for col in c.description]
            rows = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(rows)

    def post(self, request):
        d = request.data
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
                    d.get("listing_id"),
                    d.get("floor_type"),
                    d.get("balcony"),
                    d.get("year_built"),
                    d.get("garage"),
                    d.get("window_type"),
                    d.get("building_floors"),
                    d.get("door_type"),
                    d.get("area_sqm"),
                    d.get("floor_number"),
                    d.get("window_count"),
                    d.get("payment_terms"),
                ],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            created = dict(zip(columns, row))
        return Response(created, status=status.HTTP_201_CREATED)


class ListingDetailsDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, listing_id):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_details WHERE listing_id=%s", [listing_id])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, listing_id):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listing_details
                SET floor_type=%s, balcony=%s, year_built=%s, garage=%s,
                    window_type=%s, building_floors=%s, door_type=%s,
                    area_sqm=%s, floor_number=%s, window_count=%s,
                    payment_terms=%s
                WHERE listing_id=%s
                RETURNING *
                """,
                [
                    d.get("floor_type"),
                    d.get("balcony"),
                    d.get("year_built"),
                    d.get("garage"),
                    d.get("window_type"),
                    d.get("building_floors"),
                    d.get("door_type"),
                    d.get("area_sqm"),
                    d.get("floor_number"),
                    d.get("window_count"),
                    d.get("payment_terms"),
                    listing_id,
                ],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, listing_id):
        with connection.cursor() as c:
            c.execute(
                "DELETE FROM listing_details WHERE listing_id=%s RETURNING listing_id",
                [listing_id],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted_listing": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# LISTING EXTRA FEATURES
# ----------------------
class ListingExtraFeatureAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listing_id = request.query_params.get('listing_id')
        query = "SELECT * FROM listing_extra_features WHERE 1=1"
        params = []
        if listing_id:
            query += " AND listing_id=%s"
            params.append(listing_id)
        with connection.cursor() as c:
            c.execute(query, params)
            columns = [col[0] for col in c.description]
            rows = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(rows)

    def post(self, request):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO listing_extra_features (listing_id, key, value)
                VALUES (%s, %s, %s) RETURNING *
                """,
                [
                    d.get("listing_id"),
                    d.get("key"),
                    d.get("value"),
                ],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            created = dict(zip(columns, row))
        return Response(created, status=status.HTTP_201_CREATED)


class ListingExtraFeatureDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_extra_features WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listing_extra_features
                SET listing_id=%s, key=%s, value=%s
                WHERE id=%s RETURNING *
                """,
                [
                    d.get("listing_id"),
                    d.get("key"),
                    d.get("value"),
                    pk,
                ],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute(
                "DELETE FROM listing_extra_features WHERE id=%s RETURNING id",
                [pk],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# LISTING IMAGES
# ----------------------
class ListingImageAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listing_id = request.query_params.get('listing_id')
        query = "SELECT * FROM listing_images WHERE 1=1"
        params = []
        if listing_id:
            query += " AND listing_id=%s"
            params.append(listing_id)
        with connection.cursor() as c:
            c.execute(query, params)
            columns = [col[0] for col in c.description]
            rows = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(rows)

    def post(self, request):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO listing_images (listing_id, image_url, sort_order)
                VALUES (%s, %s, %s) RETURNING *
                """,
                [
                    d.get("listing_id"),
                    d.get("image_url"),
                    d.get("sort_order", 0),
                ],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            created = dict(zip(columns, row))
        return Response(created, status=status.HTTP_201_CREATED)


class ListingImageDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM listing_images WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE listing_images
                SET listing_id=%s, image_url=%s, sort_order=%s
                WHERE id=%s RETURNING *
                """,
                [
                    d.get("listing_id"),
                    d.get("image_url"),
                    d.get("sort_order", 0),
                    pk,
                ],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM listing_images WHERE id=%s RETURNING id", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# MESSAGES
# ----------------------
class MessageAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        sender_id = request.query_params.get('sender_id')
        receiver_id = request.query_params.get('receiver_id')
        query = "SELECT * FROM messages WHERE 1=1"
        params = []
        if sender_id:
            query += " AND sender_id=%s"
            params.append(sender_id)
        if receiver_id:
            query += " AND receiver_id=%s"
            params.append(receiver_id)
        with connection.cursor() as c:
            c.execute(query, params)
            columns = [col[0] for col in c.description]
            rows = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(rows)

    def post(self, request):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO messages (sender_id, receiver_id, listing_id, message)
                VALUES (%s, %s, %s, %s) RETURNING *
                """,
                [
                    d.get("sender_id"),
                    d.get("receiver_id"),
                    d.get("listing_id"),
                    d.get("message"),
                ],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            created = dict(zip(columns, row))
        return Response(created, status=status.HTTP_201_CREATED)


class MessageDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM messages WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE messages
                SET sender_id=%s, receiver_id=%s, listing_id=%s, message=%s
                WHERE id=%s RETURNING *
                """,
                [
                    d.get("sender_id"),
                    d.get("receiver_id"),
                    d.get("listing_id"),
                    d.get("message"),
                    pk,
                ],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM messages WHERE id=%s RETURNING id", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# PAYMENTS
# ----------------------
class PaymentAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM payments")
            columns = [col[0] for col in c.description]
            rows = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(rows)

    def post(self, request):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO payments (booking_id, amount, method, status, paid_at)
                VALUES (%s, %s, %s, %s, %s) RETURNING *
                """,
                [
                    d.get("booking_id"),
                    d.get("amount"),
                    d.get("method"),
                    d.get("status"),
                    d.get("paid_at"),
                ],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            created = dict(zip(columns, row))
        return Response(created, status=status.HTTP_201_CREATED)


class PaymentDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM payments WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE payments
                SET booking_id=%s, amount=%s, method=%s, status=%s, paid_at=%s
                WHERE id=%s RETURNING *
                """,
                [
                    d.get("booking_id"),
                    d.get("amount"),
                    d.get("method"),
                    d.get("status"),
                    d.get("paid_at"),
                    pk,
                ],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM payments WHERE id=%s RETURNING id", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# CUSTOM USERS TABLE
# ----------------------
class UserAccountAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        with connection.cursor() as c:
            c.execute("SELECT * FROM users")
            columns = [col[0] for col in c.description]
            rows = [dict(zip(columns, row)) for row in c.fetchall()]
        return Response(rows)

    def post(self, request):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                INSERT INTO users (
                    username, email, password_hash, phone, role, is_verified
                )
                VALUES (%s,%s,%s,%s,%s,%s) RETURNING *
                """,
                [
                    d.get("username"),
                    d.get("email"),
                    d.get("password_hash"),
                    d.get("phone"),
                    d.get("role", "user"),
                    d.get("is_verified", False),
                ],
            )
            row = c.fetchone()
            columns = [col[0] for col in c.description]
            created = dict(zip(columns, row))
        return Response(created, status=status.HTTP_201_CREATED)


class UserAccountDetailAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:
            c.execute("SELECT * FROM users WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def put(self, request, pk):
        d = request.data
        with connection.cursor() as c:
            c.execute(
                """
                UPDATE users
                SET username=%s,
                    email=%s,
                    password_hash=%s,
                    phone=%s,
                    role=%s,
                    is_verified=%s
                WHERE id=%s
                RETURNING *
                """,
                [
                    d.get("username"),
                    d.get("email"),
                    d.get("password_hash"),
                    d.get("phone"),
                    d.get("role", "user"),
                    d.get("is_verified", False),
                    pk,
                ],
            )
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            return Response(dict(zip(columns, row)))

    def delete(self, request, pk):
        with connection.cursor() as c:
            c.execute("DELETE FROM users WHERE id=%s RETURNING id", [pk])
            row = c.fetchone()
            if not row:
                return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"deleted": row[0]}, status=status.HTTP_204_NO_CONTENT)


# ----------------------
# AUTH / USERS
# ----------------------
class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")
        phone = request.data.get("phone")

        if not username or not email or not password:
            return Response(
                {"detail": "username, email and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Username already taken"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "Email already in use"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )

        # FIX: also insert into public.users so bookings/reviews/favorites FKs work
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
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class RequestPasswordResetAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"detail": "email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "If an account exists for this email, a reset token was generated."},
                status=status.HTTP_200_OK,
            )

        token_generator = PasswordResetTokenGenerator()
        uid = urlsafe_b64_encode(force_bytes(user.pk))  # FIX: now properly imported
        token = token_generator.make_token(user)

        return Response(
            {
                "uid": uid,
                "token": token,
                "detail": "Use uid and token with /auth/reset-password/ to set a new password.",
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uid or not token or not new_password:
            return Response(
                {"detail": "uid, token and new_password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_b64_decode(uid))  # FIX: now properly imported
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"detail": "Password has been reset successfully."},
            status=status.HTTP_200_OK,
        )


# ----------------------
# LISTING FULL DETAIL
# ----------------------
class ListingFullDetailAPIView(APIView):
    """
    GET /api/listings/<pk>/full/
    Нэг listing-ийн бүх мэдээллийг нэг дор буцаана:
    - listing
    - listing_details
    - listing_images
    - listing_extra_features
    - listing_availability
    - reviews (+ reviewer info)
    - owner info
    - category & region
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        with connection.cursor() as c:

            # 1. Main listing
            c.execute("SELECT * FROM listings WHERE id=%s", [pk])
            row = c.fetchone()
            if not row:
                return Response({'error': 'Listing not found'}, status=status.HTTP_404_NOT_FOUND)
            columns = [col[0] for col in c.description]
            listing = dict(zip(columns, row))

            # 2. Owner info
            c.execute(
                "SELECT id, username, email, phone, role FROM users WHERE id=%s",
                [listing['owner_id']],
            )
            owner_row = c.fetchone()
            if owner_row:
                owner_cols = [col[0] for col in c.description]
                listing['owner'] = dict(zip(owner_cols, owner_row))
            else:
                listing['owner'] = None

            # 3. Category
            c.execute("SELECT * FROM categories WHERE id=%s", [listing['category_id']])
            cat_row = c.fetchone()
            if cat_row:
                cat_cols = [col[0] for col in c.description]
                listing['category'] = dict(zip(cat_cols, cat_row))
            else:
                listing['category'] = None

            # 4. Region
            c.execute("SELECT * FROM regions WHERE id=%s", [listing['region_id']])
            reg_row = c.fetchone()
            if reg_row:
                reg_cols = [col[0] for col in c.description]
                listing['region'] = dict(zip(reg_cols, reg_row))
            else:
                listing['region'] = None

            # 5. Listing details
            c.execute("SELECT * FROM listing_details WHERE listing_id=%s", [pk])
            det_row = c.fetchone()
            if det_row:
                det_cols = [col[0] for col in c.description]
                listing['details'] = dict(zip(det_cols, det_row))
            else:
                listing['details'] = None

            # 6. Images
            c.execute(
                "SELECT * FROM listing_images WHERE listing_id=%s ORDER BY sort_order ASC",
                [pk],
            )
            img_cols = [col[0] for col in c.description]
            listing['images'] = [dict(zip(img_cols, r)) for r in c.fetchall()]

            # 7. Extra features
            c.execute("SELECT * FROM listing_extra_features WHERE listing_id=%s", [pk])
            feat_cols = [col[0] for col in c.description]
            listing['extra_features'] = [dict(zip(feat_cols, r)) for r in c.fetchall()]

            # 8. Availability
            c.execute(
                "SELECT * FROM listing_availability WHERE listing_id=%s ORDER BY date ASC",
                [pk],
            )
            avail_cols = [col[0] for col in c.description]
            listing['availability'] = [dict(zip(avail_cols, r)) for r in c.fetchall()]

            # 9. Reviews + reviewer username
            c.execute(
                """
                SELECT r.*, u.username, u.email
                FROM reviews r
                LEFT JOIN users u ON u.id = r.user_id
                WHERE r.listing_id=%s
                ORDER BY r.created_at DESC
                """,
                [pk],
            )
            rev_cols = [col[0] for col in c.description]
            reviews = [dict(zip(rev_cols, r)) for r in c.fetchall()]

            listing['reviews'] = reviews
            listing['rating_avg'] = (
                round(sum(r['rating'] for r in reviews if r['rating']) / len(reviews), 1)
                if reviews else None
            )
            listing['review_count'] = len(reviews)

        return Response(listing)