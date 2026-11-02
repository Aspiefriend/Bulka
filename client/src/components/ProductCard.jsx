import { Link } from 'react-router-dom';
import { Heart, Minus, Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import './ProductCard.css';

function ProductCard({ product }) {
  const {
    cart,
    loading: cartLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    pendingIds,
  } = useCart();

  const {
    isFavorite,
    toggleFavorite,
    pendingIds: favPendingIds,
  } = useFavorites();

  const isPending = pendingIds.has(product.id_product);
  const isPendingFav = favPendingIds.has(product.id_product);

  const favorite = isFavorite(product.id_product);

  const cartItem = cart.find((item) => item.id_product === product.id_product);
  const quantity = cartItem ? cartItem.quantity : 0;

  function handleAdd() {
    addToCart(product.id_product, product);
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

  return (
    <div className="product-card">
      <div className="product-card__image">
        <Link
          to={`/product/${product.id_product}`}
          className="product-card__image-link"
        >
          {product.icon ? (
            <img src={product.icon} alt={product.name} />
          ) : (
            <div className="product-card__placeholder" />
          )}
        </Link>

        <button
          type="button"
          className={`product-card__fav-btn ${favorite ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product);
          }}
          disabled={isPendingFav}
          aria-label="Добавить в избранное"
        >
          <Heart
            size={20}
            fill={favorite ? '#c0392b' : 'none'}
            color={favorite ? '#c0392b' : '#fff'}
          />
        </button>
      </div>

      <Link
        to={`/product/${product.id_product}`}
        className="product-card__link"
      >
        <div className="product-card__body">
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__description">{product.description}</p>
        </div>
      </Link>

      <div className="product-card__footer">
        <span className="product-card__price">{product.price} ₽</span>

        {quantity === 0 ? (
          <button
            type="button"
            className="product-card__add"
            onClick={handleAdd}
            disabled={cartLoading || isPending}
          >
            В корзину
          </button>
        ) : (
          <div className="product-card__counter">
            <button
              type="button"
              className="product-card__counter-btn"
              onClick={handleDecrease}
              disabled={cartLoading || isPending}
              aria-label="Уменьшить количество"
            >
              <Minus size={16} />
            </button>
            <span className="product-card__counter-value">{quantity}</span>
            <button
              type="button"
              className="product-card__counter-btn"
              onClick={handleIncrease}
              disabled={cartLoading || isPending}
              aria-label="Увеличить количество"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
