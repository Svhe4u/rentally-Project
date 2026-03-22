// services/api.ts
// Matches all endpoints from views.py

const BASE_URL = 'https://your-api.com/api'; // Replace with your actual backend URL

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── AUTH ────────────────────────────────────────────────────
export const AuthAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    phone?: string;
  }) =>
    request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (username: string, password: string) =>
    request<{ access: string; refresh: string }>('/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  refreshToken: (refresh: string) =>
    request<{ access: string }>('/token/refresh/', {
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

  changePassword: (user_id: number, old_password: string, new_password: string) =>
    request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({ user_id, old_password, new_password }),
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
    page?: number;
    page_size?: number;
  }) => {
    const q = new URLSearchParams(
      Object.entries(params || {})
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)]),
    ).toString();
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

  addImage: (listing_id: number, image_url: string, sort_order?: number) =>
    request<ListingImage>('/listing-images/', {
      method: 'POST',
      body: JSON.stringify({ listing_id, image_url, sort_order }),
    }),
};

// ─── BOOKINGS ────────────────────────────────────────────────
export const BookingAPI = {
  list: (user_id: number) =>
    request<Booking[]>(`/bookings/?user_id=${user_id}`),

  detail: (pk: number, user_id: number) =>
    request<Booking>(`/bookings/${pk}/?user_id=${user_id}`),

  create: (data: {
    listing_id: number;
    user_id: number;
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
      `/reviews/?listing=${listing_id}&page=${page}`,
    ),

  create: (data: {
    listing_id: number;
    user_id: number;
    rating: number;
    comment?: string;
  }) =>
    request<Review>('/reviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (pk: number, data: { user_id: number; rating?: number; comment?: string }) =>
    request<Review>(`/reviews/${pk}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (pk: number, user_id: number) =>
    request(`/reviews/${pk}/?user_id=${user_id}`, { method: 'DELETE' }),
};

// ─── FAVORITES ───────────────────────────────────────────────
export const FavoriteAPI = {
  list: (user_id: number) =>
    request<Favorite[]>(`/favorites/?user_id=${user_id}`),

  add: (user_id: number, listing_id: number) =>
    request<Favorite>('/favorites/', {
      method: 'POST',
      body: JSON.stringify({ user_id, listing_id }),
    }),

  remove: (listing_id: number, user_id: number) =>
    request(`/favorites/${listing_id}/?user_id=${user_id}`, { method: 'DELETE' }),
};

// ─── MESSAGES ────────────────────────────────────────────────
export const MessageAPI = {
  thread: (sender_id: number, receiver_id: number) =>
    request<Message[]>(
      `/messages/?sender_id=${sender_id}&receiver_id=${receiver_id}`,
    ),

  send: (data: {
    sender_id: number;
    receiver_id: number;
    listing_id?: number;
    message: string;
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

  update: (pk: number, data: Partial<User>) =>
    request<User>(`/users/${pk}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
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
    request('/auth/broker-apply/', {
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
  utilityEstimate: () =>
    request('/mongolia/utility-estimate/'),
  seasonalTrends: () =>
    request('/mongolia/seasonal-trends/'),
};

// ─── TYPES ───────────────────────────────────────────────────
export interface Listing {
  id: number;
  owner_id: number;
  category_id: number;
  region_id: number;
  title: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price: number;
  price_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListingFull extends Listing {
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
  listing_id: number;
  image_url: string;
  sort_order: number;
}

export interface Booking {
  id: number;
  listing_id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  total_price?: number;
  status: string;
  created_at: string;
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
  user_id: number;
  listing_id: number;
  created_at: string;
  title?: string;
  price?: number;
  address?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  listing_id?: number;
  message: string;
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
