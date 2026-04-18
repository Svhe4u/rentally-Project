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
      onError('Захиалга уншиж чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await BookingAPI.update(selectedBooking.id, { status: 'confirmed' });
      onSuccess('Захиалга амжилттай баталгаажлаа');
      setShowConfirmModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error: any) {
      onError(error.message || 'Захиалга баталгаажуулж чадсангүй');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedBooking) return;
    try {
      setIsSubmitting(true);
      await BookingAPI.cancel(selectedBooking.id);
      onSuccess('Захиалга амжилттай цуцлагдлаа');
      setShowCancelModal(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error: any) {
      onError(error.message || 'Захиалга цуцалж чадсангүй');
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
      pending: 'Хүлээгдэж буй',
      confirmed: 'Баталгаажсан',
      checked_in: 'Орсон',
      checked_out: 'Гарсан',
      cancelled: 'Цуцлагдсан',
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
          <h1 className="page-title">Захиалгууд</h1>
          <div className="booking-counts">
            <span className="count-badge">Нийт {statusCounts.all}</span>
            {statusCounts.pending > 0 && (
              <span className="count-badge pending">{statusCounts.pending} хүлээгдэж буй</span>
            )}
          </div>
        </div>

        <div className="bookings-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Бүх төлөв</option>
            <option value="pending">Хүлээгдэж буй</option>
            <option value="confirmed">Баталгаажсан</option>
            <option value="checked_in">Орсон</option>
            <option value="checked_out">Гарсан</option>
            <option value="cancelled">Цуцлагдсан</option>
          </select>
        </div>
      </div>

      <div className="bookings-table-container">
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Байр</th>
              <th>Зочин</th>
              <th>Огноо</th>
              <th>Үнэ</th>
              <th>Төлөв</th>
              <th className="actions-header">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <p>Захиалга олдсонгүй</p>
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
                        title="Дэлгэрэнгүй харах"
                      >
                        👁
                      </button>
                      {booking.status === 'pending' && (
                        <button
                          className="action-btn confirm"
                          onClick={() => openConfirm(booking)}
                          title="Захиалга баталгаажуулах"
                        >
                          ✓
                        </button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          className="action-btn cancel"
                          onClick={() => openCancel(booking)}
                          title="Захиалга цуцлах"
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
        title="Захиалгын дэлгэрэнгүй"
        size="md"
      >
        {selectedBooking && (
          <div className="booking-detail">
            <div className="detail-section">
              <h4>Байр</h4>
              <p>{selectedBooking.listing_title || `Listing #${selectedBooking.listing}`}</p>
            </div>

            <div className="detail-section">
              <h4>Зочин</h4>
              <p>{selectedBooking.user_username || `User #${selectedBooking.user}`}</p>
            </div>

            <div className="detail-row">
              <div className="detail-section">
                <h4>Орох</h4>
                <p>{formatDate(selectedBooking.start_date)}</p>
              </div>
              <div className="detail-section">
                <h4>Гарах</h4>
                <p>{formatDate(selectedBooking.end_date)}</p>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-section">
                <h4>Нийт үнэ</h4>
                <p className="detail-price">{formatPrice(selectedBooking.total_price)}</p>
              </div>
              <div className="detail-section">
                <h4>Төлөв</h4>
                <p>
                  <span className={`status-badge ${selectedBooking.status}`}>
                    {getStatusLabel(selectedBooking.status)}
                  </span>
                </p>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="detail-section">
                <h4>Тэмдэглэл</h4>
                <p className="detail-notes">{selectedBooking.notes}</p>
              </div>
            )}

            <div className="detail-section">
              <h4>Захиалсан огноо</h4>
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
                  Захиалга баталгаажуулах
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
                  Захиалга цуцлах
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
        title="Захиалга баталгаажуулах"
        size="sm"
      >
        <div className="confirmation-content">
          <p>Та энэ захиалгыг баталгаажуулахдаа итгэлтэй байна уу?</p>
          {selectedBooking && (
            <div className="confirmation-info">
              <strong>{selectedBooking.listing_title || `Listing #${selectedBooking.listing}`}</strong>
              <span>
                {formatDate(selectedBooking.start_date)} → {formatDate(selectedBooking.end_date)}
              </span>
              <span>Зочин: {selectedBooking.user_username || `User #${selectedBooking.user}`}</span>
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
              Болих
            </button>
            <button className="btn btn-primary" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Баталгаажуулж байна...' : 'Баталгаажуулах'}
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
        title="Захиалга цуцлах"
        size="sm"
      >
        <div className="confirmation-content">
          <p>Та энэ захиалгыг цуцлахдаа итгэлтэй байна уу?</p>
          {selectedBooking && (
            <div className="confirmation-info">
              <strong>{selectedBooking.listing_title || `Listing #${selectedBooking.listing}`}</strong>
              <span>
                {formatDate(selectedBooking.start_date)} → {formatDate(selectedBooking.end_date)}
              </span>
              <span>Зочин: {selectedBooking.user_username || `User #${selectedBooking.user}`}</span>
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
              Буцах
            </button>
            <button className="btn btn-danger" onClick={handleCancel} disabled={isSubmitting}>
              {isSubmitting ? 'Цуцалж байна...' : 'Захиалга цуцлах'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}