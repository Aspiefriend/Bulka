import { Link } from 'react-router-dom';
import './Hero.css';

function Hero() {
    return (
        <section className="hero">
            <div className="hero__content">
                <h1 className="hero__title">
                    Свежая выпечка с доставкой

                </h1>
                <p className="hero__subtitle">
                    Печём каждое утро, привозим за 60 минут
                </p>
                <Link to="/catalog" className="hero__button">
                    Смотреть каталог
                </Link>


            </div>


        </section>


    )
}

export default Hero