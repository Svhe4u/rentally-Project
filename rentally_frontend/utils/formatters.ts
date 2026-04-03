/**
 * Format utilities for common data transformations
 */

export const formatters = {
  /**
   * Format price in MNT currency
   */
  price: (amount: number | string, currency: string = 'MNT'): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toLocaleString()} ${currency}`;
  },

  /**
   * Format date to readable format
   */
  date: (dateString: string | Date, locale: string = 'en-US'): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  /**
   * Format datetime with time
   */
  datetime: (dateString: string | Date, locale: string = 'en-US'): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  relativeTime: (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatters.date(date);
  },

  /**
   * Format address (truncate if too long)
   */
  address: (address: string, maxLength: number = 40): string => {
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '...';
  },

  /**
   * Format rating with stars
   */
  rating: (rating: number): string => {
    const stars = '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
    return `${stars} ${rating.toFixed(1)}`;
  },

  /**
   * Format number with thousands separator
   */
  number: (num: number, decimals: number = 0): string => {
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * Format percentage
   */
  percentage: (value: number, decimals: number = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * Format bytes to human readable size
   */
  fileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  /**
   * Format duration from milliseconds
   */
  duration: (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  },
};

/**
 * Get appropriate price type label
 */
export const getPriceTypeLabel = (priceType: string): string => {
  const labels: Record<string, string> = {
    daily: 'per night',
    monthly: 'per month',
    yearly: 'per year',
  };
  return labels[priceType] || priceType;
};

/**
 * Get appropriate status badge color
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: '#4CAF50',
    pending: '#FF9800',
    completed: '#2196F3',
    cancelled: '#F44336',
    confirmed: '#4CAF50',
    archived: '#9E9E9E',
  };
  return colors[status] || '#999';
};

/**
 * Convert booking dates to night count
 */
export const getNightCount = (startDate: string | Date, endDate: string | Date): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
