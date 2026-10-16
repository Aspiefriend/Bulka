import { useSearchParams } from 'react-router-dom';
import CategoryCard from '../components/CategoryCard';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import './CatalogPage.css';
function CatalogPage() {
  const [searchParams] = useSearchParams();
  const categoryid = searchParams.get('category');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    const url = categoryid ? `/products?category=${categoryid}` : '/products';
    api
      .get(url)
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [categoryid]);

  if (loading) {
    return (
      <>
        <title>Загрузка... — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="catalog">
          <h1 className="catalog__title">Каталог</h1>
          <p className="catalog__status">Загрузка каталога...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <title>Ошибка — Булка</title>
        <meta name="robots" content="noindex" />
        <div className="catalog">
          <h1 className="catalog__title">Каталог</h1>
          <p className="catalog__status"> Ошибка: {error}</p>
        </div>
      </>
    );
  }

  const activeCategoryName = categories.find(
    (category) => category.id_category === Number(categoryid)
  );

  return (
    <>
      <title>Каталог — Булка</title>
      <div className="catalog">
        <h1 className="catalog__title">Каталог</h1>
        <section className="catalog__section">
          <h2>Категории</h2>
          <div className="catalog__categories">
            <Link
              to="/catalog"
              className={`category-card ${!categoryid ? 'category-card--active' : ''}`}
            >
              <div className="category-card__icon">
                <LayoutGrid size={28} strokeWidth={1.5}></LayoutGrid>
              </div>
              <span className="category-card__name">Все</span>
            </Link>
            {categories.map((category) => (
              <CategoryCard
                key={category.id_category}
                category={category}
                isActive={category.id_category === Number(categoryid)}
              />
            ))}
          </div>
        </section>

        <section className="catalog__section">
          <h2>{activeCategoryName?.name || 'Все товары'}</h2>
          <div className="catalog__products">
            {products.map((product) => (
              <ProductCard key={product.id_product} product={product} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default CatalogPage;
