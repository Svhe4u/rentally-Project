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
      onError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: ListingFormData) => {
    try {
      setIsSubmitting(true);
      await ListingAPI.create(data);
      onSuccess('Property created successfully');
      setShowAddModal(false);
      fetchData();
    } catch (error: any) {
      onError(error.message || 'Failed to create property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: ListingFormData) => {
    if (!selectedListing) return;

    try {
      setIsSubmitting(true);
      await ListingAPI.update(selectedListing.id, data);
      onSuccess('Property updated successfully');
      setShowEditModal(false);
      setSelectedListing(null);
      fetchData();
    } catch (error: any) {
      onError(error.message || 'Failed to update property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedListing) return;

    try {
      setIsSubmitting(true);
      await ListingAPI.delete(selectedListing.id);
      onSuccess('Property deleted successfully');
      setShowDeleteModal(false);
      setSelectedListing(null);
      fetchData();
    } catch (error: any) {
      onError(error.message || 'Failed to delete property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (listing: Listing, newStatus: ListingStatus) => {
    try {
      await ListingAPI.patch(listing.id, { status: newStatus });
      onSuccess(`Status changed to ${newStatus}`);
      fetchData();
    } catch (error: any) {
      onError(error.message || 'Failed to update status');
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
              placeholder="Search properties..."
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Property
        </button>
      </div>

      <div className="listings-table-container">
        <table className="listings-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Location</th>
              <th>Price</th>
              <th>Status</th>
              <th>Views</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  <div className="empty-state">
                    <span className="empty-icon">🏠</span>
                    <p>No properties found</p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                      Add your first property
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
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="sold">Sold</option>
                      <option value="archived">Archived</option>
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
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => openDeleteModal(listing)}
                        title="Delete"
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
        title="Add New Property"
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
        title="Edit Property"
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
        title="Delete Property"
        size="sm"
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete this property?</p>
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
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
