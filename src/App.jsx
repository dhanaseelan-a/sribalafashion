import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { MaintenanceProvider, useMaintenance } from './context/MaintenanceContext';
import { DataSyncProvider } from './context/DataSyncContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { FiTool, FiClock } from 'react-icons/fi';
import { lazy, Suspense } from 'react';

// Eagerly loaded — needed on first paint
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Lazy loaded — only downloaded when user navigates to them
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

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
    );
}

export default App;
