# Rentally – Mongolia Property Rental App

Real estate rental platform optimized for the Mongolian market: listings, search, filters, favorites, messaging, map integration, and Mongolia-specific features (MNT currency, cities/districts, utility estimates, seasonal trends).

## Features

- **Property listings** – Search, filter by category/region
- **Detail page** – Dabang-style UI: image gallery, price (MNT), specs, pricing info, map
- **Mongolia localization** – Cyrillic UI, MNT prices, major cities (Улаанбаатар, Эрдэнет, Дархан, etc.)
- **Mongolia-specific APIs** – Utility cost estimates, seasonal rental trends, popular neighborhoods
- **Auth** – Register, JWT login, password reset
- **Mobile-first** – Responsive design for Android/iOS

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
```

Backend: http://127.0.0.1:8000  
API base: http://127.0.0.1:8000/api/

### 2. Frontend

```bash
cd rentally_frontend
npm install
npm run dev
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
| `/api/listings/` | GET, POST | List/create listings (search, category, region) |
| `/api/listings/<id>/` | GET, PUT, DELETE | Listing detail |
| `/api/categories/` | GET, POST | Categories |
| `/api/regions/` | GET, POST | Regions |
| `/api/mongolia/cities/` | GET | Mongolian cities & districts |
| `/api/mongolia/utility-estimate/?area_sqm=60` | GET | Utility cost estimate (MNT) |
| `/api/mongolia/seasonal-trends/` | GET | Seasonal rental trends |
| `/api/mongolia/neighborhoods/` | GET | Popular neighborhoods |
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

MIT
