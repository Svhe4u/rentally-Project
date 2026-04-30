import { storage } from './storage';

const BASE_URL = 'http://localhost:8000/api'; // Web testing

// async function request<T>(
//   path: string,
//   options?: RequestInit,
// ): Promise<T> {
//   // Get token from storage
//   const token = await storage.getItem('auth_token');

//   const headers: HeadersInit = {
//     'Content-Type': 'application/json',
//     ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
//     ...(options?.headers || {}),
//   };

//   const res = await fetch(`${BASE_URL}${path}`, {
//     ...options,
//     headers,
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     // Django error format: { "field": ["message"] } or { "error": "message" } or { "detail": "message" }
//     let errorMessage = err.error || err.detail;
//     if (!errorMessage && typeof err === 'object') {
//       const firstKey = Object.keys(err)[0];
//       if (firstKey && Array.isArray(err[firstKey])) {
//         errorMessage = `${firstKey}: ${err[firstKey][0]}`;
//       }
//     }
//     throw new Error(errorMessage || `HTTP ${res.status}`);
//   }
//   return res.json();
// }

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = await storage.getItem('auth_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options?.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Token expire бол refresh хийгээд дахин оролдоно
  if (res.status === 401) {
    const refreshToken = await storage.getItem('refresh_token');
    if (refreshToken) {
      const refreshRes = await fetch(`${BASE_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (refreshRes.ok) {
        const { access } = await refreshRes.json();
        await storage.setItem('auth_token', access);

        // Шинэ token-р дахин request хийнэ
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${access}`,
          },
        });
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({}));
          throw new Error(err.detail || err.error || `HTTP ${retryRes.status}`);
        }
        return retryRes.json();
      }
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let errorMessage = err.error || err.detail;
    if (!errorMessage && typeof err === 'object') {
      const firstKey = Object.keys(err)[0];
      if (firstKey && Array.isArray(err[firstKey])) {
        errorMessage = `${firstKey}: ${err[firstKey][0]}`;
      }
    }
    throw new Error(errorMessage || `HTTP ${res.status}`);
  }
  return res.json();
}



// ─── AUTH ────────────────────────────────────────────────────
export const AuthAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) =>
    request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (username: string, password: string) =>
    request<any>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  refreshToken: (refresh: string) =>
    request<{ access: string }>('/auth/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (uid: string, token: string, new_password: string) =>
    request('/auth/reset-password/', {
      method: 'POST',
      body: JSON.stringify({ uid, token, new_password }),
    }),

  changePassword: (old_password: string, new_password: string, new_password2: string) =>
    request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password, new_password2 }),
    }),
};

