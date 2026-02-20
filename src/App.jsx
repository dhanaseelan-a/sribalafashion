import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { MaintenanceProvider, useMaintenance } from './context/MaintenanceContext';
import { DataSyncProvider } from './context/DataSyncContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { FiTool, FiClock } from 'react-icons/fi';
import { lazy, Suspense, Component } from 'react';

// Eagerly loaded — needed on first paint
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Retry wrapper: if a lazy chunk fails (e.g. after redeploy), retry once
function lazyRetry(importFn) {
    return lazy(() =>
        importFn().catch(() => {
            // Wait briefly then retry — handles Vercel cache misses after redeploy
            return new Promise(resolve => setTimeout(resolve, 1500))
                .then(() => importFn());
        })
    );
}

// Lazy loaded — only downloaded when user navigates to them
const Shop = lazyRetry(() => import('./pages/Shop'));
const ProductDetail = lazyRetry(() => import('./pages/ProductDetail'));
const Cart = lazyRetry(() => import('./pages/Cart'));
const Checkout = lazyRetry(() => import('./pages/Checkout'));
const OrderSuccess = lazyRetry(() => import('./pages/OrderSuccess'));
const MyOrders = lazyRetry(() => import('./pages/MyOrders'));
const AdminDashboard = lazyRetry(() => import('./pages/AdminDashboard'));
const AdminLogin = lazyRetry(() => import('./pages/AdminLogin'));

// Error Boundary: catches JS crashes and shows a recovery screen instead of blank page
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('App crashed:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh',
                    background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF0E6 100%)',
                    fontFamily: "'Inter', sans-serif", padding: '2rem', textAlign: 'center'
                }}>
                    <div style={{ fontSize: '1.5rem', color: '#6B0F2A', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Something went wrong
                    </div>
                    <p style={{ color: '#666', marginBottom: '1.5rem', maxWidth: '360px' }}>
                        We're sorry for the inconvenience. Please reload the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 2rem', background: '#6B0F2A', color: '#fff',
                            border: 'none', borderRadius: '8px', fontSize: '1rem',
                            cursor: 'pointer', fontWeight: 500
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// Lightweight loading spinner
function PageLoader() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            opacity: 0.5,
            fontSize: '1.1rem'
        }}>
            Loading...
        </div>
    );
}

// Route guard: only ADMIN users can access /admin
function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (user.role !== 'ADMIN') return <Navigate to="/admin/login" replace />;
    return children;
}

function MaintenanceOverlay() {
    const { maintenanceMode, timeRemaining } = useMaintenance();
    const location = useLocation();

    // Never show maintenance on admin pages or login/register
    if (!maintenanceMode
        || location.pathname.startsWith('/admin')
        || location.pathname === '/login'
        || location.pathname === '/register') {
        return null;
    }

    return (
        <div className="maintenance-overlay">
            <div className="maintenance-icon"><FiTool /></div>
            <h1>Under Maintenance</h1>
            <p>
                Sri Bala Fashion is currently undergoing scheduled maintenance.
                We'll be back shortly with an even better shopping experience!
            </p>
            {timeRemaining && (
                <p style={{ marginTop: '1.5rem', fontSize: '1.1rem', color: 'rgba(212,168,67,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiClock /> Estimated time remaining: <strong>{timeRemaining}</strong>
                </p>
            )}
            <p style={{ marginTop: '1rem', fontSize: '0.95rem', opacity: 0.6 }}>
                Thank you for your patience 🙏
            </p>
        </div>
    );
}

function AppContent() {
    const { maintenanceMode } = useMaintenance();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const location = useLocation();

    const isAdminPage = location.pathname.startsWith('/admin');
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const showSite = !maintenanceMode || isAdmin || isAdminPage || isAuthPage;

    // Admin pages get their own layout (no customer header/footer)
    if (isAdminPage) {
        return (
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        );
    }

    return (
        <>
            <MaintenanceOverlay />
            {showSite && (
                <div className="app-container">
                    <Header />
                    <main className="main-content">
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/shop" element={<Shop />} />
                                <Route path="/product/:id" element={<ProductDetail />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/order-success" element={<OrderSuccess />} />
                                <Route path="/my-orders" element={<MyOrders />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </Suspense>
                    </main>
                    <Footer />
                </div>
            )}
        </>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <CartProvider>
                    <MaintenanceProvider>
                        <DataSyncProvider>
                            <Router>
                                <AppContent />
                            </Router>
                        </DataSyncProvider>
                    </MaintenanceProvider>
                </CartProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
