import { useState } from 'react';
import { api } from '../api/client';
import './ResendActivation.css';

function ResendActivation({ email, password }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleResend() {
    setStatus('loading');
    setError('');

    try {
      await api.post('/auth/resend-activation', { email, password });
      setStatus('success');

      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  return (
    <div className="resend-activation">
      {status === 'success' ? (
        <p className="resend-activation__success">
          Письмо отправлено еще раз! Проверьте почту.
        </p>
      ) : (
        <>
          <p className="resend-activation__text">
            Не получили письмо или ссылка невалидна? Отправьте ещё раз
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={status === 'loading'}
            className="resend-activation__btn"
          >
            {status === 'loading' ? 'Отправляем...' : 'отправьте его повторно'}
          </button>
        </>
      )}

      {error && <p className="resend-activation__error">{error}</p>}
    </div>
  );
}

export default ResendActivation;
