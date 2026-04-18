import { useEffect, useState } from 'react';
import type { Listing, Booking } from '../../types';
import { ListingAPI, BookingAPI } from '../../api/api';
import './Dashboard.css';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalBookings: 0,
    pendingBookings: 0,
    recentViews: 0,
  });
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [listingsData, bookingsData] = await Promise.all([
        ListingAPI.getMyListings(),
        BookingAPI.getForMyListings(),
      ]);

      const listings = listingsData.results || [];
      const bookings = bookingsData.results || [];

      setStats({
        totalListings: listings.length,
        activeListings: listings.filter((l: Listing) => l.status === 'active').length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter((b: Booking) => b.status === 'pending').length,
        recentViews: listings.reduce((sum: number, l: Listing) => sum + (l.views_count || 0), 0),
      });

      setRecentListings(listings.slice(0, 5));
      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalListings}</span>
            <span className="stat-label">Нийт байр</span>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeListings}</span>
            <span className="stat-label">Идэвхтэй зарууд</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalBookings}</span>
            <span className="stat-label">Нийт захиалга</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className="stat-value">{stats.pendingBookings}</span>
            <span className="stat-label">Хүлээгдэж буй захиалга</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👁</div>
          <div className="stat-content">
            <span className="stat-value">{stats.recentViews.toLocaleString()}</span>
            <span className="stat-label">Нийт хандалт</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Сүүлд нэмсэн байрнууд</h3>
          </div>
          <div className="section-content">
            {recentListings.length === 0 ? (
              <p className="empty-state">Одоогоор байр байхгүй байна. Эхний зараа нэмнэ үү!</p>
            ) : (
              <div className="recent-list">
                {recentListings.map((listing) => (
                  <div key={listing.id} className="recent-item">
                    <div className="recent-item-info">
                      <span className="recent-item-title">{listing.title}</span>
                      <span className="recent-item-meta">
                        ₮{Number(listing.price).toLocaleString()} / {listing.price_type}
                      </span>
                    </div>
                    <span className={`status-badge ${listing.status}`}>
                      {listing.status === 'active' ? 'Идэвхтэй' : 
                       listing.status === 'rented' ? 'Түрээслэгдсэн' : 'Идэвхгүй'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h3>Сүүлийн захиалгууд</h3>
          </div>
          <div className="section-content">
            {recentBookings.length === 0 ? (
              <p className="empty-state">Одоогоор захиалга байхгүй байна.</p>
            ) : (
              <div className="recent-list">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="recent-item">
                    <div className="recent-item-info">
                      <span className="recent-item-title">{booking.listing_title}</span>
                      <span className="recent-item-meta">
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status === 'pending' ? 'Хүлээгдэж буй' :
                       booking.status === 'confirmed' ? 'Баталгаажсан' :
                       booking.status === 'cancelled' ? 'Цуцлагдсан' : booking.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
