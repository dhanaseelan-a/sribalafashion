import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingBag, FiTrash2, FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Cart() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    if (cartItems.length === 0) {
        return (
            <div className="cart-empty">
                <div className="cart-empty-icon">
                    <FiShoppingBag />
                </div>
                <h2>Your Cart is Empty</h2>
                <p style={{ color: 'var(--clr-gray-500)', marginBottom: '2rem' }}>
                    Looks like you haven't added anything yet. Start exploring our collection!
                </p>
                <Link to="/shop" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
                    <FiArrowRight /> Start Shopping
                </Link>
            </div>
        );
    }

    const handleCheckout = () => {
        if (!user) {
            navigate('/login');
        } else {
            navigate('/checkout');
        }
    };

    return (
        <div className="cart-page">
            <h2>Shopping Cart</h2>

            {/* Desktop Table */}
            <table className="styled-table cart-desktop-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {cartItems.map(item => {
                        const displayPrice = item.finalPrice != null ? item.finalPrice : item.price;
                        const hasDiscount = item.discountPercent > 0 && item.originalPrice;
                        const atMaxStock = item.stock != null && item.quantity >= item.stock;

                        return (
                            <tr key={item.cartKey}>
                                <td style={{ fontWeight: 600 }}>{item.name}{item.selectedSize ? <span style={{ color: 'var(--clr-gold-dark)', fontSize: '0.85rem', marginLeft: '0.4rem' }}>(Size: {item.selectedSize})</span> : ''}</td>
                                <td>
                                    {hasDiscount && (
                                        <span style={{ textDecoration: 'line-through', color: 'var(--clr-gray-400)', fontSize: '0.85rem', marginRight: '0.5rem' }}>
                                            ₹{item.originalPrice.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                    <span className="product-price">₹{displayPrice.toLocaleString('en-IN')}</span>
                                    {hasDiscount && (
                                        <span style={{ color: 'var(--clr-danger)', fontSize: '0.8rem', marginLeft: '0.4rem', fontWeight: 600 }}>
                                            {item.discountPercent}% off
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div className="quantity-control">
                                        <button
                                            className="quantity-btn"
                                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <FiMinus />
                                        </button>
                                        <span className="quantity-display">{item.quantity}</span>
                                        <button
                                            className="quantity-btn"
                                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                                            disabled={atMaxStock}
                                            title={atMaxStock ? `Max stock: ${item.stock}` : ''}
                                        >
                                            <FiPlus />
                                        </button>
                                    </div>
                                    {atMaxStock && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)', display: 'block', marginTop: '0.25rem' }}>
                                            Max stock reached
                                        </span>
                                    )}
                                </td>
                                <td style={{ fontWeight: 700 }}>₹{(displayPrice * item.quantity).toLocaleString('en-IN')}</td>
                                <td>
                                    <button
                                        onClick={() => removeFromCart(item.cartKey)}
                                        className="remove-btn"
                                    >
                                        <FiTrash2 /> Remove
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Mobile Card Layout */}
            <div className="cart-mobile-cards">
                {cartItems.map(item => {
                    const displayPrice = item.finalPrice != null ? item.finalPrice : item.price;
                    const hasDiscount = item.discountPercent > 0 && item.originalPrice;
                    const atMaxStock = item.stock != null && item.quantity >= item.stock;

                    return (
                        <div className="cart-mobile-card glass-card" key={item.cartKey}>
                            <div className="cart-mobile-card-top">
                                <div className="cart-mobile-card-name">{item.name}{item.selectedSize ? <span style={{ fontSize: '0.8rem', color: 'var(--clr-gold-dark)' }}> (Size: {item.selectedSize})</span> : ''}</div>
                                <button
                                    onClick={() => removeFromCart(item.cartKey)}
                                    className="cart-mobile-remove"
                                    title="Remove"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>

                            <div className="cart-mobile-card-price">
                                {hasDiscount && (
                                    <span className="cart-mobile-original">
                                        ₹{item.originalPrice.toLocaleString('en-IN')}
                                    </span>
                                )}
                                <span className="cart-mobile-final">₹{displayPrice.toLocaleString('en-IN')}</span>
                                {hasDiscount && (
                                    <span className="cart-mobile-discount">{item.discountPercent}% off</span>
                                )}
                            </div>

                            <div className="cart-mobile-card-bottom">
                                <div className="quantity-control">
                                    <button
                                        className="quantity-btn"
                                        onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                    >
                                        <FiMinus />
                                    </button>
                                    <span className="quantity-display">{item.quantity}</span>
                                    <button
                                        className="quantity-btn"
                                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                                        disabled={atMaxStock}
                                    >
                                        <FiPlus />
                                    </button>
                                </div>
                                <div className="cart-mobile-line-total">
                                    ₹{(displayPrice * item.quantity).toLocaleString('en-IN')}
                                </div>
                            </div>
                            {atMaxStock && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)', marginTop: '0.25rem', display: 'block' }}>
                                    Max stock reached
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="cart-summary glass-card">
                <button onClick={clearCart} className="clear-cart-btn">
                    <FiTrash2 /> Clear Cart
                </button>
                <div className="cart-summary-total">
                    <h3>Total: ₹{cartTotal.toLocaleString('en-IN')}</h3>
                    <button className="btn btn-primary btn-lg" onClick={handleCheckout}>
                        <FiArrowRight /> Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Cart;
