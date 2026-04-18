import { useState, useEffect } from 'react';
import type { Listing, Category, Region, ListingFormData, ListingStatus } from '../../types';
import { ListingAPI, MetaDataAPI } from '../../api/api';
import { Modal } from '../../components/Modal';
import { ListingForm } from '../../components/ListingForm';
import './Listings.css';

interface ListingsProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function Listings({ onSuccess, onError }: ListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listingsData, categoriesData, regionsData] = await Promise.all([
        ListingAPI.getMyListings(),
        MetaDataAPI.getCategories(),
        MetaDataAPI.getRegions(),
      ]);

      setListings(listingsData.results || []);
      setCategories(categoriesData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      onError('Жагсаалтыг уншиж чадсангүй');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: ListingFormData) => {
    try {
      setIsSubmitting(true);
      await ListingAPI.create(data);
      onSuccess('Байр амжилттай үүслээ');
      setShowAddModal(false);
      fetchData();
    } catch (error: any) {
      onError(error.message || 'Байр үүсгэж чадсангүй');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: ListingFormData) => {
    if (!selectedListing) return;

    try {
      setIsSubmitting(true);
      await ListingAPI.update(selectedListing.id, data);
      onSuccess('Байр амжилттай шинэчлэгдлээ');
      setShowEditModal(false);
      setSelectedListing(null);
      fetchData();
    } catch (error: any) {
      onError(error.message || 'Байр шинэчилж чадсангүй');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedListing) return;

    try {
      setIsSubmitting(true);
      await ListingAPI.delete(selectedListing.id);
      onSuccess('Байр амжилттай устгагдлаа');
      setShowDeleteModal(false);
      setSelectedListing(null);
      fetchData();
    } catch (error: any) {
      onError(error.message || 'Байр устгаж чадсангүй');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (listing: Listing, newStatus: ListingStatus) => {
    try {
      await ListingAPI.patch(listing.id, { status: newStatus });
      onSuccess(`Төлөв ${newStatus} болж өөрчлөгдлөө`);
      fetchData();
    } catch (error: any) {
      onError(error.message || 'Төлөв өөрчилж чадсангүй');
    }
  };

  const openEditModal = (listing: Listing) => {
    setSelectedListing(listing);
    setShowEditModal(true);
  };

  const openDeleteModal = (listing: Listing) => {
    setSelectedListing(listing);
    setShowDeleteModal(true);
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return `₮${Number(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="listings-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="listings-page">
      <div className="listings-header">
        <div className="listings-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Байр хайх..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Бүх төлөв</option>
            <option value="active">Идэвхтэй</option>
            <option value="inactive">Идэвхгүй</option>
            <option value="sold">Зарагдсан</option>
            <option value="archived">Архивлагдсан</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Байр нэмэх
        </button>
      </div>

      <div className="listings-table-container">
        <table className="listings-table">
          <thead>
            <tr>
              <th>Байр</th>
              <th>Байршил</th>
              <th>Үнэ</th>
              <th>Төлөв</th>
              <th>Хандалт</th>
              <th className="actions-header">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  <div className="empty-state">
                    <span className="empty-icon">🏠</span>
                    <p>Байр олдсонгүй</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                      Эхний байраа нэмнэ үү
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredListings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <div className="property-cell">
                      <div className="property-image">
                        {listing.images?.[0] ? (
                          <img src={listing.images[0].image_url} alt={listing.title} />
                        ) : (
                          <span className="no-image">📷</span>
                        )}
                      </div>
                      <div className="property-info">
                        <span className="property-title">{listing.title}</span>
                        <span className="property-category">{listing.category_name}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="location-cell">
                      <span>{listing.region_name}</span>
                      <span className="address">{listing.address}</span>
                    </div>
                  </td>
                  <td>
                    <div className="price-cell">
                      <span className="price">{formatPrice(listing.price)}</span>
                      <span className="price-period">/{listing.price_type}</span>
                    </div>
                  </td>
                  <td>
                    <select
                      value={listing.status}
                      onChange={(e) => handleStatusChange(listing, e.target.value as ListingStatus)}
                      className={`status-select status-${listing.status}`}
                    >
                      <option value="active">Идэвхтэй</option>
                      <option value="inactive">Идэвхгүй</option>
                      <option value="sold">Зарагдсан</option>
                      <option value="archived">Архивлагдсан</option>
                    </select>
                  </td>
                  <td>
                    <span className="views-count">{listing.views_count.toLocaleString()}</span>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        className="action-btn edit"
                        onClick={() => openEditModal(listing)}
                        title="Засах"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => openDeleteModal(listing)}
                        title="Устгах"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Шинэ байр нэмэх"
        size="lg"
      >
        <ListingForm
          categories={categories}
          regions={regions}
          onSubmit={handleCreate}
          onCancel={() => setShowAddModal(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedListing(null);
        }}
        title="Байр засах"
        size="lg"
      >
        {selectedListing && (
          <ListingForm
            listing={selectedListing}
            categories={categories}
            regions={regions}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedListing(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedListing(null);
        }}
        title="Байр устгах"
        size="sm"
      >
        <div className="delete-confirmation">
          <p>Та энэ байрыг устгахдаа итгэлтэй байна уу?</p>
          {selectedListing && (
            <div className="delete-property-info">
              <strong>{selectedListing.title}</strong>
              <span>{selectedListing.address}</span>
            </div>
          )}
          <div className="delete-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedListing(null);
              }}
              disabled={isSubmitting}
            >
              Болих
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Устгаж байна...' : 'Устгах'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
