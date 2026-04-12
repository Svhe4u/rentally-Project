/**
 * API Service for Rentally Web Portal
 * Optimized for Browser/Web environments with TypeScript.
 */

import type {
  UserProfile,
  Category,
  Region,
  Listing,
  ListingFormData,
  Booking,
  Review,
  Message,
  BrokerProfile,
  PaginatedResponse,
  LoginCredentials,
  LoginResponse,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

class APIService {
  private token: string | null = localStorage.getItem('rentally_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('rentally_token', token);
    } else {
      localStorage.removeItem('rentally_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      this.setToken(null);
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Request failed: ${response.status}`);
    }

    // Handle empty responses
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Upload file (for images)
  async uploadFile(endpoint: string, file: File): Promise<{ url: string }> {
    const url = `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Upload failed');
    }

    return response.json();
  }
}

export const api = new APIService();

// Auth APIs
export const AuthAPI = {
  login: (credentials: LoginCredentials) =>
    api.request<LoginResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
    role?: 'user' | 'broker';
    phone?: string;
    company_name?: string;
  }) =>
    api.request<LoginResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => api.request<UserProfile>('/profile/'),

  updateProfile: (data: Partial<UserProfile>) =>
    api.request<UserProfile>('/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { old_password: string; new_password: string; new_password2: string }) =>
    api.request('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRole: () => api.request<UserProfile>('/auth/role/'),
};

// Metadata APIs
export const MetaDataAPI = {
  getCategories: () => api.request<Category[]>('/categories/'),
  getRegions: () => api.request<Region[]>('/regions/'),
};

// Listing APIs
export const ListingAPI = {
  getAll: (params?: {
    search?: string;
    category_id?: number;
    region_id?: number;
    min_price?: number;
    max_price?: number;
    is_featured?: boolean;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    return api.request<PaginatedResponse<Listing>>(`/listings/?${queryParams.toString()}`);
  },

  getById: (id: number) => api.request<Listing>(`/listings/${id}/`),

  create: (data: ListingFormData) =>
    api.request<Listing>('/listings/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ListingFormData>) =>
    api.request<Listing>(`/listings/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: (id: number, data: Partial<ListingFormData>) =>
    api.request<Listing>(`/listings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api.request<void>(`/listings/${id}/`, {
      method: 'DELETE',
    }),

  getMyListings: () => api.request<PaginatedResponse<Listing>>('/listings/'),

  getTrending: (days = 7, limit = 10) =>
    api.request<Listing[]>(`/listings/trending/?days=${days}&limit=${limit}`),

  getPopular: (limit = 10) =>
    api.request<Listing[]>(`/listings/popular/?limit=${limit}`),
};

// Booking APIs
export const BookingAPI = {
  getAll: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return api.request<PaginatedResponse<Booking>>(`/bookings/${params}`);
  },

  getById: (id: number) => api.request<Booking>(`/bookings/${id}/`),

  create: (data: { listing_id: number; start_date: string; end_date: string; notes?: string }) =>
    api.request<Booking>('/bookings/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Booking>) =>
    api.request<Booking>(`/bookings/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancel: (id: number) =>
    api.request<void>(`/bookings/${id}/`, {
      method: 'DELETE',
    }),
};

// Review APIs
export const ReviewAPI = {
  getForListing: (listingId: number) =>
    api.request<{ meta: any; average_rating: number; results: Review[] }>(`/reviews/?listing_id=${listingId}`),

  create: (data: { listing_id: number; rating: number; comment?: string }) =>
    api.request<Review>('/reviews/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { rating?: number; comment?: string }) =>
    api.request<Review>(`/reviews/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api.request<void>(`/reviews/${id}/`, {
      method: 'DELETE',
    }),
};

// Favorite APIs
export const FavoriteAPI = {
  getAll: () => api.request<PaginatedResponse<Favorite>>('/favorites/'),

  toggle: (listingId: number) =>
    api.request<{ is_favorited: boolean; detail: string }>('/favorites/', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId }),
    }),

  check: (listingId: number) =>
    api.request<{ is_favorited: boolean }>(`/favorites/${listingId}/check/`),
};

// Message APIs
export const MessageAPI = {
  getInbox: () =>
    api.request<{
      conversation_count: number;
      unread_count: number;
      conversation_user_ids: number[];
    }>('/messages/'),

  getConversation: (userId: number) =>
    api.request<{
      with_user_id: number;
      with_username: string;
      message_count: number;
      messages: Message[];
    }>(`/messages/${userId}/`),

  send: (data: { recipient_id: number; content: string; listing_id?: number }) =>
    api.request<Message>('/messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Broker APIs
export const BrokerAPI = {
  getAll: () => api.request<BrokerProfile[]>('/brokers/'),

  getById: (id: number) => api.request<BrokerProfile>(`/brokers/${id}/`),

  getApplications: () => api.request<BrokerProfile[]>('/brokers/apply/'),

  apply: (data: {
    company_name: string;
    registration_number?: string;
    description?: string;
    website?: string;
  }) =>
    api.request<BrokerProfile>('/brokers/apply/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<BrokerProfile>) =>
    api.request<BrokerProfile>(`/brokers/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  reviewApplication: (id: number, action: 'approve' | 'reject') =>
    api.request<{ detail: string; application: BrokerProfile }>(`/brokers/${id}/review/`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
};

// Mongolia-specific APIs
export const MongoliaAPI = {
  getCities: () =>
    api.request<{
      cities: { id: number; name: string; name_en: string }[];
      ulaanbaatar_districts: { id: number; name: string; name_en: string }[];
    }>('/mongolia/cities/'),

  getUtilityEstimate: (areaSqm?: number) =>
    api.request<{
      area_sqm: number;
      estimated_monthly_mnt: { min: number; max: number };
      formatted: { min: string; max: string };
    }>(`/mongolia/utility-estimate/${areaSqm ? `?area_sqm=${areaSqm}` : ''}`),

  getSeasonalTrends: (month?: number) =>
    api.request<any>(`/mongolia/seasonal-trends/${month ? `?month=${month}` : ''}`),

  getNeighborhoods: () =>
    api.request<{ neighborhoods: any[] }>('/mongolia/neighborhoods/'),
};

// Admin APIs
export const AdminAPI = {
  getStats: () => api.request<{ areas: { id: number; name: string; listing_count: number }[] }>('/areas/popular/'),

  getAllUsers: () => api.request<UserProfile[]>('/users/'),
};

// Import Favorite type that was missing
interface Favorite {
  id: number;
  listing: number;
  listing_title?: string;
  listing_price?: number;
  listing_address?: string;
  listing_image?: string;
}
