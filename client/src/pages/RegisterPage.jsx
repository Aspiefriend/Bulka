import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResendActivation from '../components/ResendActivation';
import './RegisterPage.css';
import { GoogleLogin } from '@react-oauth/google';

function RegisterPage() {
  const { user, loading, register, loginWithGoogle } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showConfirmScreen, setShowConfirmScreen] = useState(false);
  const [mailError, setMailError] = useState('');

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
    setMailError('');

    try {
      await register(email, password, name);

      setShowConfirmScreen(true);
    } catch (err) {
      if (err.code === 'EMAIL_SEND_FAILED') {
        setMailError(err.message);
        setShowConfirmScreen(true);
      } else if (
        err.code === 'EMAIL_TAKEN' ||
        err.code === 'INVALID_CREDENTIALS'
      ) {
        setError('Email уже зарегистрирован или неверный пароль.');
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
        <div className="register">
          <h1 className="register__title">Подтверждение почты</h1>

          <div className="register__success-box">
            {mailError ? (
              <p className="register__error-text">
                Не удалось отправить письмо на <strong>{email}</strong>.
                Попробуйте запросить его еще раз.
              </p>
            ) : (
              <>
                <p>
                  Мы отправили письмо с ссылкой для активации на адрес{' '}
                  <strong>{email}</strong>.
                </p>
                <p>
                  Перейдите по ссылке из письма, чтобы завершить регистрацию.
                </p>
              </>
            )}

            <ResendActivation email={email} password={password} />
          </div>

          <p className="register__footer">
            <Link to="/login">Перейти к входу</Link>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Регистрация — Булка</title>
      <meta name="robots" content="noindex" />
      <div className="register">
        <h1 className="register__title">Регистрация</h1>
        <form className="register__form" onSubmit={handleSubmit}>
          {error === 'EMAIL_TAKEN' ? (
            <p className="register__error">
              Email уже зарегистрирован. <Link to="/login">Войти</Link>
            </p>
          ) : (
            error && <p className="register__error">{error}</p>
          )}

          <label className="register__field">
            <span>Имя</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
          <label className="register__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="register__field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </label>

          <button
            type="submit"
            className="register__submit"
            disabled={submitting}
          >
            {submitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <div className="register__divider">
          <span>или</span>
        </div>
        <div
          className={`register__google ${submitting ? 'regiester__google--disabled' : ''}`}
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
        <p className="register__footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </>
  );
}

export default RegisterPage;
