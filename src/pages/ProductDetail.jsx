import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiArrowLeft, FiShoppingCart, FiAlertCircle } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

function ProductDetail() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);
    const { addToCart, cartItems } = useCart();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`/api/products/${id}`);
                setProduct(response.data);
                // Auto-select first size if product has size variants
                if (response.data.sizeVariants && response.data.sizeVariants.length > 0) {
                    setSelectedSize(response.data.sizeVariants[0].sizeLabel);
                }
            } catch (error) {
                setProduct({
                    id: parseInt(id),
                    name: 'Demo Covering Bangle',
                    category: 'Bangles',
                    price: 1000,
                    stock: 10,
                    discountPercent: 0,
                    description: 'This is a beautifully handcrafted covering (imitation) piece made with premium materials.',
                    imageUrl: '',
                    sizeVariants: []
                });
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // Determine the active price based on selected size
    const hasSizes = product?.sizeVariants && product.sizeVariants.length > 0;
    const activePrice = hasSizes && selectedSize
        ? (product.sizeVariants.find(v => v.sizeLabel === selectedSize)?.price || product.price)
        : product?.price;

    // Check how many already in cart (use composite key for sized items)
    const cartKey = hasSizes ? `${product?.id}-${selectedSize}` : `${product?.id}`;
    const inCartQty = cartItems.find(item => item.cartKey === cartKey)?.quantity || 0;
    const outOfStock = product?.stock != null && product.stock <= 0;
    const cartFull = product?.stock != null && inCartQty >= product.stock;

    const handleAddToCart = () => {
        if (outOfStock || cartFull) return;
        if (hasSizes && !selectedSize) {
            alert('Please select a size');
            return;
        }
        addToCart({
            ...product,
            price: activePrice,
            selectedSize: selectedSize || null
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <span className="loading-text">Loading product details...</span>
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <h2>Product not found</h2>
                <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Shop</Link>
            </div>
        );
    }

    const getCategoryBadge = (category) => {
        const badges = { 'Bangles': 'badge-gold', 'Garlands': 'badge-maroon', 'Accessories': 'badge-teal' };
        return badges[category] || 'badge-gold';
    };

    const discount = product.discountPercent || 0;
    const discountedPrice = discount > 0
        ? Math.round(activePrice * (1 - discount / 100))
        : activePrice;

    return (
        <div className="product-detail">
            <div className="product-detail-image">
                <img
                    src={product.imageUrl || `https://placehold.co/600x450/6B0F2A/D4A843?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                />
            </div>
            <div className="product-detail-info">
                <Link to="/shop" className="back-link">
                    <FiArrowLeft /> Back to Shop
                </Link>
                <h1 style={{ fontSize: '2.25rem' }}>{product.name}</h1>
                <span className={`badge ${getCategoryBadge(product.category)}`} style={{ alignSelf: 'flex-start' }}>
                    {product.category}
                </span>

                {discount > 0 && (
                    <span className="detail-discount-badge" style={{ alignSelf: 'flex-start' }}>
                        🔥 {discount}% OFF
                    </span>
                )}

                {/* Size Selector */}
                {hasSizes && (
                    <div className="size-selector">
                        <h4 className="size-selector-title">Select Size</h4>
                        <div className="size-pills">
                            {product.sizeVariants.map(variant => (
                                <button
                                    key={variant.sizeLabel}
                                    className={`size-pill ${selectedSize === variant.sizeLabel ? 'active' : ''}`}
                                    onClick={() => setSelectedSize(variant.sizeLabel)}
                                    type="button"
                                >
                                    {variant.sizeLabel}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    {discount > 0 && (
                        <div className="detail-price-original">₹{activePrice?.toLocaleString('en-IN')}</div>
                    )}
                    <div className="detail-price">₹{discountedPrice?.toLocaleString('en-IN')}</div>
                </div>

                {product.stock != null && (
                    <p style={{
                        fontSize: '0.9rem',
                        color: product.stock > 0 ? 'var(--clr-success)' : 'var(--clr-danger)',
                        fontWeight: 600
                    }}>
                        {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✕ Out of Stock'}
                    </p>
                )}

                <p className="detail-description">{product.description}</p>

                {inCartQty > 0 && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--clr-gold-dark)', fontWeight: 600 }}>
                        🛒 {inCartQty} already in cart{selectedSize ? ` (Size: ${selectedSize})` : ''}
                    </p>
                )}

                <button
                    onClick={handleAddToCart}
                    className={`btn ${added ? 'btn-secondary' : 'btn-primary'} btn-lg`}
                    style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                    disabled={outOfStock || cartFull}
                >
                    <FiShoppingCart />
                    {outOfStock ? 'Out of Stock' : cartFull ? 'Max Stock in Cart' : added ? '✓ Added to Cart!' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
}

export default ProductDetail;
