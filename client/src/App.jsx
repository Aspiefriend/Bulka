import { useEffect, useState } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/products/hits')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;
  if (error) return <div style={{ padding: 20 }}>Ошибка: {error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Хиты</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id_product}>
            {p.name} — {p.price} ₽ (продано: {p.sales_count})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
