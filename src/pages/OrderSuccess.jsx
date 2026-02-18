import { useLocation, Link } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiArrowRight, FiMapPin, FiPhone, FiCreditCard } from 'react-icons/fi';

function OrderSuccess() {
    const location = useLocation();
    const order = location.state?.order;

    if (!order) {
        return (
            <div className="order-success-page">
                <div className="order-success-card glass-card">
                    <FiPackage style={{ fontSize: '3rem', color: 'var(--clr-gold)' }} />
                    <h2>No Order Found</h2>
                    <p>It looks like you arrived here by mistake.</p>
                    <Link to="/shop" className="btn btn-primary btn-lg">Go Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="order-success-page">
            <div className="order-success-card glass-card">
                <div className="order-success-icon">
                    <FiCheckCircle />
                </div>
                <h1>Order Placed Successfully! 🎉</h1>
                <p className="order-success-subtitle">
                    Thank you for shopping with Sri Bala Fashion
                </p>

                <div className="order-success-details">
                    <div className="order-success-row">
                        <span className="order-success-label">Order ID</span>
                        <span className="order-success-value order-id-badge">#{order.id}</span>
                    </div>
                    <div className="order-success-row">
                        <span className="order-success-label">Total Amount</span>
                        <span className="order-success-value" style={{ fontWeight: 700, color: 'var(--clr-gold-dark)' }}>
                            ₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="order-success-row">
                        <span className="order-success-label"><FiCreditCard /> Payment</span>
                        <span className="order-success-value">UPI — Pending</span>
                    </div>
                    <div className="order-success-row">
                        <span className="order-success-label"><FiMapPin /> Delivery To</span>
                        <span className="order-success-value">
                            {order.address}, {order.city}, {order.state} - {order.pincode}
                        </span>
                    </div>
                    <div className="order-success-row">
                        <span className="order-success-label"><FiPhone /> Phone</span>
                        <span className="order-success-value">{order.phone}</span>
                    </div>
                </div>

                <div className="order-success-upi-notice glass-card">
                    <h3>📱 Complete UPI Payment</h3>
                    <p>
                        Please complete your payment of <strong>₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}</strong> via
                        UPI (Google Pay, PhonePe, Paytm, etc.). We will confirm your order once payment is received.
                    </p>
                </div>

                <div className="order-success-items">
                    <h3>Items Ordered ({order.items?.length || 0})</h3>
                    {order.items?.map((item, i) => (
                        <div className="order-success-item" key={i}>
                            <span>{item.productName} × {item.quantity}</span>
                            <span>₹{(parseFloat(item.finalPrice) * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                </div>

                <div className="order-success-actions">
                    <Link to="/my-orders" className="btn btn-primary btn-lg">
                        <FiPackage /> View My Orders
                    </Link>
                    <Link to="/shop" className="btn btn-outline-light btn-lg">
                        <FiArrowRight /> Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default OrderSuccess;
