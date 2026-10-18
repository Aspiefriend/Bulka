import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, loading: cartLoading, clearCart } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [address, setAddress] = useState('');
  const [idBakery, setIdBakery] = useState(null);
  const [comment, setComment] = useState('');

  const [bakeries, setBakeries] = useState([]);
  const [bakeriesLoading, setBakeriesLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (deliveryMethod !== 'pickup') return;
    if (bakeries.length > 0) return;

    setBakeriesLoading(true);
    api
      .get('/bakeries')
      .then((res) => {
        setBakeries(res.data);
        if (res.data.length > 0 && !idBakery) {
          setIdBakery(res.data[0].id_bakery);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setBakeriesLoading(false));
  }, [deliveryMethod, bakeries.length, idBakery]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
      };

      if (comment.trim()) {
        payload.comment = comment.trim();
      }

      if (deliveryMethod === 'delivery') {
        payload.address = address.trim();
      } else {
        payload.id_bakery = idBakery;
      }

      const res = await api.post('/orders', payload);
      const id_order = res.data.id_order;

      clearCart();
      navigate(`/orders/${id_order}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <>
        <title>Войдите в профиль — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="checkout">
          <h1 className="checkout__title">Оформление заказа</h1>
          <p className="checkout__message">
            Войдите, чтобы оформить заказ. <Link to="/login">Войти</Link>
          </p>
        </div>
      </>
    );
  }

  if (cartLoading) {
    return (
      <>
        <title>Загрузка... — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="checkout">
          <h1 className="checkout__title">Оформление заказа</h1>
          <p className="checkout__message">Загрузка...</p>
        </div>
      </>
    );
  }

  if (cart.length === 0) {
    return (
      <>
        <title>Корзина пуста — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="checkout">
          <h1 className="checkout__title">Оформление заказа</h1>
          <p className="checkout__message">
            Корзина пуста. <Link to="/catalog">Перейти в каталог</Link>
          </p>
        </div>
      </>
    );
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <title>Оформление заказа — Булка</title>
      <meta name="robots" content="noindex" />
      <div className="checkout">
        <h1 className="checkout__title">Оформление заказа</h1>

        <form className="checkout__form" onSubmit={handleSubmit}>
          {error && <p className="checkout__error">{error}</p>}

          <section className="checkout__section">
            <h2 className="checkout__section-title">Способ получения</h2>
            <div className="checkout__radios">
              <label className="checkout__radio">
                <input
                  type="radio"
                  name="delivery"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <span>Доставка курьером</span>
              </label>
              <label className="checkout__radio">
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <span>Самовывоз из пекарни</span>
              </label>
            </div>

            {deliveryMethod === 'delivery' ? (
              <label className="checkout__field">
                <span>Адрес доставки</span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Новосибирск, ул. Ленина, 5, кв. 10"
                  required
                />
              </label>
            ) : (
              <label className="checkout__field">
                <span>Выберите пекарню</span>
                {bakeriesLoading ? (
                  <p className="checkout__hint">Загрузка пекарен...</p>
                ) : (
                  <select
                    value={idBakery ?? ''}
                    onChange={(e) => setIdBakery(Number(e.target.value))}
                    required
                  >
                    {bakeries.map((b) => (
                      <option key={b.id_bakery} value={b.id_bakery}>
                        {b.name} — {b.address}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            )}
          </section>

          <section className="checkout__section">
            <h2 className="checkout__section-title">Способ оплаты</h2>
            <div className="checkout__radios">
              <label className="checkout__radio">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Картой при получении</span>
              </label>
              <label className="checkout__radio">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Наличными при получении</span>
              </label>
              <label className="checkout__radio">
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Онлайн (карта, СБП)</span>
              </label>
            </div>
          </section>

          <section className="checkout__section">
            <h2 className="checkout__section-title">
              Комментарий (опционально)
            </h2>
            <textarea
              className="checkout__textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Позвоните за 10 минут до приезда"
              rows={3}
            />
          </section>

          <div className="checkout__summary">
            <span>Итого:</span>
            <span className="checkout__total">{total} ₽</span>
          </div>

          <button
            type="submit"
            className="checkout__submit"
            disabled={submitting}
          >
            {submitting ? 'Оформляем...' : 'Оформить заказ'}
          </button>
        </form>
      </div>
    </>
  );
}

export default CheckoutPage;
