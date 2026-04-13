import { useState, useEffect } from 'react';
import type { Booking } from '../../types';
import { BookingAPI } from '../../api/api';
import { Modal } from '../../components/Modal';
import './Bookings.css';

interface BookingsProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function Bookings({ onSuccess, onError }: BookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await BookingAPI.getForMyListings();
      console.log('Bookings API response:', data); // Add this
      setBookings(data.results || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      onError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await BookingAPI.update(selectedBooking.id, { status: 'confirmed' });
      onSuccess('Booking confirmed successfully');
      setShowConfirmModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error: any) {
      onError(error.message || 'Failed to confirm booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await BookingAPI.cancel(selectedBooking.id);
      onSuccess('Booking cancelled successfully');
      setShowCancelModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error: any) {
      onError(error.message || 'Failed to cancel booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const openConfirm = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowConfirmModal(true);
  };

  const openCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const filteredBookings = bookings.filter((booking) => {
    return statusFilter === 'all' || booking.status === statusFilter;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    return `₮${Number(price).toLocaleString()}`;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      checked_in: 'Checked In',
      checked_out: 'Checked Out',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: bookings.length };
    bookings.forEach((b) => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="bookings-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <div className="bookings-header-left">
          <h1 className="page-title">Bookings</h1>
          <div className="booking-counts">
            <span className="count-badge">{statusCounts.all} total</span>
            {statusCounts.pending > 0 && (
              <span className="count-badge pending">{statusCounts.pending} pending</span>
            )}
          </div>
        </div>

        <div className="bookings-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Guest</th>
              <th>Dates</th>
              <th>Price</th>
              <th>Status</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <p>No bookings found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <div className="booking-property">
                      <span className="booking-property-title">
                        {booking.listing_title || `Listing #${booking.listing}`}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="booking-guest">{booking.user_username || `User #${booking.user}`}</span>
                  </td>
                  <td>
                    <div className="booking-dates">
                      <span>{formatDate(booking.start_date)}</span>
                      <span className="date-separator">→</span>
                      <span>{formatDate(booking.end_date)}</span>
                    </div>
                  </td>
                  <td>
                    <span className="booking-price">{formatPrice(booking.total_price)}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${booking.status}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => openDetail(booking)}
                        title="View details"
                      >
                        👁
                      </button>
                      {booking.status === 'pending' && (
                        <button
                          className="action-btn confirm"
                          onClick={() => openConfirm(booking)}
                          title="Confirm booking"
                        >
                          ✓
                        </button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          className="action-btn cancel"
                          onClick={() => openCancel(booking)}
                          title="Cancel booking"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBooking(null);
        }}
        title="Booking Details"
        size="md"
      >
        {selectedBooking && (
          <div className="booking-detail">
            <div className="detail-section">
              <h4>Property</h4>
              <p>{selectedBooking.listing_title || `Listing #${selectedBooking.listing}`}</p>
            </div>

            <div className="detail-section">
              <h4>Guest</h4>
              <p>{selectedBooking.user_username || `User #${selectedBooking.user}`}</p>
            </div>

            <div className="detail-row">
              <div className="detail-section">
                <h4>Check-in</h4>
                <p>{formatDate(selectedBooking.start_date)}</p>
              </div>
              <div className="detail-section">
                <h4>Check-out</h4>
                <p>{formatDate(selectedBooking.end_date)}</p>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-section">
                <h4>Total Price</h4>
                <p className="detail-price">{formatPrice(selectedBooking.total_price)}</p>
              </div>
              <div className="detail-section">
                <h4>Status</h4>
                <p>
                  <span className={`status-badge ${selectedBooking.status}`}>
                    {getStatusLabel(selectedBooking.status)}
                  </span>
                </p>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="detail-section">
                <h4>Notes</h4>
                <p className="detail-notes">{selectedBooking.notes}</p>
              </div>
            )}

            <div className="detail-section">
              <h4>Booked On</h4>
              <p>{formatDate(selectedBooking.created_at)}</p>
            </div>

            <div className="detail-actions">
              {selectedBooking.status === 'pending' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetailModal(false);
                    openConfirm(selectedBooking);
                  }}
                >
                  Confirm Booking
                </button>
              )}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setShowDetailModal(false);
                    openCancel(selectedBooking);
                  }}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedBooking(null);
        }}
        title="Confirm Booking"
        size="sm"
      >
        <div className="confirmation-content">
          <p>Are you sure you want to confirm this booking?</p>
          {selectedBooking && (
            <div className="confirmation-info">
              <strong>{selectedBooking.listing_title || `Listing #${selectedBooking.listing}`}</strong>
              <span>
                {formatDate(selectedBooking.start_date)} → {formatDate(selectedBooking.end_date)}
              </span>
              <span>Guest: {selectedBooking.user_username || `User #${selectedBooking.user}`}</span>
            </div>
          )}
          <div className="confirmation-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowConfirmModal(false);
                setSelectedBooking(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Confirming...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
        }}
        title="Cancel Booking"
        size="sm"
      >
        <div className="confirmation-content">
          <p>Are you sure you want to cancel this booking?</p>
          {selectedBooking && (
            <div className="confirmation-info">
              <strong>{selectedBooking.listing_title || `Listing #${selectedBooking.listing}`}</strong>
              <span>
                {formatDate(selectedBooking.start_date)} → {formatDate(selectedBooking.end_date)}
              </span>
              <span>Guest: {selectedBooking.user_username || `User #${selectedBooking.user}`}</span>
            </div>
          )}
          <div className="confirmation-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowCancelModal(false);
                setSelectedBooking(null);
              }}
              disabled={isSubmitting}
            >
              Go Back
            </button>
            <button className="btn btn-danger" onClick={handleCancel} disabled={isSubmitting}>
              {isSubmitting ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}