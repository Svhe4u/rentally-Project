import { useState, useEffect } from 'react';
import type { UserProfile, BrokerProfile } from '../../types';
import { AuthAPI, BrokerAPI } from '../../api/api';
import './Profile.css';

interface ProfileProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function Profile({ onSuccess, onError }: ProfileProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'broker'>('personal');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    company_name: '',
    registration_number: '',
    description: '',
    website: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileData, roleData] = await Promise.all([
        AuthAPI.getProfile(),
        AuthAPI.getRole(),
      ]);

      const mergedData = { ...profileData, ...roleData };
      setUser(mergedData);

      // Set initial form data
      setFormData({
        first_name: mergedData.first_name || '',
        last_name: mergedData.last_name || '',
        phone: mergedData.phone || '',
        address: mergedData.address || '',
        company_name: '',
        registration_number: '',
        description: '',
        website: '',
      });

      // Fetch broker profile if user is a broker
      if (mergedData.role === 'broker') {
        try {
          const brokerData = await BrokerAPI.getById(mergedData.id);
          setBrokerProfile(brokerData);
          setFormData((prev) => ({
            ...prev,
            company_name: brokerData.company_name || '',
            registration_number: brokerData.registration_number || '',
            description: brokerData.description || '',
            website: brokerData.website || '',
          }));
        } catch (e) {
          console.log('No broker profile found');
        }
      }
    } catch (error) {
      onError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Update user profile
      await AuthAPI.updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        address: formData.address,
      });

      // Update broker profile if applicable
      if (user.role === 'broker' && brokerProfile) {
        await BrokerAPI.update(user.id, {
          company_name: formData.company_name,
          registration_number: formData.registration_number,
          description: formData.description,
          website: formData.website,
        });
      }

      onSuccess('Профайл амжилттай шинэчлэгдлээ');
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      onError(error.message || 'Профайл шинэчилж чадсангүй');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <div>Профайл уншиж чадсангүй</div>;
  }

  const getStatusBadge = () => {
    if (user.role === 'broker') {
      const status = brokerProfile?.status || 'pending';
      return (
        <span className={`status-badge status-${status}`}>
          {status === 'approved' ? '✓ Баталгаажсан зуучлагч' : status === 'pending' ? '⏳ Зөвшөөрөл хүлээж байна' : '✗ Татгалзсан'}
        </span>
      );
    }
    return <span className="status-badge status-user">Энгийн хэрэглэгч</span>;
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {user.profile_picture ? (
              <img src={user.profile_picture} alt={user.username} />
            ) : (
              <span>{user.first_name?.[0] || user.username[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="profile-info">
            <h2>{user.first_name} {user.last_name}</h2>
            <p>@{user.username}</p>
            <div className="profile-badges">
              {getStatusBadge()}
              {user.is_verified && <span className="verified-badge">✓ Баталгаажсан</span>}
            </div>
          </div>
        </div>

        <button
          className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setIsEditing(!isEditing)}
          disabled={isSubmitting}
        >
          {isEditing ? 'Болих' : 'Профайл засах'}
        </button>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Хувийн мэдээлэл
        </button>
        {user.role === 'broker' && (
          <button
            className={`tab ${activeTab === 'broker' ? 'active' : ''}`}
            onClick={() => setActiveTab('broker')}
          >
            Зуучлагчийн мэдээлэл
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        {activeTab === 'personal' ? (
          <div className="form-section">
            <h3>Хувийн мэдээлэл</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Нэр</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="Нэр"
                  />
                ) : (
                  <div className="form-value">{formData.first_name || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Овог</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Овог"
                  />
                ) : (
                  <div className="form-value">{formData.last_name || '-'}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Цахим шуудан</label>
                <div className="form-value">{user.email}</div>
              </div>

              <div className="form-group">
                <label>Утас</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+976 XXXX XXXX"
                  />
                ) : (
                  <div className="form-value">{formData.phone || '-'}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Хаяг</label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Таны хаяг"
                  rows={3}
                />
              ) : (
                <div className="form-value">{formData.address || '-'}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="form-section">
            <h3>Зуучлагчийн мэдээлэл</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Компанийн нэр</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Компанийн нэр"
                  />
                ) : (
                  <div className="form-value">{formData.company_name || '-'}</div>
                )}
              </div>

              <div className="form-group">
                <label>Регистрийн дугаар</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) => handleChange('registration_number', e.target.value)}
                    placeholder="Регистрийн дугаар"
                  />
                ) : (
                  <div className="form-value">{formData.registration_number || '-'}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Вебсайт</label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://example.com"
                />
              ) : (
                <div className="form-value">
                  {formData.website ? (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer">
                      {formData.website}
                    </a>
                  ) : (
                    '-'
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Тайлбар</label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Компаниа тайлбарлана уу..."
                  rows={4}
                />
              ) : (
                <div className="form-value">{formData.description || '-'}</div>
              )}
            </div>

            {brokerProfile?.verified_at && (
              <div className="verified-date">
                Баталгаажсан огноо: {new Date(brokerProfile.verified_at).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {isEditing && (
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Болих
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Хадгалж байна...' : 'Өөрчлөлт хадгалах'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
