import {Link} from 'react-router-dom'
import './ProductCard.css';


function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id_product}`} className="product-card">
      <div className="product-card__image">
        {product.icon ? (
          <img src={product.icon} alt={product.name} />
        ) : (
          <div className="product-card__placeholder" />
        )}
      </div>

      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__footer">
          <span className="product-card__price">{product.price} ₽</span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard