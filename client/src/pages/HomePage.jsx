import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { api } from '../api/client';
import './HomePage.css';
import CategoryCard from '../components/CategoryCard'
import Hero from '../components/Hero'
function HomePage() {
    const [hits, setHits] = useState([]);
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/products/hits'),
            api.get('/categories')
        ]).then(([hits, categories]) => {
            setHits(hits.data);
            setCategories(categories.data);
            setLoading(false);
        }).catch((err) => {
            setError(err.message);
            setLoading(false)
        });
    }, []);

    if (loading) return <p className="home__status">Загрузка...</p>;
    if (error) return <p className="home__status">Ошибка: {error}</p>;

    return (
        <div className="home">
            <Hero>

            </Hero>
            <p className="home__lead">Свежая выпечка с доставкой</p>

            <section className="home__section">
                <h2>Категории</h2>
                <div className="home__categories">
                    {categories.map((category) => (
                        <CategoryCard key={category.id_category} category={category} />


                    )
                    )}
                </div>
            </section>

            <section className="home__section">
                <h2>Хиты</h2>
                <div className="home__grid">
                    {hits.map((product) => (
                        <ProductCard key={product.id_product} product={product} />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default HomePage;