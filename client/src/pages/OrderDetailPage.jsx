import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './OrderDetailPage.css';
import '../components/ConfirmDialog.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import CountdownTimer from '../components/CountdownTimer';

const STATUS_LABELS = {
  new: 'Новый',
  accepted: 'Принят',
  cooking: 'Готовится',
  delivering: 'Доставляется',
  done: 'Выполнен',
  cancelled: 'Отменён',
};

function formatDate(isoString) {
  const date = new Date(isoString);
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
}

function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setLoadError({ message: err.message, code: err.code }))
      .finally(() => setLoading(false));
  }, [id, user]);

  useEffect(() => {
    if (order && order.payment_status === 'pending') {
      const timer = setTimeout(async () => {
        try {
          const res = await api.post(`/payments/sync/${order.id_order}`);
          setOrder(res.data);
        } catch (err) {
          console.log('Синхронизация не удалась:', err.message);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [id]);
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) setPaying(false);
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  function openConfirm() {
    setConfirmOpen(true);
  }
  async function handlePay() {
    setPaying(true);
    setActionError(null);

    try {
      const res = await api.post('/payments', { orderId: order.id_order });
      window.location.href = res.data.confirmation_url;
    } catch (err) {
      setActionError(err.message || 'Ошибка при создании платежа');
      setPaying(false);
    }
  }

  async function handleCancel() {
    setConfirmOpen(false);
    setCancelling(true);
    setActionError(null);

    try {
      await api.patch(`/orders/${id}/cancel`);
      navigate('/orders');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (!user) {
    return (
      <div className="order-detail">
        <h1>Заказ</h1>
        <p>
          Войдите, чтобы увидеть заказ. <Link to="/login">Войти</Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-detail">
        <h1>Заказ</h1>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="order-detail">
        <h1>Заказ</h1>
        {loadError.code === 'NOT_FOUND' ? (
          <p>Заказ не найден</p>
        ) : (
          <p>Ошибка: {loadError.message}</p>
        )}
        <Link to="/orders">К заказам</Link>
      </div>
    );
  }

  const canCancel = ['new', 'accepted'].includes(order.status);

  return (
    <div className="order-detail">
      <Link to="/orders" className="order-detail__back">
        ← К заказам
      </Link>

      <h1 className="order-detail__title">Заказ №{order.id_order}</h1>

      <div className="order-detail__meta">
        <span className="order-detail__date">
          {formatDate(order.created_at)}
        </span>
        <span
          className={`order-detail__status order-detail__status--${order.status}`}
        >
          {STATUS_LABELS[order.status]}
        </span>
        {order.payment_status === 'pending' && order.payment_deadline && (
          <CountdownTimer deadline={order.payment_deadline} />
        )}
      </div>

      <section className="order-detail__section">
        <h2>Способ получения</h2>
        <p>
          {order.delivery_method === 'delivery'
            ? `Доставка: ${order.address}`
            : `Самовывоз: ${order.bakery_name}, ${order.bakery_address}`}
        </p>
      </section>

      <section className="order-detail__section">
        <h2>Способ оплаты</h2>
        <p>
          {order.payment_method === 'online' && 'Онлайн'}
          {order.payment_method === 'card' && 'Картой при получении'}
          {order.payment_method === 'cash' && 'Наличными при получении'}
        </p>
      </section>

      {order.comment && (
        <section className="order-detail__section">
          <h2>Комментарий</h2>
          <p>{order.comment}</p>
        </section>
      )}

      <section className="order-detail__section">
        <h2>Состав заказа</h2>
        <ul className="order-detail__items">
          {order.items.map((item) => (
            <li key={item.id_product} className="order-detail__item">
              <span>{item.name}</span>
              <span>
                {item.quantity} × {item.price} ₽
              </span>
              <span>{item.quantity * item.price} ₽</span>
            </li>
          ))}
        </ul>
        <div className="order-detail__total">
          <span>Итого:</span>
          <span>{order.total} ₽</span>
        </div>
      </section>
      {actionError && (
        <p className="order-detail__action-error">{actionError}</p>
      )}

      <div className="order-detail__actions">
        {order.payment_status === 'pending' &&
          new Date(order.payment_deadline) > new Date() && (
            <button
              type="button"
              className="order-detail__pay"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? 'Переход к оплате...' : 'Оплатить заказ'}
            </button>
          )}

        {canCancel && (
          <button
            type="button"
            className="order-detail__cancel"
            onClick={openConfirm}
            disabled={cancelling || paying}
          >
            {cancelling ? 'Отменяем...' : 'Отменить заказ'}
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Отменить заказ?"
        message="Заказ будет отменён. Восстановить его нельзя."
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
        loading={cancelling}
      />
    </div>
  );
}

export default OrderDetailPage;
