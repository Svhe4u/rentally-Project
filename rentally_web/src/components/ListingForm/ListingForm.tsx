import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Category, Region, Listing, ListingFormData, ListingImage, PriceType } from '../../types';
import { api, ListingImageAPI } from '../../api/api';
import { ImageUploader } from '../ImageUploader/ImageUploader';
import type { UploadImageMeta } from '../ImageUploader/ImageUploader';
import './ListingForm.css';

// Fix Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, onChange }: { 
  position: L.LatLng | null; 
  onChange: (pos: L.LatLng) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onChange(e.latlng);
    },
  });

  const markerRef = useRef<any>(null);

  // Focus map on the marker when explicitly loaded (e.g. edit mode)
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: false });
    }
  }, []);

  return position === null ? null : (
    <Marker 
      position={position}
      draggable={true}
      ref={markerRef}
      eventHandlers={{
        dragend: () => {
          const marker = markerRef.current;
          if (marker != null) {
            onChange(marker.getLatLng());
          }
        },
      }}
    />
  );
}

interface ListingFormProps {
  listing?: Listing | null;
  categories: Category[];
  regions: Region[];
  onSubmit: (data: ListingFormData, images: ListingImage[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  onUploadError?: (message: string) => void;
}

const priceTypes: { value: PriceType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const heatingTypes = ['Central', 'Electric', 'Gas', 'Coal', 'Other'];

export function ListingForm({
  listing,
  categories,
  regions,
  onSubmit,
  onCancel,
  isSubmitting,
  onUploadError,
}: ListingFormProps) {
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
    payment_condition: '',
    upfront_months: undefined,
    deposit_months: undefined,
    is_pet_friendly: false,
    furnishing_status: '',
    payment_terms: '',
    floor_type: '',
    window_type: '',
    door_type: '',
    balcony: false,
    garage: false,
    year_built: undefined,
    floor_number: undefined,
    building_floors: undefined,
    window_count: undefined,
    features: [],
  });

  const [featureInput, setFeatureInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ListingImage[]>([]);

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
        payment_condition: listing.detail?.payment_condition || '',
        upfront_months: listing.detail?.upfront_months,
        deposit_months: listing.detail?.deposit_months,
        is_pet_friendly: listing.detail?.is_pet_friendly || false,
        furnishing_status: listing.detail?.furnishing_status || '',
        payment_terms: listing.detail?.payment_terms || '',
        floor_type: listing.detail?.floor_type || '',
        window_type: listing.detail?.window_type || '',
        door_type: listing.detail?.door_type || '',
        balcony: listing.detail?.balcony || false,
        garage: listing.detail?.garage || false,
        year_built: listing.detail?.year_built,
        floor_number: listing.detail?.floor_number,
        building_floors: listing.detail?.building_floors,
        window_count: listing.detail?.window_count,
        features: listing.features?.map(f => f.name) || [],
      });
      setImages([...(listing.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } else {
      setImages([]);
    }
  }, [listing]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Гарчиг оруулах шаардлагатай';
    if (!formData.description.trim()) newErrors.description = 'Тайлбар оруулах шаардлагатай';
    if (!formData.address.trim()) newErrors.address = 'Хаяг оруулах шаардлагатай';
    if (!formData.category_id) newErrors.category_id = 'Ангилал сонгох шаардлагатай';
    if (!formData.region_id) newErrors.region_id = 'Бүс сонгох шаардлагатай';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Үнэ 0-ээс их байх ёстой';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData, images);
    }
  };

  const uploadListingImage = async (file: File, meta: UploadImageMeta): Promise<ListingImage> => {
    const { url } = await api.uploadFile('/upload/listing-image/', file);
    if (listing?.id) {
      return ListingImageAPI.create({
        listing_id: listing.id,
        image_url: url,
        order: meta.order,
        is_primary: meta.isPrimary,
      });
    }
    return {
      id: -(Date.now() + Math.floor(Math.random() * 10000)),
      image_url: url,
      order: meta.order,
      is_primary: meta.isPrimary,
    };
  };

  const handleRemoveListingImage = async (img: ListingImage) => {
    if (listing?.id && img.id > 0) {
      await ListingImageAPI.delete(img.id);
    }
  };

  const persistListingImages = async (next: ListingImage[]) => {
    if (!listing?.id) return;
    for (const img of next) {
      if (img.id > 0) {
        await ListingImageAPI.update(img.id, {
          order: img.order,
          is_primary: img.is_primary,
        });
      }
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

  const mapPosition = useMemo(() => {
    if (formData.latitude && formData.longitude) {
      return new L.LatLng(formData.latitude, formData.longitude);
    }
    return null;
  }, [formData.latitude, formData.longitude]);

  const handleLocationChange = (pos: L.LatLng) => {
    handleChange('latitude', parseFloat(pos.lat.toFixed(6)));
    handleChange('longitude', parseFloat(pos.lng.toFixed(6)));
  };

  const mapCenter = mapPosition || new L.LatLng(47.9177, 106.9176); // Default Ulaanbaatar

  return (
    <form onSubmit={handleSubmit} className="listing-form">
      <div className="form-section">
        <h4 className="form-section-title">Үндсэн мэдээлэл</h4>

        <div className="form-group">
          <label className="form-label">Байрны гарчиг *</label>
          <input
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            value={formData.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="Жнь: Хан-Уулд орчин үеийн 2 өрөө байр"
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ангилал *</label>
            <select
              className={`form-select ${errors.category_id ? 'error' : ''}`}
              value={formData.category_id}
              onChange={e => handleChange('category_id', parseInt(e.target.value))}
            >
              <option value={0}>Ангилал сонгох</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            {errors.category_id && <span className="error-message">{errors.category_id}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Бүс *</label>
            <select
              className={`form-select ${errors.region_id ? 'error' : ''}`}
              value={formData.region_id}
              onChange={e => handleChange('region_id', parseInt(e.target.value))}
            >
              <option value={0}>Бүс сонгох</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            {errors.region_id && <span className="error-message">{errors.region_id}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Хаяг *</label>
          <input
            type="text"
            className={`form-input ${errors.address ? 'error' : ''}`}
            value={formData.address}
            onChange={e => handleChange('address', e.target.value)}
            placeholder="Бүтэн хаяг"
          />
          {errors.address && <span className="error-message">{errors.address}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Тайлбар *</label>
          <textarea
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Байрыг тайлбарлана уу..."
            rows={4}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Үнэ</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Үнэ (ТӨГ) *</label>
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
            <label className="form-label">Үнийн төрөл *</label>
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
        <h4 className="form-section-title">Байрны дэлгэрэнгүй</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Унтлагын өрөө</label>
            <input
              type="number"
              className="form-input"
              value={formData.bedrooms || ''}
              onChange={e => handleChange('bedrooms', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ариун цэврийн өрөө</label>
            <input
              type="number"
              className="form-input"
              value={formData.bathrooms || ''}
              onChange={e => handleChange('bathrooms', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 1"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Талбай (м²)</label>
            <input
              type="number"
              className="form-input"
              value={formData.area_sqm || ''}
              onChange={e => handleChange('area_sqm', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 65"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Халаалт</label>
            <select
              className="form-select"
              value={formData.heating_type}
              onChange={e => handleChange('heating_type', e.target.value)}
            >
              <option value="">Сонгох</option>
              {heatingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Баригдсан он</label>
            <input
              type="number"
              className="form-input"
              value={formData.year_built || ''}
              onChange={e => handleChange('year_built', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 2015"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Нийт давхар</label>
            <input
              type="number"
              className="form-input"
              value={formData.building_floors || ''}
              onChange={e => handleChange('building_floors', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 12"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Хэдэн давхарт</label>
            <input
              type="number"
              className="form-input"
              value={formData.floor_number || ''}
              onChange={e => handleChange('floor_number', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 5"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Цонхны тоо</label>
            <input
              type="number"
              className="form-input"
              value={formData.window_count || ''}
              onChange={e => handleChange('window_count', parseInt(e.target.value) || undefined)}
              placeholder="e.g., 3"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Шал</label>
            <input
              type="text"
              className="form-input"
              value={formData.floor_type || ''}
              onChange={e => handleChange('floor_type', e.target.value)}
              placeholder="e.g., Паркет"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Цонх</label>
            <input
              type="text"
              className="form-input"
              value={formData.window_type || ''}
              onChange={e => handleChange('window_type', e.target.value)}
              placeholder="e.g., Вакум"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Хаалга</label>
            <input
              type="text"
              className="form-input"
              value={formData.door_type || ''}
              onChange={e => handleChange('door_type', e.target.value)}
              placeholder="e.g., Бүргэд"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="balcony"
              checked={formData.balcony || false}
              onChange={e => handleChange('balcony', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <label htmlFor="balcony" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Тагттай</label>
          </div>

          <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="garage"
              checked={formData.garage || false}
              onChange={e => handleChange('garage', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <label htmlFor="garage" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Дулаан зогсоолтой</label>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Түрээсийн нөхцөл</h4>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Төлбөрийн нөхцөл</label>
            <select
              className="form-select"
              value={formData.payment_condition || ''}
              onChange={e => handleChange('payment_condition', e.target.value)}
            >
              <option value="">Сонгох</option>
              <option value="1_plus_1">1+1 (1 сар урьдчилгаа, 1 сар барьцаа)</option>
              <option value="3_plus_1">3+1 (3 сар урьдчилгаа, 1 сар барьцаа)</option>
              <option value="6_plus_1">6+1 (6 сар урьдчилгаа, 1 сар барьцаа)</option>
              <option value="monthly">Сар бүр (Барьцаатай)</option>
              <option value="no_deposit">Барьцаагүй</option>
              <option value="custom">Бусад (Тохиролцоно)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Тавилга</label>
            <select
              className="form-select"
              value={formData.furnishing_status || ''}
              onChange={e => handleChange('furnishing_status', e.target.value)}
            >
              <option value="">Сонгох</option>
              <option value="unfurnished">Тавилгагүй (Хоосон)</option>
              <option value="semi_furnished">Хагас тавилгатай</option>
              <option value="fully_furnished">Бүрэн тавилгатай</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Урьдчилж төлөх сар</label>
            <input
              type="number"
              className="form-input"
              value={formData.upfront_months || ''}
              onChange={e => handleChange('upfront_months', parseInt(e.target.value) || undefined)}
              placeholder="Жнь: 3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Барьцаа сар</label>
            <input
              type="number"
              className="form-input"
              value={formData.deposit_months || ''}
              onChange={e => handleChange('deposit_months', parseInt(e.target.value) || undefined)}
              placeholder="Жнь: 1"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="is_pet_friendly"
              checked={formData.is_pet_friendly || false}
              onChange={e => handleChange('is_pet_friendly', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
            />
            <label htmlFor="is_pet_friendly" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Амьтан тэжээхийг зөвшөөрөх</label>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '15px' }}>
          <label className="form-label">Төлбөрийн нэмэлт тайлбар</label>
          <input
            type="text"
            className="form-input"
            value={formData.payment_terms || ''}
            onChange={e => handleChange('payment_terms', e.target.value)}
            placeholder="Нэмэлт нөхцөл, мэдээлэл..."
          />
        </div>
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Давуу талууд</h4>

        <div className="form-row">
          <input
            type="text"
            className="form-input"
            value={featureInput}
            onChange={e => setFeatureInput(e.target.value)}
            placeholder="Давуу тал нэмэх (Жнь: Зогсоол, WiFi, Тагт)"
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
          />
          <button type="button" className="btn btn-secondary" onClick={addFeature}>
            Нэмэх
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
        <h4 className="form-section-title">Зураг</h4>
        <ImageUploader
          images={images}
          onImagesChange={setImages}
          uploadImage={uploadListingImage}
          onRemoveImage={handleRemoveListingImage}
          onPersistImages={persistListingImages}
          onUploadError={onUploadError}
        />
      </div>

      <div className="form-section">
        <h4 className="form-section-title">Байршлын координат (Нэмэлт)</h4>
        
        <p className="map-instructions" style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>
          Та газрын зураг дээр хулганаар дарж эсвэл зүүг (Pin) чирч байршлаа зааж өгөх боломжтой.
        </p>

        <div className="map-picker-container">
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            scrollWheelZoom={true} 
            style={{ height: '300px', width: '100%', borderRadius: '8px', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={mapPosition} onChange={handleLocationChange} />
          </MapContainer>
        </div>

        <div className="form-row" style={{ marginTop: '15px' }}>
          <div className="form-group">
            <label className="form-label">Өргөрөг (Latitude)</label>
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
            <label className="form-label">Уртраг (Longitude)</label>
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
          Болих
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Хадгалж байна...' : listing ? 'Байр шинэчлэх' : 'Байр үүсгэх'}
        </button>
      </div>
    </form>
  );
}
