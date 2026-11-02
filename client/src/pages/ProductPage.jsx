import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus, Star, Heart } from 'lucide-react';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import './ProductPage.css';

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
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState(null);

  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [displayLimit, setDisplayLimit] = useState(5);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const {
    cart,
    loading: cartLoading,
    pendingIds,
    addToCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const {
    loading: favLoading,
    isFavorite,
    toggleFavorite,
    pendingIds: favPendingIds,
  } = useFavorites();

  const favorite = isFavorite(product?.id_product);
  const isFavPending = favPendingIds.has(product?.id_product);

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

  useEffect(() => {
    api
      .get(`/reviews/${id}`)
      .then((res) => setReviews(res.data))
      .catch((err) => {
        console.error(err);
        setReviewsError('Не удалось загрузить отзывы');
      });
  }, [id]);

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

  async function handleSubmitReview(e) {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError(null);

    try {
      await api.post('/reviews', {
        productId: Number(id),
        rating: Number(rating),
        text: reviewText.trim(),
      });

      const res = await api.get(`/reviews/${id}`);
      setReviews(res.data);

      setReviewText('');
      setRating(5);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  let displayReviews =
    filterRating === 0
      ? reviews
      : reviews.filter((r) => r.rating === filterRating);

  displayReviews = [...displayReviews].sort((a, b) => {
    return sortBy === 'newest'
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at);
  });

  const visibleReviews = displayReviews.slice(0, displayLimit);

  if (loading) return <p className="product__status">Загрузка...</p>;
  if (error) return <p className="product__status">Ошибка: {error}</p>;

  return (
    <div className="product-page">
      <Link to="/catalog" className="product-page__back">
        <ArrowLeft size={16} />
        Назад к каталогу
      </Link>

      <div className="product">
        <div className="product__image">
          <img src={product.icon} alt={product.name} />
        </div>
        <div className="product__info">
          <div className="product__title-row">
            <h1 className="product__name">{product.name}</h1>

            <button
              type="button"
              className={`product__favorite-btn ${favorite ? 'active' : ''}`}
              onClick={() => toggleFavorite(product)}
              disabled={isFavPending || favLoading}
              aria-label="Добавить в избранное"
            >
              <Heart
                size={28}
                fill={favorite ? '#c0392b' : 'none'}
                color={favorite ? '#c0392b' : 'var(--color-text-muted)'}
              />
            </button>
          </div>

          <p className="product__description">{product.full_description}</p>
          <span className="product__category">{product.category_name}</span>
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

      <section className="product-reviews">
        <h2 className="product-reviews__title">
          Отзывы <span>({reviews.length})</span>
        </h2>

        {reviewsError && (
          <p className="product-reviews__error">{reviewsError}</p>
        )}

        {reviews.length > 0 && (
          <div className="product-reviews__toolbar">
            <div className="product-reviews__filters">
              <button
                type="button"
                onClick={() => {
                  setFilterRating(0);
                  setDisplayLimit(5);
                }}
                className={filterRating === 0 ? 'active' : ''}
              >
                Все
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => {
                    setFilterRating(star);
                    setDisplayLimit(5);
                  }}
                  className={filterRating === star ? 'active' : ''}
                >
                  {star} <Star size={14} fill="#fbbf24" color="#fbbf24" />
                </button>
              ))}
            </div>

            <select
              className="product-reviews__sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
            </select>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="product-reviews__empty">
            Пока нет отзывов. Будьте первым!
          </p>
        ) : visibleReviews.length === 0 ? (
          <p className="product-reviews__empty">
            Нет отзывов с таким рейтингом.
          </p>
        ) : (
          <ul className="product-reviews__list">
            {visibleReviews.map((review) => (
              <li key={review.id_review} className="product-reviews__item">
                <div className="product-reviews__header">
                  <div className="product-reviews__author">
                    <strong>{review.user_name}</strong>
                    <span className="product-reviews__date">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className="product-reviews__stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= review.rating ? '#fbbf24' : 'none'}
                        color={star <= review.rating ? '#fbbf24' : '#e5e5e0'}
                      />
                    ))}
                  </div>
                </div>
                <p className="product-reviews__text">{review.text}</p>
              </li>
            ))}
          </ul>
        )}

        {displayReviews.length > displayLimit && (
          <button
            type="button"
            className="product-reviews__more-btn"
            onClick={() => setDisplayLimit((prev) => prev + 5)}
          >
            Показать еще
          </button>
        )}

        {user && (
          <form className="product-reviews__form" onSubmit={handleSubmitReview}>
            <h3 className="product-reviews__form-title">Оставить отзыв</h3>

            {reviewError && (
              <p className="product-reviews__error">{reviewError}</p>
            )}

            <div className="product-reviews__rating-select">
              <span>Оценка:</span>
              <div className="product-reviews__rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="product-reviews__star-btn"
                  >
                    <Star
                      size={24}
                      fill={star <= rating ? '#fbbf24' : 'none'}
                      color={star <= rating ? '#fbbf24' : '#ccc'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="product-reviews__textarea"
              placeholder="Поделитесь впечатлениями о товаре..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              required
            />

            <button
              type="submit"
              className="product-reviews__submit"
              disabled={submittingReview || !reviewText.trim()}
            >
              {submittingReview ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default ProductPage;
