import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { LoginCredentials } from '../../types';
import { api, AuthAPI } from '../../api/api';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AuthAPI.login(credentials);

      if (response.tokens?.access) {
        api.setToken(response.tokens.access);
        onLogin();
        navigate('/');
      } else {
        setError('Серверээс буруу хариу ирлээ');
      }
    } catch (err: any) {
      setError(err.message || 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-branding">
          <div className="logo-icon">🏠</div>
          <h1>Rentally Зуучлагч</h1>
          <p>Мэргэжлийн үл хөдлөх хөрөнгийн удирдлагын портал</p>
        </div>

        <div className="login-card">
          <h2>Тавтай морилно уу</h2>
          <p className="login-subtitle">Байрнуудаа удирдахын тулд нэвтэрнэ үү</p>

          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Хэрэглэгчийн нэр</label>
              <input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                placeholder="Хэрэглэгчийн нэрээ оруулна уу"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Нууц үг</label>
              <input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="Нууц үгээ оруулна уу"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Нэвтэрч байна...
                </>
              ) : (
                'Нэвтрэх'
              )}
            </button>
          </form>

          <div className="login-help">
            <Link to="/register" className="login-register-link">Та бүртгэлгүй бол энд дарж бүртгүүлнэ үү</Link>
            <p style={{marginTop: '24px'}}>Жишээ нэвтрэх эрх:</p>
            <code>username: broker / password: broker123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
