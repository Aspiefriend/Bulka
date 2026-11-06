import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();

  const [cart, setCart] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    return saved;
  });
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState(null);
  const [pendingIds, setPendingIds] = useState(new Set());

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');

    if (!user) {
      setCart(guestCart);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (guestCart.length > 0) {
      const itemsToMerge = guestCart.map((item) => ({
        id_product: item.id_product,
        quantity: item.quantity,
      }));

      api
        .post('/cart/merge', { items: itemsToMerge })
        .then((res) => {
          localStorage.removeItem('guest_cart');
          setCart(res.data);
          if (res.warning) {
            setError(res.warning);
          }
        })
        .catch((err) => {
          setError(
            `Не удалось синхронизировать корзину. Ошибка сервера: ${err.message}`
          );
        })
        .finally(() => setLoading(false));
    } else {
      api
        .get('/cart')
        .then((res) => setCart(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }

    setLoading(false);
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

  async function addToCart(id_product, productData) {
    if (!user) {
      setCart((prev) => {
        const existing = prev.find((item) => item.id_product === id_product);
        let newCart;
        if (existing) {
          newCart = prev.map((item) =>
            item.id_product === id_product
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          newCart = [...prev, { ...productData, quantity: 1 }];
        }
        localStorage.setItem('guest_cart', JSON.stringify(newCart));
        return newCart;
      });
      return;
    }

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
    if (!user) {
      setCart((prev) => {
        const newCart = prev.map((item) =>
          item.id_product === id_product ? { ...item, quantity } : item
        );
        localStorage.setItem('guest_cart', JSON.stringify(newCart));
        return newCart;
      });
      return;
    }
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
    if (!user) {
      setCart((prev) => {
        const newCart = prev.filter((item) => item.id_product !== id_product);
        localStorage.setItem('guest_cart', JSON.stringify(newCart));
        return newCart;
      });
      return;
    }
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
