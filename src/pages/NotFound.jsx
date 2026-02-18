import { Link } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';

function NotFound() {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="not-found-code">404</div>
                <div className="not-found-icon">✦</div>
                <h1>Page Not Found</h1>
                <p>
                    Oops! The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                <div className="not-found-actions">
                    <Link to="/" className="btn btn-primary btn-lg">
                        <FiHome /> Go Home
                    </Link>
                    <Link to="/shop" className="btn btn-outline-light btn-lg">
                        <FiShoppingBag /> Browse Shop
                    </Link>
                </div>

                <button
                    onClick={() => window.history.back()}
                    className="not-found-back-link"
                >
                    <FiArrowLeft /> Go back to previous page
                </button>
            </div>
        </div>
    );
}

export default NotFound;
