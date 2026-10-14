import { useCart } from '../context/CartContext';
import './CartErrorBanner.css';
import { X } from 'lucide-react';

function CartErrorBanner() {
  const { error, clearError } = useCart();

  if (!error) return null;

  return (
    <div className="cart-error-banner">
      <span className="cart-error-banner__text">{error}</span>
      <button
        type="button"
        className="cart-error-banner__close"
        onClick={clearError}
        aria-label="Закрыть"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default CartErrorBanner;
