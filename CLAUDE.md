# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Rentally** is a property rental platform optimized for the Mongolian market. It consists of:

- **Backend**: Django REST API with JWT authentication
- **Frontend**: React Native / Expo mobile app
- **Database**: PostgreSQL

## Development Commands

### Backend (Django)

```bash
cd rentally_backend

# Setup
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Database
python manage.py migrate
python manage.py seed_mongolia  # Seed cities, districts, categories

# Run server
python manage.py runserver

# Django shell with auto-import
python manage.py shell_plus

# Tests
python manage.py test
pytest
```

### Frontend (React Native / Expo)

```bash
cd rentally_frontend

# Setup
npm install

# Run (choose one)
npm start        # Expo dev tools
npm run android  # Android emulator
npm run ios      # iOS simulator
npm run web      # Web preview
```

### Environment Setup

Backend requires `.env` file in `rentally_backend/` with:

```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/rentally
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
JWT_SECRET_KEY=your-jwt-secret
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## Architecture

### Backend Structure

The backend follows a layered architecture:

```
┌─────────────────────────────────────────┐
│  Views (APIViews) - HTTP handling      │
│  - Permission checks                    │
│  - Request/response serialization     │
├─────────────────────────────────────────┤
│  Serializers - Data validation         │
│  - Input validation                   │
│  - Output formatting                  │
├─────────────────────────────────────────┤
│  Services - Business logic            │
│  - Database operations                │
│  - Complex queries                  │
├─────────────────────────────────────────┤
│  Models - Data layer                   │
│  - Relationships                      │
│  - Constraints                        │
└─────────────────────────────────────────┘
```

**Key Patterns:**

1. **Service Layer Pattern**: Business logic lives in `services.py` (ListingService, BookingService, etc.), not in views or models. Views delegate to services for all data operations.

2. **Permission by HTTP Method**: Views use `get_permissions()` to allow public GET but require authentication for POST/PUT/DELETE.

3. **Soft Deletes**: Listings use `status='archived'` instead of hard deletion.

4. **Mongolia Localization**: All Mongolia-specific data (cities, districts, utility estimates, seasonal trends) is in `api/locale_mn.py`.

### Key Files

| File | Purpose |
|------|---------|
| `api/views.py` | API endpoints using DRF APIView classes |
| `api/serializers.py` | DRF serializers with validation |
| `api/services.py` | Business logic layer |
| `api/models.py` | Django ORM models |
| `api/auth_views.py` | Authentication endpoints (register, login) |
| `api/locale_mn.py` | Mongolia-specific constants and helpers |
| `api/middleware.py` | Request logging middleware |

### Frontend Structure

React Native with Expo, using file-based routing:

- `app/` - Screen components (HomeScreen, ListingDetailScreen, etc.)
- `components/` - Shared UI components (ListingCard, BottomNav, etc.)
- `constants/` - Theme colors, API configuration
- `hooks/` - Custom React hooks

### Authentication

JWT-based authentication using `djangorestframework-simplejwt`:

- Token obtain: `POST /api/auth/token/`
- Token refresh: `POST /api/auth/token/refresh/`
- Registration: `POST /api/auth/register/`

Include token in requests: `Authorization: Bearer <token>`

### Database Notes

The codebase supports both:
1. **ORM approach** (current): Full Django models with migrations
2. **Raw SQL approach** (legacy support): Some management commands use raw SQL

Primary models: UserProfile, BrokerProfile, Listing, Booking, Review, Favorite, Message, Payment, Category, Region

### Common Patterns

**Adding a new API endpoint:**

1. Add service method to `services.py` if needed
2. Add serializer to `serializers.py` if needed
3. Create APIView class in `views.py` with permission handling
4. Register URL in `urls.py`

**Error Handling:**

Use the `APIError` helper class in views:
- `APIError.bad_request(message)` - 400
- `APIError.not_found(message)` - 404
- `APIError.forbidden(message)` - 403
- `APIError.server_error()` - 500 (never exposes internal details)

**Decimal Handling:**

All monetary values use `Decimal`. Use `_to_decimal()` helper in services for safe conversion.
