import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import './FavoritesPage.css';

function FavoritesPage() {
  const { favorites, loading } = useFavorites();

  if (loading) {
    return (
      <div className="favorites-page">
        <h1 className="favorites-page__title">Избранное</h1>
        <p className="favorites-page__status">Загрузка...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="favorites-page">
        <h1 className="favorites-page__title">Избранное</h1>
        <p className="favorites-page__empty">
          В избранном пока пусто. <Link to="/catalog">Перейти в каталог</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <h1 className="favorites-page__title">Избранное</h1>

      <div className="favorites-page__grid">
        {favorites.map((product) => (
          <ProductCard key={product.id_product} product={product} />
        ))}
      </div>
    </div>
  );
}

export default FavoritesPage;
