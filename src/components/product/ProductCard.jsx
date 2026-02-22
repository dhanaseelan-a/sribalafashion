import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

function ProductCard({ product }) {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

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

    const fallbackSrc = `https://placehold.co/400x280/6B0F2A/D4A843?text=${encodeURIComponent(product.name)}`;
    const imageSrc = imgError ? fallbackSrc : (product.imageUrl || fallbackSrc);

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
                {!imgLoaded && (
                    <div className="img-skeleton" style={{
                        width: '100%', aspectRatio: '10/7',
                        background: 'linear-gradient(110deg, #f0e6d6 30%, #f5efe5 50%, #f0e6d6 70%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                        borderRadius: '8px 8px 0 0'
                    }} />
                )}
                <img
                    src={imageSrc}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={280}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                    style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
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
