import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState(null);
  const [pendingIds, setPendingIds] = useState(new Set());

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!user) {
      setCart([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    api
      .get('/cart')
      .then((res) => setCart(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  function startPending(id) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function stopPending(id) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function addToCart(id_product) {
    startPending(id_product);
    setError(null);

    try {
      const res = await api.post('/cart', { id_product });
      const newItem = res.data;

      setCart((prev) => {
        const existing = prev.find((item) => item.id_product === id_product);
        if (existing) {
          return prev.map((item) =>
            item.id_product === id_product ? newItem : item
          );
        }
        return [...prev, newItem];
      });
    } catch (err) {
      setError(err.message);
    } finally {
      stopPending(id_product);
    }
  }

  async function updateQuantity(id_product, quantity) {
    startPending(id_product);
    setError(null);

    try {
      const res = await api.patch(`/cart/${id_product}`, { quantity });
      const updatedItem = res.data;

      setCart((prev) =>
        prev.map((item) =>
          item.id_product === id_product ? updatedItem : item
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      stopPending(id_product);
    }
  }

  async function removeFromCart(id_product) {
    startPending(id_product);
    setError(null);

    try {
      await api.delete(`/cart/${id_product}`);
      setCart((prev) => prev.filter((item) => item.id_product !== id_product));
    } catch (err) {
      setError(err.message);
    } finally {
      stopPending(id_product);
    }
  }

  function clearCart() {
    setCart([]);
  }

  function clearError() {
    setError(null);
  }

  const value = {
    cart,
    count,
    loading,
    error,
    pendingIds,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearError,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
