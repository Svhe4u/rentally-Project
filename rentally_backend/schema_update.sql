-- =====================================================
-- Rentally Schema Update for NeonDB
-- Run this to update existing tables to match Django models
-- =====================================================

-- 1. Update broker_profiles table (rename columns to match Django)
ALTER TABLE broker_profiles
    RENAME COLUMN license_no TO registration_number;

ALTER TABLE broker_profiles
    RENAME COLUMN agency_name TO company_name;

ALTER TABLE broker_profiles
    RENAME COLUMN bio TO description;

ALTER TABLE broker_profiles
    RENAME COLUMN profile_image TO license_document;

-- Add missing columns to broker_profiles
ALTER TABLE broker_profiles
    ADD COLUMN IF NOT EXISTS website VARCHAR(255),
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make registration_number unique (if not already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'broker_profiles'
        AND indexname = 'broker_profiles_registration_number_key'
    ) THEN
        ALTER TABLE broker_profiles
            ADD CONSTRAINT broker_profiles_registration_number_key UNIQUE (registration_number);
    END IF;
END $$;

-- 2. Update categories table (add missing columns)
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
    ADD COLUMN IF NOT EXISTS icon TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Update regions table (add missing columns)
ALTER TABLE regions
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Mongolia',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Update listings table (add missing columns)
ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold', 'archived'));

-- 5. Update listing_images table
ALTER TABLE listing_images
    ADD COLUMN IF NOT EXISTS alt_text VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Update listing_details table (add missing columns)
ALTER TABLE listing_details
    ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
    ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
    ADD COLUMN IF NOT EXISTS utilities_estimated NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS heating_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS air_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. Rename listing_extra_features to listing_features
-- First create new table
CREATE TABLE IF NOT EXISTS listing_features (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_listing_feature UNIQUE (listing_id, name)
);

-- Migrate data from listing_extra_features if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listing_extra_features') THEN
        INSERT INTO listing_features (listing_id, name, value, created_at)
        SELECT listing_id, key AS name, value, NOW()
        FROM listing_extra_features
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 8. Update bookings table (add missing columns)
ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 9. Update reviews table (add missing columns)
ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS is_verified_booking BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 10. Update favorites table (add missing column)
ALTER TABLE favorites
    ADD COLUMN IF NOT EXISTS id SERIAL;

-- 11. Update messages table (add columns, keep 'message' column)
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 12. Update payments table (add missing columns)
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'MNT',
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
    ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 13. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, created_at);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings(owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_broker_profiles_status ON broker_profiles(status);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(is_verified_booking, created_at);

-- 14. Create broker_list view for broker listing
CREATE OR REPLACE VIEW broker_list AS
SELECT
    u.id,
    u.username,
    u.email,
    u.phone,
    bp.registration_number AS license_no,
    bp.company_name AS agency_name,
    bp.description AS bio,
    bp.license_document AS profile_image,
    bp.is_verified,
    bp.verified_at,
    bp.rating_avg,
    bp.listing_count,
    bp.created_at AS broker_since
FROM users u
JOIN broker_profiles bp ON bp.user_id = u.id
WHERE u.role::text = 'broker'::text;

-- Done!
-- =====================================================
