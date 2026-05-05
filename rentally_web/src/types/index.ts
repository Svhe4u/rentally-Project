/**
 * TypeScript Types for Rentally Web
 */

export type UserRole = 'user' | 'broker' | 'admin';
export type ListingStatus = 'active' | 'inactive' | 'sold' | 'archived';
export type PriceType = 'daily' | 'monthly' | 'yearly';
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type BrokerStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_verified: boolean;
  phone?: string;
  address?: string;
  profile_picture?: string;
  created_at?: string;
}

export interface UserProfile extends User {
  broker_status?: BrokerStatus;
  company_name?: string;
}

export interface BrokerProfile {
  user: number;
  username?: string;
  email?: string;
  company_name: string;
  registration_number?: string;
  description?: string;
  website?: string;
  license_document?: string;
  status: BrokerStatus;
  verified_at?: string;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  listing_count?: number;
}

export interface Region {
  id: number;
  name: string;
  slug: string;
  country: string;
  parent_id?: number;
  listing_count?: number;
}

export interface ListingImage {
  id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface ListingDetail {
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  utilities_estimated?: number;
  heating_type?: string;
  air_type?: string;
  floor_type?: string;
  window_type?: string;
  door_type?: string;
  balcony?: boolean;
  garage?: boolean;
  year_built?: number;
  floor_number?: number;
  building_floors?: number;
  window_count?: number;
  payment_terms?: string;
  payment_condition?: string;
  payment_condition_display?: string;
  upfront_months?: number;
  deposit_months?: number;
  is_pet_friendly?: boolean;
  furnishing_status?: string;
  total_upfront_payment?: number;
}

export interface ListingFeature {
  id: number;
  name: string;
  value?: string;
}

export interface Listing {
  id: number;
  owner: number;
  owner_username?: string;
  category: number;
  category_name?: string;
  region: number;
  region_name?: string;
  title: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  price: number;
  price_type: PriceType;
  status: ListingStatus;
  is_featured: boolean;
  views_count: number;
  images?: ListingImage[];
  features?: ListingFeature[];
  detail?: ListingDetail;
  review_count?: number;
  average_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  address: string;
  category_id: number;
  region_id: number;
  price: number;
  price_type: PriceType;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  heating_type?: string;
  floor_type?: string;
  window_type?: string;
  door_type?: string;
  balcony?: boolean;
  garage?: boolean;
  year_built?: number;
  floor_number?: number;
  building_floors?: number;
  window_count?: number;
  payment_terms?: string;
  payment_condition?: string;
  upfront_months?: number;
  deposit_months?: number;
  is_pet_friendly?: boolean;
  furnishing_status?: string;
  features?: string[];
  status?: ListingStatus;
}

export interface Booking {
  id: number;
  listing: number;
  listing_title?: string;
  user: number;
  user_username?: string;
  start_date: string;
  end_date: string;
  total_price?: number;
  status: BookingStatus;
  notes?: string;
  created_at: string;
}

export interface Review {
  id: number;
  listing: number;
  user: number;
  user_username?: string;
  rating: number;
  comment?: string;
  is_verified_booking: boolean;
  helpful_count: number;
  created_at: string;
}

export interface Favorite {
  id: number;
  listing: number;
  listing_title?: string;
  listing_price?: number;
  listing_address?: string;
  listing_image?: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender: number;
  sender_username?: string;
  sender_avatar?: string;
  recipient: number;
  recipient_username?: string;
  listing?: number;
  listing_title?: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  tokens: {
    access: string;
    refresh: string;
  };
  message?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: T[];
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
