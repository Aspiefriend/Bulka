import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResendActivation from '../components/ResendActivation';
import './LoginPage.css';
import { GoogleLogin } from '@react-oauth/google';

function LoginPage() {
  const { user, loading, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmScreen, setShowConfirmScreen] = useState(false);

  if (loading) {
    return (
      <>
        <title>Загрузка... — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="login">
          <h1 className="login__title">Вход</h1>
          <p className="login__status">Загрузка...</p>
        </div>
      </>
    );
  }
  if (user) return <Navigate to="/" replace />;

  function handleGoogleSuccess(credentialResponse) {
    setError('');
    setSubmitting(true);
    loginWithGoogle(credentialResponse.credential)
      .then(() => navigate('/'))
      .catch((err) => {
        setError(err.message);
        setSubmitting(false);
      });
  }
  function handleGoogleError() {
    setError('Вход через Google был отменен или произошла ошибка');
    setSubmitting(false);
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.code === 'EMAIL_NOT_ACTIVATED') {
        setShowConfirmScreen(true);
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (showConfirmScreen) {
    return (
      <>
        <title>Подтверждение почты — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="login">
          <h1 className="login__title">Подтверждение почты</h1>

          <div className="login__success-box">
            <p>
              Подтвердите вашу почту. Мы отправили письмо на адрес{' '}
              <strong>{email}</strong>.
            </p>

            <ResendActivation email={email} password={password} />
          </div>

          <p className="login__footer">
            <Link to="/">На главную</Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Вход — Булка</title>
      <meta name="robots" content="noindex" />
      <div className="login">
        <h1 className="login__title">Вход</h1>

        <form className="login__form" onSubmit={handleSubmit}>
          {error && <p className="login__error">{error}</p>}

          <label className="login__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="login__field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="login__submit" disabled={submitting}>
            {submitting ? 'Загрузка...' : 'Войти'}
          </button>
        </form>
        <div className="login__divider">
          <span>или</span>
        </div>
        <div
          className={`login__google ${submitting ? 'login__google--disabled' : ''}`}
        >
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="continue_with"
            shape="rectangular"
            width="100%"
            locate="ru"
          />
        </div>
        <p className="login__footer">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      </div>
    </>
  );
}

export default LoginPage;
