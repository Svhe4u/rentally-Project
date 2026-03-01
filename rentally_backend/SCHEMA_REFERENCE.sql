-- Reference schema for Rentally backend.
-- Run against your PostgreSQL database if tables don't exist.
-- Adjust types/constraints as needed.

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS regions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  parent_id INTEGER REFERENCES regions(id)
);

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  region_id INTEGER REFERENCES regions(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  price DECIMAL(14,0) NOT NULL,
  price_type VARCHAR(50) DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_details (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  floor_type VARCHAR(100),
  balcony BOOLEAN,
  year_built INTEGER,
  garage BOOLEAN,
  window_type VARCHAR(100),
  building_floors INTEGER,
  door_type VARCHAR(100),
  area_sqm DECIMAL(10,2),
  floor_number INTEGER,
  window_count INTEGER,
  payment_terms VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS listing_images (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listing_extra_features (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  key VARCHAR(100),
  value VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS listing_availability (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(150) UNIQUE NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  password_hash VARCHAR(128),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id),
  user_id INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  total_price DECIMAL(14,0),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id),
  user_id INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL,
  listing_id INTEGER REFERENCES listings(id),
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  listing_id INTEGER REFERENCES listings(id),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  amount DECIMAL(14,0),
  method VARCHAR(50),
  status VARCHAR(50),
  paid_at TIMESTAMP
);
