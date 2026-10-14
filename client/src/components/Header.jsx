import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Header.css';

function Header() {
  const { user, loading, logout } = useAuth();
  const { count } = useCart();

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo">
          Булка
        </Link>

        <nav className="header__nav">
          <Link to="/">Главная</Link>
          <Link to="/catalog">Каталог</Link>
        </nav>

        <div className="header__actions">
          <Link to="/cart" className="header__cart">
            <ShoppingCart size={22} />
            {count > 0 && <span className="header__cart-badge">{count}</span>}
          </Link>

          {loading ? (
            <span className="header__placeholder" />
          ) : user ? (
            <>
              <Link to="/profile" className="header__user">
                {user.name}
              </Link>
              <button onClick={logout} className="header__login">
                Выйти
              </button>
            </>
          ) : (
            <Link to="/login" className="header__login">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
