# Rentally – Mongolia Property Rental App

Real estate rental platform optimized for the Mongolian market: listings, search, filters, favorites, messaging, map integration, and Mongolia-specific features (MNT currency, cities/districts, utility estimates, seasonal trends).

## Features

- **Property listings** – Search, filter by category/region/price/tag
- **List + map split layout** – Leaflet map with markers, property type tabs
- **Detail page** – Dabang-style UI: gallery, price (MNT), specs, utility estimate, text inquiry
- **Mongolia localization** – Cyrillic UI, MNT prices, major cities (Улаанбаатар, Эрдэнет, Дархан, etc.)
- **Mongolia-specific APIs** – Utility estimates, seasonal trends, popular neighborhoods, popular areas
- **Auth** – Register, broker register, JWT login, password reset via Gmail
- **Our house** – My listings (owner_id filter)
- **Watchlist** – Favorites
- **Text inquiry** – Messaging UI for listing contact
- **Mobile-first** – Responsive design

## Project Structure

```
rentally-Project/
├── rentally_backend/     # Django REST API
│   ├── api/
│   │   ├── views.py      # CRUD endpoints
│   │   ├── mongolia_views.py
│   │   ├── locale_mn.py  # MNT formatting, cities, trends
│   │   └── management/commands/seed_mongolia.py
│   └── requirements.txt
├── rentally_frontend/    # React + Vite SPA
│   ├── src/
│   │   ├── pages/        # HomePage, ListingDetailPage
│   │   ├── components/   # ImageGallery, ListingCard
│   │   ├── api.js
│   │   └── locale.js
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or Neon)

## Run Locally

### 1. Backend

```bash
cd rentally_backend
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
cp .env.example .env   # Create from template
# Edit .env: DATABASE_URL, SECRET_KEY, etc.

python manage.py migrate   # If using Django migrations
python manage.py seed_mongolia   # Seed cities/categories
python manage.py runserver

pip install django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install python-dotenv
pip install dj-database-url
pip install psycopg2-binary
pip install whitenoise
pip install cloudinary
pip install django-cloudinary-storage


```

Backend: http://127.0.0.1:8000  
API base: http://127.0.0.1:8000/api/

### 2. Frontend

```bash
cd rentally_frontend
npm install
npx expo install react-dom react-native-web
npm run dev
npm start
```

Frontend: http://localhost:5173 (proxies /api to backend)

### 3. Database Schema

The backend uses raw SQL against existing PostgreSQL tables. Ensure these tables exist:

- `listings`, `bookings`, `reviews`, `favorites`
- `categories`, `regions`
- `listing_availability`, `listing_details`, `listing_extra_features`, `listing_images`
- `messages`, `payments`, `users`

If you need migrations, you can add Django models and run `python manage.py makemigrations` + `migrate`.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/listings/` | GET, POST | List/create (search, category, region, owner_id, min_price, max_price, tag) |
| `/api/listings/<id>/` | GET, PUT, DELETE | Listing detail |
| `/api/categories/` | GET, POST | Categories |
| `/api/regions/` | GET, POST | Regions |
| `/api/mongolia/cities/` | GET | Mongolian cities & districts |
| `/api/mongolia/utility-estimate/?area_sqm=60` | GET | Utility cost estimate (MNT) |
| `/api/mongolia/seasonal-trends/` | GET | Seasonal rental trends |
| `/api/mongolia/neighborhoods/` | GET | Popular neighborhoods |
| `/api/mongolia/popular-areas/` | GET | Popular areas (listing count by region) |
| `/api/auth/broker-register/` | POST | Broker registration |
| `/api/auth/register/` | POST | Register |
| `/api/token/` | POST | JWT login |

## Deploy

### Backend (e.g. Railway, Render, Heroku)

1. Set `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
2. Run: `python manage.py migrate` and `seed_mongolia`
3. Use `gunicorn rentally_backend.wsgi:application`

### Frontend (e.g. Vercel, Netlify)

1. Build: `npm run build`
2. Set `VITE_API_BASE` or proxy `/api` to backend URL
3. Deploy `dist/`

## Mongolia-Specific Notes

- **Currency**: All prices in MNT (₮)
- **Cities**: Улаанбаатар, Эрдэнет, Дархан, Чойбалсан
- **Districts**: Баянзүрх, Сүхбаатар, Хан-Уул, etc.
- **Seasonal demand**: High (Sep–Oct, Mar–Apr), medium (May, Jun, Nov), low (Jan, Feb, Jul, Aug, Dec)
- **Utility estimates**: Based on typical Ulaanbaatar costs by area (m²)

## License


