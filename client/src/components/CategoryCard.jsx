import { Link } from 'react-router-dom';
import * as icons from 'lucide-react';
import './CategoryCard.css';

function getIcon(name) {
    if (!name) {
        return icons.Package;
    }

    const pascal = name
        .split('-')
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join('');

    return icons[pascal] || icons.Package;
}

function CategoryCard({ category }) {
    const Icon = getIcon(category.icon);

    return (
        <Link
            to={`/catalog?category=${category.id_category}`}
            className="category-card"
        >
            <div className="category-card__icon">
                <Icon size={28} strokeWidth={1.5} />
            </div>
            <span className="category-card__name">{category.name}</span>
        </Link>
    );
}

export default CategoryCard;

