import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './CartPage.css';

function CartPage() {
  const { user } = useAuth();
  const { cart, loading, pendingIds, updateQuantity, removeFromCart } =
    useCart();

  const totalSum = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function handleIncrease(id_product, quantity) {
    updateQuantity(id_product, quantity + 1);
  }

  function handleDecrease(id_product, quantity) {
    updateQuantity(id_product, quantity - 1);
  }

  function handleRemove(id_product) {
    removeFromCart(id_product);
  }

  if (!user) {
    return (
      <div className="cart-page">
        <h1 className="cart-page__title">Корзина</h1>
        <p className="cart-page__empty">
          Войдите, чтобы увидеть корзину. <Link to="/login">Войти</Link>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-page">
        <h1 className="cart-page__title">Корзина</h1>
        <p className="cart-page__status">Загрузка...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="cart-page__title">Корзина</h1>
        <p className="cart-page__empty">
          Корзина пуста. <Link to="/catalog">Перейти в каталог</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-page__title">Корзина</h1>

      <ul className="cart-page__list">
        {cart.map((item) => {
          const isPending = pendingIds.has(item.id_product);
          const lineTotal = item.price * item.quantity;

          return (
            <li key={item.id_product} className="cart-page__item">
              <Link
                to={`/product/${item.id_product}`}
                className="cart-page__image"
              >
                {item.icon ? (
                  <img src={item.icon} alt={item.name} />
                ) : (
                  <div className="cart-page__placeholder" />
                )}
              </Link>

              <Link
                to={`/product/${item.id_product}`}
                className="cart-page__name"
              >
                {item.name}
              </Link>

              <span className="cart-page__unit-price">{item.price} ₽</span>

              <div className="cart-page__counter">
                <button
                  type="button"
                  className="cart-page__counter-btn"
                  onClick={() => handleDecrease(item.id_product, item.quantity)}
                  disabled={isPending || item.quantity <= 1}
                  aria-label="Уменьшить количество"
                >
                  <Minus size={16} />
                </button>
                <span className="cart-page__counter-value">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  className="cart-page__counter-btn"
                  onClick={() => handleIncrease(item.id_product, item.quantity)}
                  disabled={isPending}
                  aria-label="Увеличить количество"
                >
                  <Plus size={16} />
                </button>
              </div>

              <span className="cart-page__line-total">{lineTotal} ₽</span>

              <button
                type="button"
                className="cart-page__remove"
                onClick={() => handleRemove(item.id_product)}
                disabled={isPending}
                aria-label="Удалить товар"
              >
                <X size={18} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cart-page__summary">
        <div className="cart-page__total">
          <span>Итого:</span>
          <span className="cart-page__total-sum">{totalSum} ₽</span>
        </div>
        <Link to="/checkout" className="cart-page__checkout">
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}

export default CartPage;
