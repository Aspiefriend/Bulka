import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

function RegisterPage() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submiting, setSubmitting] = useState(false);

  if (loading) return <p> Загрузка.....</p>;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      if (err.code === 'EMAIL_TAKEN') {
        setError(err.code);
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register">
      <h1 className="register__title">Регистрация</h1>
      <form className="register__form" onSubmit={handleSubmit}>
        {error === 'EMAIL_TAKEN' ? (
          <p className="register__error">
            Email уже зарегистрирован. <Link to="/login">Войти</Link>
          </p>
        ) : (
          error && <p className="register__error"> {error}</p>
        )}
        <label className="register__field">
          <span> Имя</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </label>
        <label className="register__field">
          <span> Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="register__field">
          <span> Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="password"
          />
        </label>
        <button type="submit" className="register__submit" disabled={submiting}>
          {' '}
          {submiting ? 'Загрузка' : 'Зарегистрироваться'}
        </button>
        <p className="register__footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
