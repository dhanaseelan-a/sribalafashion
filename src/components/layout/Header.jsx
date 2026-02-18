import { Link } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiShoppingCart, FiUser, FiLogOut, FiUserPlus, FiSettings, FiPackage } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

function Header() {
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const isAdmin = user?.role === 'ADMIN';

    return (
        <header className="site-header">
            <div className="logo">
                <Link to="/">
                    <img src="./Images/Logo/logo.png" alt="logo" className="logo-img-customer" />
                    Sri Bala Fashion
                </Link>
            </div>
            <nav>
                <ul>
                    <li>
                        <Link to="/" className="nav-link">
                            <FiHome /> Home
                        </Link>
                    </li>
                    <li>
                        <Link to="/shop" className="nav-link">
                            <FiShoppingBag /> Shop
                        </Link>
                    </li>
                    <li>
                        <Link to="/cart" className="nav-link">
                            <FiShoppingCart /> Cart
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </Link>
                    </li>
                    {user ? (
                        <>
                            <li>
                                <Link to="/my-orders" className="nav-link">
                                    <FiPackage /> My Orders
                                </Link>
                            </li>
                            {isAdmin && (
                                <li>
                                    <Link to="/admin" className="nav-link admin-nav-link">
                                        <FiSettings /> Admin Panel
                                    </Link>
                                </li>
                            )}
                            <li>
                                <span className="user-greeting">
                                    <FiUser style={{ marginRight: '0.3rem' }} />
                                    {user.email}
                                </span>
                            </li>
                            <li>
                                <button onClick={logout} className="btn-logout">
                                    <FiLogOut /> Logout
                                </button>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/login" className="nav-link">
                                    <FiUser /> Login
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="nav-link">
                                    <FiUserPlus /> Register
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </header>
    );
}

export default Header;