// ─── LISTINGS ────────────────────────────────────────────────
export const ListingAPI = {
  list: (params?: {
    search?: string;
    category?: string;
    region?: string;
    min_price?: string;
    max_price?: string;
    owner_id?: number | string;
    ordering?: string;
    created_after?: string;
    price_type?: string;
    min_area?: string | number;
    max_area?: string | number;
    bedrooms?: string | number;
    min_lat?: number | string;
    max_lat?: number | string;
    min_lng?: number | string;
    max_lng?: number | string;
    page?: number;
    page_size?: number;
  }) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, val]) => {
      const sVal = String(val).toLowerCase();
      if (val !== undefined && val !== null && sVal !== '' && sVal !== 'null' && sVal !== 'undefined') {
        query.append(key, String(val));
      }
    });
    const q = query.toString();
    return request<{ meta: any; results: Listing[] }>(`/listings/${q ? '?' + q : ''}`);
  },

  detail: (pk: number) =>
    request<Listing>(`/listings/${pk}/`),

  fullDetail: (pk: number) =>
    request<ListingFull>(`/listings/${pk}/full/`),

  create: (data: Partial<Listing>) =>
    request<Listing>('/listings/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (pk: number, data: Partial<Listing>) =>
    request<Listing>(`/listings/${pk}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (pk: number) =>
    request(`/listings/${pk}/`, { method: 'DELETE' }),

  images: (listing_id: number) =>
    request<ListingImage[]>(`/listing-images/?listing_id=${listing_id}`),

  addImage: (listing_id: number, image_url: string, order?: number) =>
    request<ListingImage>('/listing-images/', {
      method: 'POST',
      body: JSON.stringify({ listing_id, image_url, order }),
    }),
};

// ─── BOOKINGS ────────────────────────────────────────────────
export const BookingAPI = {
  list: () =>
    request<Booking[]>('/bookings/'),

  detail: (pk: number) =>
    request<Booking>(`/bookings/${pk}/`),

  create: (data: {
    listing_id: number;
    start_date: string;
    end_date: string;
    total_price?: number;
    status?: string;
  }) =>
    request<Booking>('/bookings/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (pk: number, data: Partial<Booking>) =>
    request<Booking>(`/bookings/${pk}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (pk: number, user_id: number) =>
    request(`/bookings/${pk}/?user_id=${user_id}`, { method: 'DELETE' }),
};

// ─── REVIEWS ─────────────────────────────────────────────────
export const ReviewAPI = {
  list: (listing_id: number, page = 1) =>
    request<{ meta: any; results: Review[] }>(
      `/reviews/?listing_id=${listing_id}&page=${page}`,
    ),

  create: (data: { listing_id: number; rating: number; comment?: string }) =>
    request<Review>('/reviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (pk: number, data: { rating?: number; comment?: string }) =>
    request<Review>(`/reviews/${pk}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (pk: number) =>
    request(`/reviews/${pk}/`, { method: 'DELETE' }),
};

// ─── FAVORITES ───────────────────────────────────────────────
export const FavoriteAPI = {
  list: (page = 1, page_size = 100) =>
    request<{ meta: any; results: Favorite[] }>(
      `/favorites/?page=${page}&page_size=${page_size}`,
    ),

  /** Toggle favorite for current user (POST). */
  toggle: (listing_id: number) =>
    request<{ is_favorited: boolean; detail: string }>('/favorites/', {
      method: 'POST',
      body: JSON.stringify({ listing_id }),
    }),

  remove: (listing_id: number) =>
    request<void>(`/favorites/${listing_id}/check/`, { method: 'DELETE' }),

  check: (listing_id: number) =>
    request<{ is_favorited: boolean }>(`/favorites/${listing_id}/check/`),
};

// ─── MESSAGE THREADS ─────────────────────────────────────────
export interface MessageThread {
  partner_id: number;
  partner_name: string;
  partner_avatar: string | null;
  last_message_text: string;
  last_message_created: string;
  is_outgoing: boolean;
  unread_count: number;
  listing_id: number | null;
  listing_title: string | null;
}

export const MessageThreadAPI = {
  list: () =>
    request<{ conversations: MessageThread[]; unread_total: number }>('/messages/'),
};

// ─── MESSAGES ────────────────────────────────────────────────
export const MessageAPI = {
  thread: (partner_id: number) =>
    request<{ messages: Message[] }>(`/messages/${partner_id}/`).then(r => r?.messages ?? []),

  send: (data: {
    recipient_id: number;
    listing_id?: number;
    content: string;
  }) =>
    request<Message>('/messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (pk: number) =>
    request(`/messages/${pk}/`, { method: 'DELETE' }),
};

// ─── CATEGORIES & REGIONS ────────────────────────────────────
export const CategoryAPI = {
  list: () => request<Category[]>('/categories/'),
};

export const RegionAPI = {
  list: () => request<Region[]>('/regions/'),
};

// ─── USERS ───────────────────────────────────────────────────
export const UserAPI = {
  detail: (pk: number) =>
    request<User>(`/users/${pk}/`),

  update: (data: Partial<User & { phone?: string; address?: string }>) =>
    request<User>('/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  currentProfile: () =>
    request<User>('/profile/'),
};

// ─── BROKERS ─────────────────────────────────────────────────
export const BrokerAPI = {
  list: () => request<BrokerProfile[]>('/brokers/'),

  profile: (user_id: number) =>
    request<BrokerProfile>(`/brokers/${user_id}/`),

  apply: (data: {
    user_id: number;
    license_no?: string;
    agency_name?: string;
    phone?: string;
    note?: string;
  }) =>
    request('/brokers/apply/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── NOTIFICATIONS (payments + bookings combined) ────────────
export const NotificationAPI = {
  bookings: (user_id: number) =>
    request<Booking[]>(`/bookings/?user_id=${user_id}`),
  payments: () =>
    request<Payment[]>('/payments/'),
};

// ─── MONGOLIA SPECIFIC ───────────────────────────────────────
export const MongoliaAPI = {
  neighborhoods: () =>
    request('/mongolia/neighborhoods/'),
  popularAreas: () =>
    request('/mongolia/popular-areas/'),
  utilityEstimate: (area_sqm?: number) =>
    request<{ formatted?: { min: string; max: string } }>(
      `/mongolia/utility-estimate/${area_sqm != null ? `?area_sqm=${area_sqm}` : ''}`,
    ),
  seasonalTrends: () =>
    request('/mongolia/seasonal-trends/'),
};

// ─── TYPES ───────────────────────────────────────────────────
export interface Listing {
  id: number;
  owner?: number;
  owner_id?: number;
  owner_username?: string;
  category?: number;
  category_id?: number;
  category_name?: string;
  region?: number;
  region_id?: number;
  region_name?: string;
  title: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  price_type: string;
  status?: string;
  is_active?: boolean;
  is_featured?: boolean;
  views_count?: number;
  bedrooms?: number;
  area_sqm?: number;
  /** From list/search API — first listing image */
  cover_image?: string | null;
  images?: ListingImage[];
  created_at: string;
  updated_at?: string;
}

export interface ListingFull
  extends Omit<Listing, 'owner' | 'category' | 'region' | 'images'> {
  owner: User & { broker_profile?: BrokerProfile };
  category: Category;
  region: Region & { parent_name?: string };
  details?: ListingDetails;
  images: ListingImage[];
  extra_features: { id: number; key: string; value: string }[];
  availability: { id: number; date: string; is_available: boolean }[];
  reviews: ReviewWithUser[];
  rating_avg: number | null;
  review_count: number;
}

export interface ListingDetails {
  listing_id: number;
  floor_type?: string;
  balcony?: boolean;
  year_built?: number;
  garage?: boolean;
  window_type?: string;
  building_floors?: number;
  door_type?: string;
  area_sqm?: number;
  floor_number?: number;
  window_count?: number;
  payment_terms?: string;
}

export interface ListingImage {
  id: number;
  listing_id?: number;
  image_url: string;
  sort_order?: number;
  order?: number;
  is_primary?: boolean;
  alt_text?: string | null;
}

export interface Booking {
  id: number;
  listing: number;
  listing_id: number;
  listing_title?: string;
  user: number;
  user_id: number;
  user_username?: string;
  start_date: string;
  end_date: string;
  duration_days?: number;
  days_remaining?: number;
  total_price?: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Review {
  id: number;
  listing_id: number;
  user_id: number;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ReviewWithUser extends Review {
  username: string;
}

export interface Favorite {
  id: number;
  listing: number;
  listing_title?: string;
  listing_price?: number;
  listing_address?: string;
  listing_image?: string;
  listing_status?: string;
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

export interface Category {
  id: number;
  name: string;
}

export interface Region {
  id: number;
  name: string;
  parent_id?: number;
  parent_name?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export interface BrokerProfile {
  user_id: number;
  username?: string;
  email?: string;
  phone?: string;
  license_no?: string;
  agency_name?: string;
  bio?: string;
  profile_image?: string;
  is_verified: boolean;
  verified_at?: string;
  rating_avg: number;
  listing_count: number;
  broker_since?: string;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  method?: string;
  status?: string;
  paid_at?: string;
}
