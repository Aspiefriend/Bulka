import { useParams } from 'react-router-dom';

function ProductPage() {
  const { id } = useParams();

  return (
    <div>
      <h1>Товар #{id}</h1>
      <p>Здесь будет информация о товаре</p>
    </div>
  );
}

export default ProductPage;