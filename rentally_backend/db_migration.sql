-- This script perfectly migrates your custom Database Schema to the Django 'api' app models
-- Allowing you to keep all existing data and relationships!

-- 0. Drop custom views that rely on old schema columns
DROP VIEW IF EXISTS broker_list;

-- 1. First, we migrate the custom 'users' table into Django's 'auth_user' table
INSERT INTO auth_user (id, password, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined, last_login)
SELECT id, password_hash, false, username, '', '', email, false, true, created_at, null 
FROM users
ON CONFLICT (id) DO NOTHING;

-- Update sequences for auth_user so future user creations don't conflict with existing IDs
SELECT setval('auth_user_id_seq', (SELECT MAX(id) FROM auth_user));

-- 2. Rename the old 'users' table to act as our extended Django 'UserProfile'
ALTER TABLE users RENAME TO api_userprofile;

-- Rename 'id' to 'user_id' because Django OneToOneFields use the related model's ID as their primary key
ALTER TABLE api_userprofile RENAME COLUMN id TO user_id;

-- Drop fields from UserProfile that are now stored natively in auth_user
ALTER TABLE api_userprofile DROP COLUMN email CASCADE;
ALTER TABLE api_userprofile DROP COLUMN password_hash CASCADE;
ALTER TABLE api_userprofile DROP COLUMN username CASCADE;

-- Add any missing columns that api.UserProfile expects
ALTER TABLE api_userprofile ADD COLUMN address text;
ALTER TABLE api_userprofile ADD COLUMN profile_picture varchar(200);
ALTER TABLE api_userprofile ADD COLUMN updated_at timestamp with time zone DEFAULT now();


-- 3. Rename all remaining custom tables to match Django's generated ORM names
ALTER TABLE categories RENAME TO api_category;
ALTER TABLE regions RENAME TO api_region;
ALTER TABLE listings RENAME TO api_listing;
ALTER TABLE listing_images RENAME TO api_listingimage;
ALTER TABLE listing_details RENAME TO api_listingdetail;
ALTER TABLE listing_features RENAME TO api_listingfeature;
ALTER TABLE bookings RENAME TO api_booking;
ALTER TABLE reviews RENAME TO api_review;
ALTER TABLE favorites RENAME TO api_favorite;
ALTER TABLE messages RENAME TO api_message;
ALTER TABLE payments RENAME TO api_payment;
ALTER TABLE broker_profiles RENAME TO api_brokerprofile;

-- Fix the 'order' column name in listing images (your schema calls it 'sort_order', model expects 'order')
ALTER TABLE api_listingimage RENAME COLUMN sort_order TO "order";



-- Note: The constraints and foreign keys will still point correctly because they are bound by object ID, not by visual table name in Postgres.

-- End of script.
