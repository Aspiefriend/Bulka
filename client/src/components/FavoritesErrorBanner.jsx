import { useFavorites } from '../context/FavoritesContext';
import './FavoritesErrorBanner.css';
import { X } from 'lucide-react';

function FavoritesErrorBanner() {
  const { error, clearError } = useFavorites();

  if (!error) return null;

  return (
    <div className="favorites-error-banner">
      <span className="favorites-error-banner__text">{error}</span>
      <button
        className="favorites-error-banner__close"
        type="button"
        onClick={clearError}
        aria-label="Закрыть"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default FavoritesErrorBanner;
