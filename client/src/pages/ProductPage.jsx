import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import './ProductPage.css';

function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    cart,
    loading: cartLoading,
    pendingIds,
    addToCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const cartItem = cart.find((item) => item.id_product === product?.id_product);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isPending = pendingIds.has(product?.id_product);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAdd() {
    addToCart(product.id_product);
  }

  function handleIncrease() {
    updateQuantity(product.id_product, quantity + 1);
  }

  function handleDecrease() {
    if (quantity <= 1) {
      removeFromCart(product.id_product);
    } else {
      updateQuantity(product.id_product, quantity - 1);
    }
  }

  if (loading) {
    return (
      <div className="product-page">
        <h1 className="product-page__status-title">Загрузка товара...</h1>
      </div>
    );
  }
  if (error) {
    return (
      <div className="product-page">
        <h1>Ошибка загрузки</h1>
        <p>{error}</p>
        <Link to="/catalog">Вернуться в каталог</Link>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="product-page">
        <h1>Товар не найден</h1>
        <p>Такого товара нет или он был удалён.</p>
        <Link to="/catalog">Вернуться в каталог</Link>
      </div>
    );
  }

  return (
    <div className="product-page">
      <Link to="/catalog" className="product-page__back">
        <ArrowLeft size={16} />
        Назад к каталогу
      </Link>

      <div className="product">
        <div className="product__image">{/* картинка или заглушка */}</div>
        <div className="product__info">
          <h1 className="product__name">{product.name}</h1>
          <p className="product__description">{product.full_description}</p>
          <Link
            to={`/catalog?category=${product.id_category}`}
            className="product__category"
          >
            {product.category_name}
          </Link>
          <div className="product__price">{product.price} ₽</div>

          {quantity === 0 ? (
            <button
              type="button"
              className="product__button"
              onClick={handleAdd}
              disabled={cartLoading || isPending}
            >
              В корзину
            </button>
          ) : (
            <div className="product__counter">
              <button
                type="button"
                className="product__counter-btn"
                onClick={handleDecrease}
                disabled={cartLoading || isPending}
                aria-label="Уменьшить количество"
              >
                <Minus size={20} />
              </button>
              <span className="product__counter-value">{quantity}</span>
              <button
                type="button"
                className="product__counter-btn"
                onClick={handleIncrease}
                disabled={cartLoading || isPending}
                aria-label="Увеличить количество"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
