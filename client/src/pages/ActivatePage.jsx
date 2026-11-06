import { useEffect, useState } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import './ActivatePage.css';

function ActivatePage() {
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (loading || user) return;

    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Ссылка не содержит токен активации.');
      return;
    }

    api
      .post('/auth/activate', { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Ошибка активации');
      });
  }, [searchParams, loading, user]);

  if (loading) {
    return (
      <div className="activate">
        <div className="activate__box">
          <h1 className="activate__title">Загрузка...</h1>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  if (status === 'loading') {
    return (
      <div className="activate">
        <div className="activate__box">
          <h1 className="activate__title">Активация аккаунта</h1>
          <p className="activate__text">Проверяем вашу ссылку...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="activate">
        <div className="activate__box">
          <h1 className="activate__title">Активация аккаунта</h1>
          <p className="activate__text activate__text--success">{message}</p>
          <Link to="/login" className="activate__btn">
            Перейти к входу
          </Link>
        </div>
      </div>
    );
  }

  // Если ошибка
  return (
    <div className="activate">
      <div className="activate__box">
        <h1 className="activate__title">Активация аккаунта</h1>
        <p className="activate__text activate__text--error">{message}</p>

        <p className="activate__hint">
          Ссылка могла устареть или уже была использована.
        </p>

        <Link to="/login" className="activate__btn activate__btn--outline">
          Перейти к входу
        </Link>
      </div>
    </div>
  );
}

export default ActivatePage;
