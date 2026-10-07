import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
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
          <button className="header__login">Войти</button>
        </div>
      </div>
    </header>
  );
}

export default Header;