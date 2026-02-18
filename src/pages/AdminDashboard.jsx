import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiPlus, FiTrash2, FiX, FiSave, FiTool, FiPercent, FiClock, FiLogOut, FiExternalLink, FiPackage, FiLayout, FiEdit3, FiEdit, FiUsers, FiShoppingCart, FiCheck, FiXCircle, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useMaintenance } from '../context/MaintenanceContext';
import { useDataSync, useDataListener } from '../context/DataSyncContext';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [discountValue, setDiscountValue] = useState('');
    const [timerMinutes, setTimerMinutes] = useState('');
    const [formData, setFormData] = useState({
        name: '', category: '', price: '', stock: '', description: '', imageUrl: '', discountPercent: 0,
        sizeVariants: []
    });
    const SIZE_CATEGORIES = ['Bangles', 'Rings', 'Garlands'];
    const hasSizes = SIZE_CATEGORIES.some(c => formData.category.toLowerCase() === c.toLowerCase());
    const [homeContent, setHomeContent] = useState({
        heroTitle: '', heroSubtitle: '', promoTitle: '', promoText: '', promoBtnText: '',
        featureTitle: '', featureSubtitle: '',
        footerAddress: '', footerPhone: '', footerEmail: '',
        footerInstagram: '', footerFacebook: '', footerTwitter: '', footerYoutube: '',
        upiId: ''
    });
    const [homeContentSaving, setHomeContentSaving] = useState(false);
    const [homeContentMsg, setHomeContentMsg] = useState('');

    // Products pagination
    const [productPage, setProductPage] = useState(0);
    const [productTotalPages, setProductTotalPages] = useState(0);
    const [productsLoading, setProductsLoading] = useState(false);

    // Orders state
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [orderPage, setOrderPage] = useState(0);
    const [orderTotalPages, setOrderTotalPages] = useState(0);

    // Users state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userPage, setUserPage] = useState(0);
    const [userTotalPages, setUserTotalPages] = useState(0);

    const { token, user, logout } = useAuth();
    const { maintenanceMode, toggleMaintenance, startMaintenanceWithTimer, timeRemaining } = useMaintenance();
    const { notifyDataChange } = useDataSync();
    const navigate = useNavigate();

    useEffect(() => {
        if (token) fetchProducts();
        fetchHomeContent();
    }, [token]);

    useEffect(() => {
        if (!token) return;
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab, token]);

    // Re-fetch when page changes
    useEffect(() => { if (token) fetchProducts(); }, [productPage]);
    useEffect(() => { if (token && activeTab === 'orders') fetchOrders(); }, [orderPage]);
    useEffect(() => { if (token && activeTab === 'users') fetchUsers(); }, [userPage]);

    // Live sync: listen for data changes from other tabs/components
    useDataListener('products', () => fetchProducts());
    useDataListener('orders', () => { if (activeTab === 'orders') fetchOrders(); });

    const fetchProducts = async () => {
        if (!token) return;
        setProductsLoading(true);
        try {
            const response = await axios.get(`/api/admin/products?page=${productPage}&size=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data.content);
            setProductTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Fetch failed", error);
        }
        setProductsLoading(false);
    };

    const fetchHomeContent = async () => {
        try {
            const response = await axios.get('/api/content/home');
            setHomeContent(response.data);
        } catch (error) {
            console.error("Failed to fetch home content", error);
        }
    };

    const fetchOrders = async () => {
        if (!token) return;
        setOrdersLoading(true);
        try {
            const response = await axios.get(`/api/admin/orders?page=${orderPage}&size=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(response.data.content);
            setOrderTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        }
        setOrdersLoading(false);
    };

    const fetchUsers = async () => {
        if (!token) return;
        setUsersLoading(true);
        try {
            const response = await axios.get(`/api/admin/users?page=${userPage}&size=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.content);
            setUserTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
        setUsersLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await axios.delete(`/api/admin/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProducts();
            notifyDataChange('products');
        } catch (error) {
            alert("Failed to delete");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                discountPercent: parseInt(formData.discountPercent) || 0,
                sizeVariants: hasSizes ? formData.sizeVariants.filter(v => v.sizeLabel && v.price).map(v => ({
                    sizeLabel: v.sizeLabel,
                    price: parseFloat(v.price)
                })) : []
            };

            if (editingProductId) {
                await axios.put(`/api/admin/products/${editingProductId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post('/api/admin/products', payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            cancelForm();
            fetchProducts();
            notifyDataChange('products');
        } catch (error) {
            alert("Failed to save product: " + (error.response?.data?.message || error.message));
        }
    };

    const handleEditProduct = (product) => {
        setEditingProductId(product.id);
        setFormData({
            name: product.name || '',
            category: product.category || '',
            price: product.price || '',
            stock: product.stock || '',
            description: product.description || '',
            imageUrl: product.imageUrl || '',
            discountPercent: product.discountPercent || 0,
            sizeVariants: (product.sizeVariants || []).map(v => ({ sizeLabel: v.sizeLabel, price: v.price }))
        });
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingProductId(null);
        setFormData({ name: '', category: '', price: '', stock: '', description: '', imageUrl: '', discountPercent: 0, sizeVariants: [] });
    };

    const addSizeVariant = () => {
        setFormData(prev => ({ ...prev, sizeVariants: [...prev.sizeVariants, { sizeLabel: '', price: '' }] }));
    };
    const removeSizeVariant = (index) => {
        setFormData(prev => ({ ...prev, sizeVariants: prev.sizeVariants.filter((_, i) => i !== index) }));
    };
    const updateSizeVariant = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            sizeVariants: prev.sizeVariants.map((v, i) => i === index ? { ...v, [field]: value } : v)
        }));
    };

    const handleApplyDiscount = async (product) => {
        const discount = parseInt(discountValue) || 0;
        if (discount < 0 || discount > 100) {
            alert("Discount must be between 0 and 100");
            return;
        }
        try {
            await axios.put(`/api/admin/products/${product.id}`, {
                ...product,
                discountPercent: discount
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingDiscount(null);
            setDiscountValue('');
            fetchProducts();
            notifyDataChange('products');
        } catch (error) {
            alert("Failed to update discount");
        }
    };

    const handleSaveHomeContent = async () => {
        setHomeContentSaving(true);
        setHomeContentMsg('');
        try {
            await axios.put('/api/admin/content/home', homeContent, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHomeContentMsg('✅ Home & footer content updated successfully!');
        } catch (error) {
            setHomeContentMsg('❌ Failed to save: ' + (error.response?.data?.message || error.message));
        }
        setHomeContentSaving(false);
        setTimeout(() => setHomeContentMsg(''), 4000);
    };

    const handleOrderStatus = async (orderId, status) => {
        try {
            await axios.put(`/api/admin/orders/${orderId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: status } : o));
            notifyDataChange('orders');
        } catch (error) {
            alert("Failed to update order status");
        }
    };

    const handlePaymentStatus = async (orderId, status) => {
        try {
            await axios.put(`/api/admin/orders/${orderId}/payment`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o));
            notifyDataChange('orders');
        } catch (error) {
            alert("Failed to update payment status");
        }
    };

    const handleEstimatedDelivery = async (orderId, estimatedDelivery) => {
        try {
            await axios.put(`/api/admin/orders/${orderId}/delivery`, { estimatedDelivery }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, estimatedDelivery } : o));
            notifyDataChange('orders');
        } catch (error) {
            alert("Failed to update estimated delivery");
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;
        try {
            await axios.delete(`/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`/api/admin/users/${userId}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update role');
            fetchUsers();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const statusColors = {
        PLACED: '#3B82F6', CONFIRMED: '#8B5CF6', SHIPPED: '#F59E0B',
        DELIVERED: '#10B981', CANCELLED: '#EF4444'
    };

    const paymentColors = {
        PENDING: '#F59E0B', PAID: '#10B981', FAILED: '#EF4444'
    };

    // Reusable Pagination Bar Component
    const PaginationBar = ({ currentPage, totalPages, onPageChange }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="admin-pagination">
                <button
                    className="btn btn-sm admin-pagination-btn"
                    disabled={currentPage === 0}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <FiChevronLeft /> Previous
                </button>
                <span className="admin-pagination-info">
                    Page <strong>{currentPage + 1}</strong> of <strong>{totalPages}</strong>
                </span>
                <button
                    className="btn btn-sm admin-pagination-btn"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    Next <FiChevronRight />
                </button>
            </div>
        );
    };

    return (
        <div className="admin-layout">
            {/* Admin Top Bar */}
            <div className="admin-topbar">
                <div className="admin-topbar-brand">
                    <img src="./Images/Logo/logo.png" alt="Sri Bala Fashion Logo" className="admin-topbar-logo" />
                    <span>Sri Bala Fashion</span>
                    <span className="admin-topbar-badge">ADMIN</span>
                </div>
                <div className="admin-topbar-actions">
                    <Link to="/" className="admin-topbar-link" target="_blank">
                        <FiExternalLink /> View Site
                    </Link>
                    <span className="admin-topbar-user">{user?.email}</span>
                    <button onClick={handleLogout} className="admin-topbar-logout">
                        <FiLogOut /> Logout
                    </button>
                </div>
            </div>

            {/* Admin Tab Navigation */}
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    <FiPackage /> Products
                </button>
                <button
                    className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <FiShoppingCart /> Orders
                </button>
                <button
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <FiUsers /> Users
                </button>
                <button
                    className={`admin-tab ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => setActiveTab('home')}
                >
                    <FiLayout /> Home & Footer
                </button>
                <button
                    className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <FiTool /> Settings
                </button>
            </div>

            <div className="admin-content">
                {/* ============ PRODUCTS TAB ============ */}
                {activeTab === 'products' && (
                    <div>
                        <div className="admin-header">
                            <h2>Manage Products</h2>
                            <button
                                className={`btn ${showForm ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => showForm ? cancelForm() : setShowForm(true)}
                            >
                                {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Add Product</>}
                            </button>
                        </div>

                        {showForm && (
                            <form onSubmit={handleSubmit} className="admin-form glass-card" style={{ animation: 'slideDown 0.3s ease' }}>
                                <h3>{editingProductId ? '✏️ Edit Product' : '➕ New Product'}</h3>
                                <div className="admin-form-grid">
                                    <div className="form-group">
                                        <label>Product Name</label>
                                        <input
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <input
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="e.g. Bangles, Garlands"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Price (₹)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Stock</label>
                                        <input
                                            type="number"
                                            value={formData.stock}
                                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Discount (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.discountPercent}
                                            onChange={e => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Image URL</label>
                                        <input
                                            value={formData.imageUrl}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>
                                    <div className="form-group admin-form-full">
                                        <label>Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe the product..."
                                            rows="3"
                                        />
                                    </div>
                                </div>

                                {/* Size Variants Section */}
                                {hasSizes && (
                                    <div className="admin-size-variants-section">
                                        <div className="admin-size-variants-header">
                                            <h4>📏 Size Variants (Size → Price)</h4>
                                            <button type="button" className="btn btn-primary btn-sm" onClick={addSizeVariant}>
                                                <FiPlus /> Add Size
                                            </button>
                                        </div>
                                        {formData.sizeVariants.length === 0 && (
                                            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', fontStyle: 'italic' }}>No size variants added. Click "Add Size" to define sizes with different prices.</p>
                                        )}
                                        {formData.sizeVariants.map((variant, index) => (
                                            <div className="admin-size-variant-row" key={index}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Size</label>
                                                    <input
                                                        value={variant.sizeLabel}
                                                        onChange={e => updateSizeVariant(index, 'sizeLabel', e.target.value)}
                                                        placeholder="e.g. 2.4, 1 feet, 16"
                                                    />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Price (₹)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={variant.price}
                                                        onChange={e => updateSizeVariant(index, 'price', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="remove-btn"
                                                    onClick={() => removeSizeVariant(index)}
                                                    title="Remove size"
                                                    style={{ alignSelf: 'flex-end', marginBottom: '0.5rem' }}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button type="submit" className="btn btn-primary">
                                        <FiSave /> {editingProductId ? 'Update Product' : 'Save Product'}
                                    </button>
                                    {editingProductId && (
                                        <button type="button" className="btn btn-secondary" onClick={cancelForm}>
                                            <FiX /> Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}

                        <div className="table-responsive">
                            <table className="styled-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Discount</th>
                                        <th>Stock</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productsLoading ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading products...</td></tr>
                                    ) : products.length === 0 ? (
                                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>No products yet. Click "Add Product" to get started.</td></tr>
                                    ) : (
                                        products.map((product, index) => (
                                            <tr key={product.id}>
                                                <td data-label="#">{productPage * 10 + index + 1}</td>
                                                <td data-label="Name" style={{ fontWeight: 600 }}>{product.name}</td>
                                                <td data-label="Category">
                                                    <span className="badge badge-gold">{product.category}</span>
                                                </td>
                                                <td data-label="Price" className="product-price">₹{product.price?.toLocaleString('en-IN')}</td>
                                                <td data-label="Discount">
                                                    {editingDiscount === product.id ? (
                                                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={discountValue}
                                                                onChange={e => setDiscountValue(e.target.value)}
                                                                style={{ width: '60px', padding: '0.3rem', borderRadius: '6px', border: '2px solid #D1D5DB', textAlign: 'center' }}
                                                                placeholder="%"
                                                            />
                                                            <button
                                                                onClick={() => handleApplyDiscount(product)}
                                                                className="btn btn-primary btn-sm"
                                                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                            >
                                                                ✓
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingDiscount(null); setDiscountValue(''); }}
                                                                className="remove-btn"
                                                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            onClick={() => { setEditingDiscount(product.id); setDiscountValue(product.discountPercent || 0); }}
                                                            style={{
                                                                cursor: 'pointer',
                                                                color: product.discountPercent ? '#DC2626' : '#9CA3AF',
                                                                fontWeight: product.discountPercent ? 700 : 400,
                                                                display: 'flex', alignItems: 'center', gap: '0.3rem'
                                                            }}
                                                            title="Click to edit discount"
                                                        >
                                                            <FiPercent style={{ fontSize: '0.8rem' }} />
                                                            {product.discountPercent || 0}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td data-label="Stock">{product.stock}</td>
                                                <td data-label="Actions">
                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                        <button
                                                            onClick={() => handleEditProduct(product)}
                                                            className="btn btn-primary btn-sm"
                                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                                            title="Edit product"
                                                        >
                                                            <FiEdit /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="remove-btn"
                                                        >
                                                            <FiTrash2 /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationBar currentPage={productPage} totalPages={productTotalPages} onPageChange={setProductPage} />
                    </div>
                )}

                {/* ============ ORDERS TAB ============ */}
                {activeTab === 'orders' && (
                    <div>
                        <div className="admin-header">
                            <h2><FiShoppingCart style={{ marginRight: '0.5rem' }} /> Manage Orders</h2>
                            <button className="btn btn-primary" onClick={fetchOrders}>
                                🔄 Refresh
                            </button>
                        </div>

                        {ordersLoading ? (
                            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading orders...</p>
                        ) : orders.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>No orders yet.</p>
                        ) : (
                            <div className="admin-orders-list">
                                {orders.map(order => (
                                    <div className="admin-order-card glass-card" key={order.id}>
                                        <div
                                            className="admin-order-header"
                                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                        >
                                            <div className="admin-order-header-left">
                                                <div className="admin-order-top-row">
                                                    <span className="admin-order-id">Order #{orderPage * 10 + orders.indexOf(order) + 1}</span>
                                                    <span className="admin-order-date">{formatDate(order.createdAt)}</span>
                                                </div>
                                                <div className="admin-order-customer">
                                                    <strong>{order.customerName}</strong>
                                                    <span className="admin-order-email">{order.customerEmail}</span>
                                                </div>
                                            </div>
                                            <div className="admin-order-header-right">
                                                <span
                                                    className="admin-order-badge"
                                                    style={{ background: statusColors[order.orderStatus] || '#6B7280' }}
                                                >
                                                    {order.orderStatus}
                                                </span>
                                                <span
                                                    className="admin-order-badge"
                                                    style={{ background: paymentColors[order.paymentStatus] || '#6B7280' }}
                                                >
                                                    {order.paymentStatus}
                                                </span>
                                                <span className="admin-order-total">
                                                    ₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}
                                                </span>
                                                {expandedOrderId === order.id ? <FiChevronUp /> : <FiChevronDown />}
                                            </div>
                                        </div>

                                        {expandedOrderId === order.id && (
                                            <div className="admin-order-details">
                                                <div className="admin-order-info-grid">
                                                    <div className="admin-order-info-item">
                                                        <span className="admin-order-info-label">📞 Phone</span>
                                                        <span className="admin-order-info-value">{order.phone}</span>
                                                    </div>
                                                    <div className="admin-order-info-item">
                                                        <span className="admin-order-info-label">📍 Address</span>
                                                        <span className="admin-order-info-value">
                                                            {order.address}, {order.city}, {order.state} - {order.pincode}
                                                        </span>
                                                    </div>
                                                    <div className="admin-order-info-item">
                                                        <span className="admin-order-info-label">🔑 Transaction ID</span>
                                                        <span className="admin-order-info-value" style={{ fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 700 }}>
                                                            {order.transactionId || <em style={{ color: '#9CA3AF', fontWeight: 400 }}>Not provided</em>}
                                                        </span>
                                                    </div>
                                                    <div className="admin-order-info-item">
                                                        <span className="admin-order-info-label">💳 Payment Method</span>
                                                        <span className="admin-order-info-value">{order.paymentMethod}</span>
                                                    </div>
                                                    {order.estimatedDelivery && (
                                                        <div className="admin-order-info-item">
                                                            <span className="admin-order-info-label">🚚 Est. Delivery</span>
                                                            <span className="admin-order-info-value" style={{ color: '#F59E0B', fontWeight: 700 }}>{order.estimatedDelivery}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Order Items */}
                                                <div className="admin-order-items">
                                                    <h4>Items Ordered</h4>
                                                    {order.items?.map((item, i) => (
                                                        <div className="admin-order-item-row" key={i}>
                                                            <span>{item.productName}{item.selectedSize ? <span style={{ color: 'var(--clr-gold-dark)', fontSize: '0.85rem', marginLeft: '0.4rem' }}>(Size: {item.selectedSize})</span> : ''}</span>
                                                            <span>× {item.quantity}</span>
                                                            <span>₹{(parseFloat(item.finalPrice) * item.quantity).toLocaleString('en-IN')}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="admin-order-actions">
                                                    <div className="admin-order-action-group">
                                                        <span className="admin-order-action-label">Order Status:</span>
                                                        {order.orderStatus === 'PLACED' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-sm"
                                                                    style={{ background: '#10B981', color: 'white', border: 'none' }}
                                                                    onClick={() => handleOrderStatus(order.id, 'CONFIRMED')}
                                                                >
                                                                    <FiCheck /> Approve
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleOrderStatus(order.id, 'CANCELLED')}
                                                                >
                                                                    <FiXCircle /> Deny
                                                                </button>
                                                            </>
                                                        )}
                                                        {order.orderStatus === 'CONFIRMED' && (
                                                            <button
                                                                className="btn btn-sm"
                                                                style={{ background: '#F59E0B', color: 'white', border: 'none' }}
                                                                onClick={() => handleOrderStatus(order.id, 'SHIPPED')}
                                                            >
                                                                📦 Mark Shipped
                                                            </button>
                                                        )}
                                                        {order.orderStatus === 'SHIPPED' && (
                                                            <button
                                                                className="btn btn-sm"
                                                                style={{ background: '#10B981', color: 'white', border: 'none' }}
                                                                onClick={() => handleOrderStatus(order.id, 'DELIVERED')}
                                                            >
                                                                ✅ Mark Delivered
                                                            </button>
                                                        )}
                                                        {(order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') && (
                                                            <span style={{ fontSize: '0.85rem', color: '#6B7280', fontStyle: 'italic' }}>
                                                                {order.orderStatus === 'DELIVERED' ? '✅ Completed' : '❌ Cancelled'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="admin-order-action-group">
                                                        <span className="admin-order-action-label">Payment:</span>
                                                        {order.paymentStatus === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    className="btn btn-sm"
                                                                    style={{ background: '#10B981', color: 'white', border: 'none' }}
                                                                    onClick={() => handlePaymentStatus(order.id, 'PAID')}
                                                                >
                                                                    ✅ Mark Paid
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handlePaymentStatus(order.id, 'FAILED')}
                                                                >
                                                                    ❌ Mark Failed
                                                                </button>
                                                            </>
                                                        )}
                                                        {order.paymentStatus !== 'PENDING' && (
                                                            <span style={{ fontSize: '0.85rem', color: '#6B7280', fontStyle: 'italic' }}>
                                                                {order.paymentStatus === 'PAID' ? '✅ Paid' : '❌ Failed'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Estimated Delivery Input */}
                                                    {(order.orderStatus === 'CONFIRMED' || order.orderStatus === 'SHIPPED') && (
                                                        <div className="admin-order-action-group">
                                                            <span className="admin-order-action-label">🚚 Estimated Delivery:</span>
                                                            <input
                                                                type="text"
                                                                defaultValue={order.estimatedDelivery || ''}
                                                                placeholder="e.g. Feb 15, 2026"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        handleEstimatedDelivery(order.id, e.target.value);
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding: '0.4rem 0.75rem',
                                                                    borderRadius: '8px',
                                                                    border: '2px solid #D1D5DB',
                                                                    fontSize: '0.85rem',
                                                                    width: '160px',
                                                                    fontFamily: 'inherit'
                                                                }}
                                                            />
                                                            <button
                                                                className="btn btn-sm"
                                                                style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '0.4rem 0.75rem' }}
                                                                onClick={(e) => {
                                                                    const input = e.target.closest('.admin-order-action-group').querySelector('input');
                                                                    if (input.value) handleEstimatedDelivery(order.id, input.value);
                                                                }}
                                                            >
                                                                💾 Save
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <PaginationBar currentPage={orderPage} totalPages={orderTotalPages} onPageChange={setOrderPage} />
                    </div>
                )}

                {/* ============ USERS TAB ============ */}
                {activeTab === 'users' && (
                    <div>
                        <div className="admin-header">
                            <h2><FiUsers style={{ marginRight: '0.5rem' }} /> Registered Users</h2>
                            <button className="btn btn-primary" onClick={fetchUsers}>
                                🔄 Refresh
                            </button>
                        </div>

                        {usersLoading ? (
                            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Loading users...</p>
                        ) : users.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>No registered users.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="styled-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Full Name</th>
                                            <th>Email</th>
                                            <th>Provider</th>
                                            <th>Role</th>
                                            <th>Registered</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u, index) => (
                                            <tr key={u.id}>
                                                <td data-label="#">{userPage * 10 + index + 1}</td>
                                                <td data-label="Name" style={{ fontWeight: 600 }}>{u.fullName}</td>
                                                <td data-label="Email">{u.email}</td>
                                                <td data-label="Provider">
                                                    <span className={`badge ${u.authProvider === 'GOOGLE' ? 'badge-blue' : 'badge-gold'}`}>
                                                        {u.authProvider || 'LOCAL'}
                                                    </span>
                                                </td>
                                                <td data-label="Role">
                                                    {u.email === user?.email ? (
                                                        <span className="badge badge-danger" title="You cannot change your own role">ADMIN</span>
                                                    ) : (
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                            style={{
                                                                padding: '0.35rem 0.6rem',
                                                                borderRadius: '8px',
                                                                border: '2px solid #D1D5DB',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.1)' : 'rgba(212,168,67,0.1)',
                                                                color: u.role === 'ADMIN' ? '#DC2626' : '#92702A'
                                                            }}
                                                        >
                                                            <option value="CUSTOMER">CUSTOMER</option>
                                                            <option value="ADMIN">ADMIN</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td data-label="Registered" style={{ fontSize: '0.85rem', color: 'var(--clr-gray-500)' }}>
                                                    {formatDate(u.createdAt)}
                                                </td>
                                                <td data-label="Actions">
                                                    {u.role !== 'ADMIN' ? (
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                                                            title="Delete user"
                                                        >
                                                            <FiTrash2 /> Delete
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontStyle: 'italic' }}>Admin</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <PaginationBar currentPage={userPage} totalPages={userTotalPages} onPageChange={setUserPage} />
                    </div>
                )}

                {/* ============ HOME & FOOTER CONTENT TAB ============ */}
                {activeTab === 'home' && (
                    <div>
                        <div className="admin-header">
                            <h2><FiEdit3 style={{ marginRight: '0.5rem' }} /> Edit Home Page & Footer</h2>
                        </div>

                        <div className="admin-home-editor glass-card">
                            {/* Hero Section */}
                            <div className="admin-editor-section">
                                <h3>🏠 Hero Section</h3>
                                <div className="admin-form-grid">
                                    <div className="form-group admin-form-full">
                                        <label>Hero Title</label>
                                        <input
                                            value={homeContent.heroTitle}
                                            onChange={e => setHomeContent({ ...homeContent, heroTitle: e.target.value })}
                                            placeholder="Welcome to Sri Bala Fashion"
                                        />
                                    </div>
                                    <div className="form-group admin-form-full">
                                        <label>Hero Subtitle</label>
                                        <textarea
                                            value={homeContent.heroSubtitle}
                                            onChange={e => setHomeContent({ ...homeContent, heroSubtitle: e.target.value })}
                                            placeholder="Discover our stunning collection..."
                                            rows="3"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Promo Banner */}
                            <div className="admin-editor-section">
                                <h3><FiPercent style={{ marginRight: '0.4rem' }} /> Promo Banner</h3>
                                <div className="admin-form-grid">
                                    <div className="form-group admin-form-full">
                                        <label>Promo Title</label>
                                        <input
                                            value={homeContent.promoTitle}
                                            onChange={e => setHomeContent({ ...homeContent, promoTitle: e.target.value })}
                                            placeholder="Special Collection Available Now"
                                        />
                                    </div>
                                    <div className="form-group admin-form-full">
                                        <label>Promo Text</label>
                                        <textarea
                                            value={homeContent.promoText}
                                            onChange={e => setHomeContent({ ...homeContent, promoText: e.target.value })}
                                            placeholder="Explore our latest arrivals..."
                                            rows="2"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Button Text</label>
                                        <input
                                            value={homeContent.promoBtnText}
                                            onChange={e => setHomeContent({ ...homeContent, promoBtnText: e.target.value })}
                                            placeholder="Explore Collection"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Features Section */}
                            <div className="admin-editor-section">
                                <h3>⭐ Features Section</h3>
                                <div className="admin-form-grid">
                                    <div className="form-group">
                                        <label>Section Title</label>
                                        <input
                                            value={homeContent.featureTitle}
                                            onChange={e => setHomeContent({ ...homeContent, featureTitle: e.target.value })}
                                            placeholder="Why Choose Us"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Section Subtitle</label>
                                        <input
                                            value={homeContent.featureSubtitle}
                                            onChange={e => setHomeContent({ ...homeContent, featureSubtitle: e.target.value })}
                                            placeholder="Quality you can trust"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Content */}
                            <div className="admin-editor-section">
                                <h3>📋 Footer — Contact Info</h3>
                                <div className="admin-form-grid">
                                    <div className="form-group admin-form-full">
                                        <label>Address</label>
                                        <input
                                            value={homeContent.footerAddress}
                                            onChange={e => setHomeContent({ ...homeContent, footerAddress: e.target.value })}
                                            placeholder="123 Fashion Street, Chennai, India"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            value={homeContent.footerPhone}
                                            onChange={e => setHomeContent({ ...homeContent, footerPhone: e.target.value })}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            value={homeContent.footerEmail}
                                            onChange={e => setHomeContent({ ...homeContent, footerEmail: e.target.value })}
                                            placeholder="hello@sribalafashion.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Settings — UPI ID */}
                            <div className="admin-editor-section">
                                <h3>💳 Payment Settings</h3>
                                <div className="admin-form-grid">
                                    <div className="form-group admin-form-full">
                                        <label>UPI ID (used in Checkout QR code)</label>
                                        <input
                                            value={homeContent.upiId || ''}
                                            onChange={e => setHomeContent({ ...homeContent, upiId: e.target.value })}
                                            placeholder="yourname@upi"
                                        />
                                        <small style={{ color: 'var(--clr-gray-500)', marginTop: '0.25rem', display: 'block' }}>
                                            This UPI ID will appear on the checkout page QR code and copy button.
                                        </small>
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                        <label>QR Code Preview</label>
                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                                            <QRCodeSVG
                                                value={`upi://pay?pa=${homeContent.upiId || ''}&pn=Sri%20Bala%20Fashion&am=0&cu=INR&tn=Order%20Payment`}
                                                size={160}
                                                bgColor="#ffffff"
                                                fgColor="#1a1a2e"
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                        <small style={{ color: 'var(--clr-gray-500)', textAlign: 'center' }}>
                                            Scan to verify
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-editor-section">
                                <h3>🔗 Footer — Social Media Links</h3>
                                <div className="admin-form-grid">
                                    <div className="form-group">
                                        <label>Instagram URL</label>
                                        <input
                                            value={homeContent.footerInstagram}
                                            onChange={e => setHomeContent({ ...homeContent, footerInstagram: e.target.value })}
                                            placeholder="https://instagram.com/yourpage"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Facebook URL</label>
                                        <input
                                            value={homeContent.footerFacebook}
                                            onChange={e => setHomeContent({ ...homeContent, footerFacebook: e.target.value })}
                                            placeholder="https://facebook.com/yourpage"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Twitter URL</label>
                                        <input
                                            value={homeContent.footerTwitter}
                                            onChange={e => setHomeContent({ ...homeContent, footerTwitter: e.target.value })}
                                            placeholder="https://twitter.com/yourhandle"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>YouTube URL</label>
                                        <input
                                            value={homeContent.footerYoutube}
                                            onChange={e => setHomeContent({ ...homeContent, footerYoutube: e.target.value })}
                                            placeholder="https://youtube.com/yourchannel"
                                        />
                                    </div>
                                </div>
                            </div>

                            {homeContentMsg && (
                                <div className={`admin-content-msg ${homeContentMsg.startsWith('✅') ? 'success' : 'error'}`}>
                                    {homeContentMsg}
                                </div>
                            )}

                            <button
                                className="btn btn-primary"
                                onClick={handleSaveHomeContent}
                                disabled={homeContentSaving}
                                style={{ marginTop: '1rem' }}
                            >
                                {homeContentSaving ? 'Saving...' : <><FiSave /> Save All Changes</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* ============ SETTINGS TAB ============ */}
                {activeTab === 'settings' && (
                    <div>
                        <div className="admin-header">
                            <h2><FiTool style={{ marginRight: '0.5rem' }} /> Site Settings</h2>
                        </div>

                        {/* Maintenance Mode Toggle */}
                        <div className="maintenance-toggle glass-card">
                            <FiTool style={{ fontSize: '1.2rem', color: maintenanceMode ? '#DC2626' : '#9CA3AF' }} />
                            <label>Maintenance Mode</label>
                            <div
                                className={`toggle-switch ${maintenanceMode ? 'active' : ''}`}
                                onClick={() => toggleMaintenance(token)}
                                role="button"
                                tabIndex={0}
                                aria-label="Toggle maintenance mode"
                            />
                            <span style={{ fontSize: '0.85rem', color: maintenanceMode ? '#DC2626' : '#6B7280' }}>
                                {maintenanceMode ? '🔴 Site is DOWN for visitors' : '🟢 Site is LIVE'}
                            </span>
                            {!maintenanceMode && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                                    <FiClock style={{ color: '#6B7280' }} />
                                    <input
                                        type="number"
                                        min="1"
                                        max="1440"
                                        value={timerMinutes}
                                        onChange={e => setTimerMinutes(e.target.value)}
                                        placeholder="Minutes"
                                        style={{ width: '80px', padding: '0.35rem 0.5rem', borderRadius: '8px', border: '2px solid #D1D5DB', fontSize: '0.85rem', textAlign: 'center' }}
                                    />
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => { startMaintenanceWithTimer(parseInt(timerMinutes) || 0, token); setTimerMinutes(''); }}
                                        disabled={!timerMinutes || parseInt(timerMinutes) <= 0}
                                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}
                                    >
                                        Start with Timer
                                    </button>
                                </div>
                            )}
                            {maintenanceMode && timeRemaining && (
                                <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                                    <FiClock /> Auto-off in: {timeRemaining}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
