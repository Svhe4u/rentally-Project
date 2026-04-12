import { useState, useEffect } from 'react';
import type { Category, Region, Listing, ListingFormData, PriceType } from '../../types';
import './ListingForm.css';

interface ListingFormProps {
  listing?: Listing | null;
  categories: Category[];
  regions: Region[];
  onSubmit: (data: ListingFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const priceTypes: { value: PriceType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const heatingTypes = ['Central', 'Electric', 'Gas', 'Coal', 'Other'];

export function ListingForm({ listing, categories, regions, onSubmit, onCancel, isSubmitting }: ListingFormProps) {
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    address: '',
    category_id: 0,
    region_id: 0,
    price: 0,
    price_type: 'monthly',
    latitude: undefined,
    longitude: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    area_sqm: undefined,
    heating_type: '',
    features: [],
  });

  const [featureInput, setFeatureInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title,
        description: listing.description,
        address: listing.address,
        category_id: listing.category,
        region_id: listing.region,
        price: listing.price,
        price_type: listing.price_type,
        latitude: listing.latitude,
        longitude: listing.longitude,
        bedrooms: listing.detail?.bedrooms,
        bathrooms: listing.detail?.bathrooms,
        area_sqm: listing.detail?.area_sqm,
        heating_type: listing.detail?.heating_type || '',
        features: listing.features?.map(f => f.name) || [],
      });
    }
  }, [listing]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.region_id) newErrors.region_id = 'Region is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof ListingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addFeature = () => {
    if (featureInput.trim() && !formData.features?.includes(featureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()],
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter(f => f !== feature) || [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="listing-form">
      <div className="form-section">
        <h4 className="form-section-title">Basic Information</h4>

        <div className="form-group">
          <label className="form-label">Property Title *</label>
          <input
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="e.g., Modern 2BR Apartment in Khan-Uul"
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className={`form-select ${errors.category_id ? 'error' : ''}`}
              value={formData.category_id}
              onChange={e => handleChange('category_id', parseInt(e.target.value))}
            >
              <option value={0}>Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <span className="error-message">{errors.category_id}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Region *</label>
            <select
              className={`form-select ${errors.region_id ? 'error' : ''}`}
              value={formData.region_id}
              onChange={e => handleChange('region_id', parseInt(e.target.value))}
            >
              <option value={0}>Select Region</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            {errors.region_id && <span className="error-message">{errors.region_id}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address *</label>
          <input
            type="text"
            className={`form-input ${errors.address ? 'error' : ''}`}
            value={formData.address}
            onChange={e => handleChange('address', e.target.value)}
            placeholder="Full address"
          />
          {errors.address && <span className="error-message">{errors.address}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Describe the property..."
            rows={4}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Pricing</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price (MNT) *</label>
            <input
              type="number"
              className={`form-input ${errors.price ? 'error' : ''}`}
              value={formData.price}
              onChange={e => handleChange('price', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 1500000"
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Price Type *</label>
            <select
              className="form-select"
              value={formData.price_type}
              onChange={e => handleChange('price_type', e.target.value as PriceType)}
            >
              {priceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Property Details</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Bedrooms</label>
            <input
              type="number"
              className="form-input"
              value={formData.bedrooms || ''}
              onChange={e => handleChange('bedrooms', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bathrooms</label>
            <input
              type="number"
              className="form-input"
              value={formData.bathrooms || ''}
              onChange={e => handleChange('bathrooms', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Area (m²)</label>
            <input
              type="number"
              className="form-input"
              value={formData.area_sqm || ''}
              onChange={e => handleChange('area_sqm', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 65"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Heating Type</label>
            <select
              className="form-select"
              value={formData.heating_type}
              onChange={e => handleChange('heating_type', e.target.value)}
            >
              <option value="">Select</option>
              {heatingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Features & Amenities</h4>

        <div className="form-row">
          <input
            type="text"
            className="form-input"
            value={featureInput}
            onChange={e => setFeatureInput(e.target.value)}
            placeholder="Add feature (e.g., Parking, WiFi, Balcony)"
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
          />
          <button type="button" className="btn btn-secondary" onClick={addFeature}>
            Add
          </button>
        </div>

        <div className="features-list">
          {formData.features?.map(feature => (
            <span key={feature} className="feature-tag">
              {feature}
              <button type="button" onClick={() => removeFeature(feature)} className="feature-remove">×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Location Coordinates (Optional)</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Latitude</label>
            <input
              type="number"
              step="any"
              className="form-input"
              value={formData.latitude || ''}
              onChange={e => handleChange('latitude', parseFloat(e.target.value) || undefined)}
              placeholder="e.g., 47.9177"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Longitude</label>
            <input
              type="number"
              step="any"
              className="form-input"
              value={formData.longitude || ''}
              onChange={e => handleChange('longitude', parseFloat(e.target.value) || undefined)}
              placeholder="e.g., 106.9176"
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : listing ? 'Update Property' : 'Create Property'}
        </button>
      </div>
    </form>
  );
}
