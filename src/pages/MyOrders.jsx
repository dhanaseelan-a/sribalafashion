import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FiPackage, FiMapPin, FiClock, FiShoppingBag, FiArrowRight } from 'react-icons/fi';

function MyOrders() {
    const { token, user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    const fetchOrders = useCallback(() => {
        if (token) {
            axios.get('/api/orders/my', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => setOrders(res.data))
                .catch(() => setOrders([]))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Auto-polling removed for free tier optimization
    // useEffect(() => {
    //     if (!token) return;
    //     const interval = setInterval(fetchOrders, 15000);
    //     return () => clearInterval(interval);
    // }, [fetchOrders, token]);

    if (!user) {
        return (
            <div className="my-orders-page">
                <div className="my-orders-empty glass-card">
                    <FiPackage style={{ fontSize: '2.5rem', color: 'var(--clr-gold)' }} />
                    <h2>Login Required</h2>
                    <p>Please login to view your orders.</p>
                    <Link to="/login" className="btn btn-primary btn-lg">Login</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="my-orders-page">
                <h1><FiPackage /> My Orders</h1>
                <p style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>Loading orders...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="my-orders-page">
                <h1><FiPackage /> My Orders</h1>
                <div className="my-orders-empty glass-card">
                    <FiShoppingBag style={{ fontSize: '2.5rem', color: 'var(--clr-gold)' }} />
                    <h2>No Orders Yet</h2>
                    <p>You haven't placed any orders yet. Start shopping!</p>
                    <Link to="/shop" className="btn btn-primary btn-lg">
                        <FiArrowRight /> Browse Shop
                    </Link>
                </div>
            </div>
        );
    }

    const statusColors = {
        PLACED: '#3B82F6',
        CONFIRMED: '#8B5CF6',
        SHIPPED: '#F59E0B',
        DELIVERED: '#10B981',
        CANCELLED: '#EF4444'
    };

    const paymentColors = {
        PENDING: '#F59E0B',
        PAID: '#10B981',
        FAILED: '#EF4444'
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="my-orders-page">
            <h1><FiPackage /> My Orders</h1>
            <p className="my-orders-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>

            <div className="my-orders-list">
                {orders.map(order => (
                    <div className="my-order-card glass-card" key={order.id}>
                        <div className="my-order-header" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                            <div className="my-order-header-left">
                                <span className="my-order-id">Order #{order.id}</span>
                                <span className="my-order-date">
                                    <FiClock /> {formatDate(order.createdAt)}
                                </span>
                            </div>
                            <div className="my-order-header-right">
                                <span
                                    className="my-order-status-badge"
                                    style={{ background: statusColors[order.orderStatus] || '#6B7280' }}
                                >
                                    {order.orderStatus}
                                </span>
                                <span
                                    className="my-order-payment-badge"
                                    style={{ background: paymentColors[order.paymentStatus] || '#6B7280' }}
                                >
                                    {order.paymentStatus}
                                </span>
                                <span className="my-order-total">
                                    ₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {expandedOrder === order.id && (
                            <div className="my-order-details">
                                <div className="my-order-address">
                                    <FiMapPin />
                                    <div>
                                        <strong>{order.customerName}</strong>
                                        <p>{order.address}, {order.city}, {order.state} - {order.pincode}</p>
                                        <p>📞 {order.phone}</p>
                                    </div>
                                </div>

                                {/* Shipping & Delivery Tracker */}
                                {(order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED') && (
                                    <div className="my-order-tracking" style={{
                                        background: order.orderStatus === 'DELIVERED' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                        border: `1px solid ${order.orderStatus === 'DELIVERED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                        borderRadius: '12px',
                                        padding: '1rem 1.25rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: order.orderStatus === 'DELIVERED' ? '#10B981' : '#F59E0B', marginBottom: '0.25rem' }}>
                                            {order.orderStatus === 'DELIVERED' ? '✅ Delivered' : '📦 Shipped'}
                                        </div>
                                        {order.estimatedDelivery && (
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--clr-gray-700)' }}>
                                                {order.orderStatus === 'DELIVERED'
                                                    ? `Delivered on: ${order.estimatedDelivery}`
                                                    : `Estimated Delivery: ${order.estimatedDelivery}`
                                                }
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Estimated Delivery for PLACED / CONFIRMED orders */}
                                {order.estimatedDelivery && (order.orderStatus === 'PLACED' || order.orderStatus === 'CONFIRMED') && (
                                    <div style={{
                                        background: 'rgba(59, 130, 246, 0.08)',
                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                        borderRadius: '12px',
                                        padding: '1rem 1.25rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ fontWeight: 700, color: '#3B82F6', marginBottom: '0.25rem' }}>
                                            🚚 Estimated Delivery
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--clr-gray-700)' }}>
                                            {order.estimatedDelivery}
                                        </p>
                                    </div>
                                )}

                                {order.orderStatus === 'CANCELLED' && (
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '12px',
                                        padding: '1rem 1.25rem',
                                        marginBottom: '1rem'
                                    }}>
                                        <div style={{ fontWeight: 700, color: '#EF4444' }}>
                                            ❌ Order Cancelled
                                        </div>
                                        {order.paymentStatus === 'FAILED' && (
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
                                                Reason: Payment failed
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="my-order-items">
                                    {order.items?.map((item, i) => (
                                        <div className="my-order-item" key={i}>
                                            <span>{item.productName}{item.selectedSize ? <span style={{ color: 'var(--clr-gold-dark)', fontSize: '0.85rem', marginLeft: '0.4rem' }}>(Size: {item.selectedSize})</span> : ''}</span>
                                            <span>× {item.quantity}</span>
                                            <span>₹{(parseFloat(item.finalPrice) * item.quantity).toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MyOrders;
