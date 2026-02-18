import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { FiMapPin, FiPhone, FiUser, FiCreditCard, FiShoppingBag, FiArrowLeft, FiCheck, FiCopy } from 'react-icons/fi';

function Checkout() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { user, token } = useAuth();
    const { notifyDataChange } = useDataSync();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        customerName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    });
    const [transactionId, setTransactionId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [upiId, setUpiId] = useState('dhanaseelan.a12345-3@okicici');

    // Fetch UPI ID from backend (admin-editable)
    useEffect(() => {
        axios.get('/api/content/home')
            .then(res => {
                if (res.data?.upiId) setUpiId(res.data.upiId);
            })
            .catch(() => { });
    }, []);

    if (!user) {
        return (
            <div className="checkout-page">
                <div className="checkout-login-prompt glass-card">
                    <FiUser style={{ fontSize: '2.5rem', color: 'var(--clr-gold)' }} />
                    <h2>Login Required</h2>
                    <p>Please login to proceed with checkout.</p>
                    <Link to="/login" className="btn btn-primary btn-lg">Login to Continue</Link>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="checkout-page">
                <div className="checkout-login-prompt glass-card">
                    <FiShoppingBag style={{ fontSize: '2.5rem', color: 'var(--clr-gold)' }} />
                    <h2>Your Cart is Empty</h2>
                    <p>Add some products before checking out.</p>
                    <Link to="/shop" className="btn btn-primary btn-lg">Browse Shop</Link>
                </div>
            </div>
        );
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const upiPaymentUrl = `upi://pay?pa=${upiId}&pn=Sri%20Bala%20Fashion&am=${cartTotal}&cu=INR&tn=Order%20Payment`;

    const handleCopyUPI = () => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.customerName || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
            setError('Please fill in all fields.');
            return;
        }
        if (!/^\d{10}$/.test(form.phone)) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }
        if (!/^\d{6}$/.test(form.pincode)) {
            setError('Please enter a valid 6-digit pincode.');
            return;
        }
        if (!transactionId.trim()) {
            setError('Please enter your UPI Transaction ID after completing payment.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                transactionId: transactionId.trim(),
                items: cartItems.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    selectedSize: item.selectedSize || null
                }))
            };

            const res = await axios.post('/api/orders', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            clearCart();
            notifyDataChange('orders');
            notifyDataChange('products');
            navigate('/order-success', { state: { order: res.data } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        }
        setLoading(false);
    };

    const savings = cartItems.reduce((sum, item) => {
        if (item.discountPercent > 0 && item.originalPrice) {
            return sum + ((item.originalPrice - (item.finalPrice || item.price)) * item.quantity);
        }
        return sum;
    }, 0);

    return (
        <div className="checkout-page">
            {loading && (
                <div className="order-loading-overlay">
                    <div className="order-loading-content">
                        <div className="order-loading-spinner"></div>
                        <div className="order-loading-dot">✦</div>
                        <h2>Processing Your Order...</h2>
                        <p>Please wait while we confirm your order. Do not close this page.</p>
                    </div>
                </div>
            )}

            <div className="checkout-breadcrumb">
                <Link to="/cart" className="checkout-back-link">
                    <FiArrowLeft /> Back to Cart
                </Link>
                <h1><FiCreditCard /> Checkout</h1>
            </div>

            <form onSubmit={handleSubmit} className="checkout-grid">
                <div className="checkout-shipping glass-card">
                    <h2><FiMapPin /> Shipping Information</h2>
                    <p className="checkout-section-subtitle">We deliver across India. Please provide accurate details.</p>

                    <div className="checkout-form-grid">
                        <div className="form-group checkout-full">
                            <label><FiUser /> Full Name *</label>
                            <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Enter your full name" required />
                        </div>
                        <div className="form-group checkout-full">
                            <label><FiPhone /> Phone Number *</label>
                            <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} required />
                        </div>
                        <div className="form-group checkout-full">
                            <label><FiMapPin /> Delivery Address *</label>
                            <textarea name="address" value={form.address} onChange={handleChange} placeholder="House/Flat No, Street, Area, Landmark" rows="3" required />
                        </div>
                        <div className="form-group">
                            <label>City *</label>
                            <input name="city" value={form.city} onChange={handleChange} placeholder="City" required />
                        </div>
                        <div className="form-group">
                            <label>State *</label>
                            <input name="state" value={form.state} onChange={handleChange} placeholder="State" required />
                        </div>
                        <div className="form-group">
                            <label>Pincode *</label>
                            <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="6-digit pincode" maxLength={6} required />
                        </div>
                    </div>

                    {/* UPI Payment Section */}
                    <div className="checkout-payment-section">
                        <h3><FiCreditCard /> Pay via UPI</h3>
                        <div className="upi-payment-box">
                            <div className="upi-qr-section">
                                <div className="upi-qr-wrapper">
                                    <QRCodeSVG value={upiPaymentUrl} size={200} bgColor="#ffffff" fgColor="#1a1a2e" level="H" includeMargin={true} />
                                </div>
                                <p className="upi-scan-text">Scan to pay ₹{cartTotal.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="upi-details-section">
                                <div className="upi-id-row">
                                    <span className="upi-id-label">UPI ID</span>
                                    <div className="upi-id-value">
                                        <code>{upiId}</code>
                                        <button type="button" className="upi-copy-btn" onClick={handleCopyUPI}>
                                            <FiCopy /> {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                                <div className="upi-id-row">
                                    <span className="upi-id-label">Amount</span>
                                    <span className="upi-amount">₹{cartTotal.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="upi-steps">
                                    <p><strong>Steps:</strong></p>
                                    <ol>
                                        <li>Scan the QR code or copy the UPI ID</li>
                                        <li>Pay ₹{cartTotal.toLocaleString('en-IN')} using any UPI app</li>
                                        <li>Enter the Transaction ID below</li>
                                    </ol>
                                </div>
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label style={{ fontWeight: 700, color: 'var(--clr-gray-800)' }}>
                                        Transaction ID / UTR Number *
                                    </label>
                                    <input
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        placeholder="Enter 12-digit UPI Transaction ID"
                                        style={{
                                            width: '100%', padding: '0.75rem 1rem',
                                            border: '2px solid var(--clr-gray-200)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.95rem', fontFamily: 'monospace', letterSpacing: '1px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Order Summary */}
                <div className="checkout-summary glass-card">
                    <h2><FiShoppingBag /> Order Summary</h2>
                    <div className="checkout-items">
                        {cartItems.map(item => {
                            const displayPrice = item.finalPrice != null ? item.finalPrice : item.price;
                            const hasDiscount = item.discountPercent > 0 && item.originalPrice;
                            return (
                                <div className="checkout-item" key={item.id}>
                                    <div className="checkout-item-info">
                                        <span className="checkout-item-name">{item.name}</span>
                                        <span className="checkout-item-qty">× {item.quantity}</span>
                                    </div>
                                    <div className="checkout-item-price">
                                        {hasDiscount && (
                                            <span className="checkout-item-original">
                                                ₹{(item.originalPrice * item.quantity).toLocaleString('en-IN')}
                                            </span>
                                        )}
                                        <span>₹{(displayPrice * item.quantity).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="checkout-totals">
                        <div className="checkout-total-row">
                            <span>Subtotal ({cartItems.length} items)</span>
                            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                        {savings > 0 && (
                            <div className="checkout-total-row checkout-savings">
                                <span>You Save</span>
                                <span>- ₹{savings.toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className="checkout-total-row">
                            <span>Shipping</span>
                            <span className="checkout-free">FREE</span>
                        </div>
                        <div className="checkout-total-row checkout-grand-total">
                            <span>Total</span>
                            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                    {error && (<div className="checkout-error">{error}</div>)}
                    <button type="submit" className="btn btn-primary btn-lg checkout-place-btn" disabled={loading}>
                        {loading ? 'Placing Order...' : <><FiCheck /> Place Order — ₹{cartTotal.toLocaleString('en-IN')}</>}
                    </button>
                    <p className="checkout-secure-note">🔒 Your information is secure and will only be used for delivery.</p>
                </div>
            </form>
        </div>
    );
}

export default Checkout;
