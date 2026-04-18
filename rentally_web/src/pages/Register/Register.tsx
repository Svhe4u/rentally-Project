import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, AuthAPI } from '../../api/api';
import './Register.css';

interface RegisterProps {
  onRegister: () => void;
}

export function Register({ onRegister }: RegisterProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    isCompany: false,
    company_name: '',
    registration_number: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.password2) {
      setError('Нууц үг таарахгүй байна');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: 'broker', // All registrants here are brokers
        ...(formData.isCompany && {
          company_name: formData.company_name,
          registration_number: formData.registration_number,
        }),
      };

      const response = await AuthAPI.register(payload);

      if (response.tokens?.access) {
        api.setToken(response.tokens.access);
        onRegister();
        navigate('/');
      } else {
        setError('Серверээс алдаа гарлаа');
      }
    } catch (err: any) {
      setError(err.message || 'Бүртгүүлэхэд алдаа гарлаа. Мэдээллээ дахин шалгана уу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-branding">
          <div className="logo-icon">🏠</div>
          <h1>Rentally Зуучлагч</h1>
          <p>Шинэ зуучлагч эсвэл компани нэмэх</p>
        </div>

        <div className="register-card">
          <h2>Бүртгүүлэх</h2>
          
          {error && (
            <div className="register-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label>Нэр</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Жишээ: Бат"
                  required
                />
              </div>
              <div className="form-group">
                <label>Овог</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Жишээ: Болд"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Хэрэглэгчийн нэр (Username)</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Системд нэвтрэх нэр"
                required
              />
            </div>

            <div className="form-group">
              <label>Имэйл хаяг</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Имэйл"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Нууц үг</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Хамгийн багадаа 8 тэмдэгт"
                  required
                />
              </div>
              <div className="form-group">
                <label>Нууц үг давтах</label>
                <input
                  type="password"
                  value={formData.password2}
                  onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                  placeholder="Нууц үгээ дахин оруулна уу"
                  required
                />
              </div>
            </div>

            <div className="company-toggle-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={formData.isCompany}
                  onChange={(e) => setFormData({ ...formData, isCompany: e.target.checked })}
                />
                <span className="checkmark"></span>
                Бид албан ёсны зуучлагч компани / байгууллага
              </label>
            </div>

            {formData.isCompany && (
              <div className="company-fields">
                <div className="form-group">
                  <label>Компанийн нэр</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Албан ёсны компанийн нэр"
                    required={formData.isCompany}
                  />
                </div>
                <div className="form-group">
                  <label>Улсын бүртгэлийн дугаар (РД)</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    placeholder="Жишээ: 1234567"
                    required={formData.isCompany}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary register-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Бүртгэж байна...
                </>
              ) : (
                'Бүртгүүлэх'
              )}
            </button>
          </form>

          <div className="register-footer">
            <Link to="/login" className="login-link">Танд бүртгэл байгаа бол энд дарж нэвтэрнэ үү</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
