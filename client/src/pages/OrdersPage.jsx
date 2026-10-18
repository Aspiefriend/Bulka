import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './OrdersPage.css';

const ACTIVE_STATUSES = ['new', 'accepted', 'cooking', 'delivering'];

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

function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    api
      .get('/orders')
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <>
        <title>Мои закзаы — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="orders">
          <h1 className="orders__title">Мои заказы</h1>
          <p className="orders__message">
            Войдите, чтобы увидеть заказы. <Link to="/login">Войти</Link>
          </p>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <title>Загрузка... — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="orders">
          <h1 className="orders__title">Мои заказы</h1>
          <p className="orders__message">Загрузка...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <title>Ошибка — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="orders">
          <h1 className="orders__title">Мои заказы</h1>
          <p className="orders__message">Ошибка: {error}</p>
        </div>
      </>
    );
  }

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status)
  );
  const currentList = tab === 'active' ? activeOrders : historyOrders;

  return (
    <>
      <title>Мои закзаы — Булка</title>
      <meta name="robots" content="noindex" />
      <div className="orders">
        <h1 className="orders__title">Мои заказы</h1>

        <div className="orders__tabs">
          <button
            type="button"
            className={`orders__tab ${tab === 'active' ? 'orders__tab--active' : ''}`}
            onClick={() => setTab('active')}
          >
            Активные ({activeOrders.length})
          </button>
          <button
            type="button"
            className={`orders__tab ${tab === 'history' ? 'orders__tab--active' : ''}`}
            onClick={() => setTab('history')}
          >
            История ({historyOrders.length})
          </button>
        </div>

        {currentList.length === 0 ? (
          <p className="orders__empty">
            {tab === 'active'
              ? 'Активных заказов нет'
              : 'История заказов пуста'}
          </p>
        ) : (
          <ul className="orders__list">
            {currentList.map((order) => (
              <li
                key={order.id_order}
                className="orders__item"
                onClick={() => navigate(`/orders/${order.id_order}`)}
              >
                <div className="orders__item-header">
                  <span className="orders__number">
                    Заказ №{order.id_order}
                  </span>
                  <span
                    className={`orders__status orders__status--${order.status}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="orders__item-body">
                  <span className="orders__date">
                    {formatDate(order.created_at)}
                  </span>
                  <span className="orders__count">
                    {order.items_count} тов.
                  </span>
                  <span className="orders__total">{order.total} ₽</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default OrdersPage;
