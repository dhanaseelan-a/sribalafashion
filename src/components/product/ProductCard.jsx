import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

function ProductCard({ product }) {
    const getCategoryBadge = (category) => {
        const badges = {
            'Bangles': 'badge-gold',
            'Garlands': 'badge-maroon',
            'Accessories': 'badge-teal',
        };
        return badges[category] || 'badge-gold';
    };

    const discount = product.discountPercent || 0;
    const hasSizes = product.sizeVariants && product.sizeVariants.length > 0;
    const basePrice = hasSizes
        ? Math.min(...product.sizeVariants.map(v => v.price))
        : product.price;
    const discountedPrice = discount > 0
        ? Math.round(basePrice * (1 - discount / 100))
        : basePrice;

    return (
        <div className="product-card">
            <div className="product-card-image">
                <span className={`badge ${getCategoryBadge(product.category)}`}>
                    {product.category}
                </span>
                {discount > 0 && (
                    <span className="discount-badge">
                        {discount}% OFF
                    </span>
                )}
                <img
                    src={product.imageUrl || `https://placehold.co/400x280/6B0F2A/D4A843?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                />
            </div>
            <div className="product-card-body">
                <h3>{product.name}</h3>
                <div className="product-card-footer">
                    <div className="price-group">
                        {discount > 0 && (
                            <span className="price-original">₹{basePrice.toLocaleString('en-IN')}</span>
                        )}
                        <span className="product-price">{hasSizes ? 'From ' : ''}₹{discountedPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <Link to={`/product/${product.id}`} className="btn btn-primary btn-sm">
                        View <FiArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
