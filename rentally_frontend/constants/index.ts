/**
 * Constants - Centralized magic strings and configuration
 */

// ─────────────────────────────────────────────────────────────────────
// API CONFIGURATION
// ─────────────────────────────────────────────────────────────────────

export const API_CONFIG = {
API_URL: process.env.REACT_APP_API_URL || 'https://rentally-api.onrender.com/api',
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// ─────────────────────────────────────────────────────────────────────
// CATEGORY TYPES
// ─────────────────────────────────────────────────────────────────────

export const CATEGORIES = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  OFFICE: 'office',
  SHOP: 'shop',
  LAND: 'land',
  OTHER: 'other',
} as const;

// ─────────────────────────────────────────────────────────────────────
// PRICE TYPES
// ─────────────────────────────────────────────────────────────────────

export const PRICE_TYPES = {
  DAILY: 'daily',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

// ─────────────────────────────────────────────────────────────────────
// LISTING STATUS
// ─────────────────────────────────────────────────────────────────────

export const LISTING_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SOLD: 'sold',
  ARCHIVED: 'archived',
} as const;

// ─────────────────────────────────────────────────────────────────────
// BOOKING STATUS
// ─────────────────────────────────────────────────────────────────────

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
} as const;

// ─────────────────────────────────────────────────────────────────────
// USER ROLES
// ─────────────────────────────────────────────────────────────────────

export const USER_ROLES = {
  USER: 'user',
  BROKER: 'broker',
  ADMIN: 'admin',
} as const;

// ─────────────────────────────────────────────────────────────────────
// SCREEN NAMES
// ─────────────────────────────────────────────────────────────────────

export const SCREENS = {
  HOME: 'home',
  SEARCH: 'search',
  LISTING_DETAIL: 'listing-detail',
  FAVORITES: 'favorites',
  BOOKINGS: 'bookings',
  MESSAGES: 'messages',
  PROFILE: 'profile',
  LOGIN: 'login',
  REGISTER: 'register',
  MAP: 'map',
  SETTINGS: 'settings',
} as const;

// ─────────────────────────────────────────────────────────────────────
// COLOR SCHEME (MongoDB/Material Design)
// ─────────────────────────────────────────────────────────────────────

export const COLORS = {
  PRIMARY: '#007AFF',
  SECONDARY: '#5AC8FA',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  DANGER: '#F44336',
  LIGHT: '#F5F5F5',
  DARK: '#212121',
  GRAY: '#757575',
  BORDER: '#E0E0E0',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
} as const;

// ─────────────────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  INITIAL_PAGE: 1,
} as const;

// ─────────────────────────────────────────────────────────────────────
// SORTING
// ─────────────────────────────────────────────────────────────────────

export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  RATING: 'rating',
  DISTANCE: 'distance',
} as const;

// ─────────────────────────────────────────────────────────────────────
// VALIDATION RULES
// ─────────────────────────────────────────────────────────────────────

export const VALIDATION_RULES = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 254,
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 20,
  DESCRIPTION_MAX_LENGTH: 5000,
  COMMENT_MAX_LENGTH: 1000,
  MIN_RATING: 1,
  MAX_RATING: 5,
} as const;

// ─────────────────────────────────────────────────────────────────────
// UI SPACING
// ─────────────────────────────────────────────────────────────────────

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

// ─────────────────────────────────────────────────────────────────────
// MONGOLIAN REGIONS
// ─────────────────────────────────────────────────────────────────────

export const MONGOLIAN_REGIONS = {
  ULAANBAATAR: 'Улаанбаатар',
  DARKHAN: 'Дархан',
  ERDENET: 'Эрдэнэт',
  ARKHANGAI: 'Архангай',
  BAYAN_OELGII: 'Баян-Өлгий',
  BAYANKHONGOR: 'Баянхонгор',
  BULGAN: 'Булган',
  DUNDGOBI: 'Дундговь',
  DORNOD: 'Дорнод',
  DORNOGOBI: 'Дорноговь',
  GOVISUMBER: 'Говьсүмбэр',
  HENTII: 'Хэнтий',
  HOVD: 'Ховд',
  HOVSGOL: 'Хөвсгөл',
  OMNOGOVI: 'Өмнөговь',
  ORKHON: 'Орхон',
  SELENGE: 'Сэлэнгэ',
  SUKHBAATAR: 'Сүхбаатар',
  TUEV: 'Түвэ',
  UVS: 'Увс',
  ZAVKHAN: 'Завхан',
} as const;

// ─────────────────────────────────────────────────────────────────────
// ERROR CODES
// ─────────────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

// ─────────────────────────────────────────────────────────────────────
// ERROR MESSAGES
// ─────────────────────────────────────────────────────────────────────

export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  UNAUTHORIZED: 'You need to log in to continue.',
  NOT_FOUND: 'The resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const;

// ─────────────────────────────────────────────────────────────────────
// SUCCESS MESSAGES
// ─────────────────────────────────────────────────────────────────────

export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out.',
  REGISTER: 'Account created successfully!',
  LISTING_CREATED: 'Listing created successfully!',
  LISTING_UPDATED: 'Listing updated successfully!',
  LISTING_DELETED: 'Listing deleted successfully!',
  BOOKING_CREATED: 'Booking created successfully!',
  REVIEW_ADDED: 'Review added successfully!',
  FAVORITE_ADDED: 'Added to favorites!',
  FAVORITE_REMOVED: 'Removed from favorites!',
} as const;

// ─────────────────────────────────────────────────────────────────────
// IMAGE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────

export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 5,
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  THUMBNAIL_SIZE: 200,
  PREVIEW_SIZE: 500,
  FULL_SIZE: 1200,
} as const;

// ─────────────────────────────────────────────────────────────────────
// TIME CONSTANTS (milliseconds)
// ─────────────────────────────────────────────────────────────────────

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// ─────────────────────────────────────────────────────────────────────
// Get label for constants
// ─────────────────────────────────────────────────────────────────────

export const getLabel = (value: string, type: 'category' | 'status' | 'role'): string => {
  const labels: Record<string, Record<string, string>> = {
    category: {
      [CATEGORIES.APARTMENT]: 'Apartment',
      [CATEGORIES.HOUSE]: 'House',
      [CATEGORIES.OFFICE]: 'Office',
      [CATEGORIES.SHOP]: 'Shop',
      [CATEGORIES.LAND]: 'Land',
      [CATEGORIES.OTHER]: 'Other',
    },
    status: {
      [LISTING_STATUS.ACTIVE]: 'Active',
      [LISTING_STATUS.INACTIVE]: 'Inactive',
      [LISTING_STATUS.SOLD]: 'Sold',
      [LISTING_STATUS.ARCHIVED]: 'Archived',
      [BOOKING_STATUS.PENDING]: 'Pending',
      [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
      [BOOKING_STATUS.CANCELLED]: 'Cancelled',
    },
    role: {
      [USER_ROLES.USER]: 'User',
      [USER_ROLES.BROKER]: 'Broker',
      [USER_ROLES.ADMIN]: 'Admin',
    },
  };

  return labels[type]?.[value] || value;
};
