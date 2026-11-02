import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('guest_favorites') || '[]');
    return saved;
  });
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState(null);
  const [pendingIds, setPendingIds] = useState(new Set());

  useEffect(() => {
    const localFavs = JSON.parse(
      localStorage.getItem('guest_favorites') || '[]'
    );

    if (!user) {
      setFavorites(localFavs);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (localFavs.length > 0) {
      const ids = localFavs.map((p) => p.id_product);
      api
        .post('/favorites/merge', { productIds: ids })
        .then((res) => {
          localStorage.removeItem('guest_favorites');
          setFavorites(res.data);
          if (res.warning) {
            setError(res.warning);
          }
        })
        .catch((err) =>
          setError(
            `Не удалось синхронизировать избранное. Ошибка сервера: ${err.message}`
          )
        )
        .finally(() => setLoading(false));
    } else {
      api
        .get('/favorites')
        .then((res) => setFavorites(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user]);

  function startPending(id) {
    setPendingIds((prev) => new Set(prev).add(id));
  }

  function stopPending(id) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function isFavorite(id_product) {
    return favorites.some((item) => item.id_product === id_product);
  }

  async function toggleFavorite(product) {
    const id = product.id_product;
    const alreadyInFavorites = isFavorite(id);
    startPending(id);

    if (!user) {
      let newFavs;
      if (alreadyInFavorites) {
        newFavs = favorites.filter((item) => item.id_product !== id);
      } else {
        newFavs = [...favorites, product];
      }
      setFavorites(newFavs);
      localStorage.setItem('guest_favorites', JSON.stringify(newFavs));
      stopPending(id);
      return;
    }

    setError(null);
    try {
      if (alreadyInFavorites) {
        await api.delete(`/favorites/${id}`);
        setFavorites((prev) => prev.filter((item) => item.id_product !== id));
      } else {
        await api.post(`/favorites/${id}`);
        setFavorites((prev) => [...prev, product]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      stopPending(id);
    }
  }

  function clearError() {
    setError(null);
  }

  const value = {
    favorites,
    loading,
    pendingIds,
    isFavorite,
    toggleFavorite,
    clearError,
    error,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
