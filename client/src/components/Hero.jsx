import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__content">
          <h1 className="hero__title">Утро начинается с Булка</h1>
          <p className="hero__subtitle">
            Свежая выпечка, ароматный кофе и быстрая доставка. Попробуйте наши
            хиты, приготовленные с любовью каждое утро.
          </p>
          <div className="hero__actions">
            <Link to="/catalog" className="hero__btn hero__btn--primary">
              Выбрать выпечку
              <ArrowRight size={18} />
            </Link>
            <Link to="/bakeries" className="hero__btn hero__btn--secondary">
              Наши пекарни
            </Link>
          </div>
        </div>

        <div className="hero__image-wrapper">
          <div className="hero__image-placeholder">
            <img src="/images/hero-bg.jpg" alt="Свежий круассан" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
