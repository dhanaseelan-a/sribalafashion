import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { FaInstagram, FaFacebookF, FaTwitter, FaYoutube } from 'react-icons/fa';

function Footer() {
    const [content, setContent] = useState(null);

    const fetchContent = useCallback(() => {
        axios.get('/api/content/home')
            .then(res => setContent(res.data))
            .catch(() => setContent(null));
    }, []);

    useEffect(() => {
        fetchContent();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchContent();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [fetchContent]);

    const address = content?.footerAddress || '123 Fashion Street, Chennai, India';
    const phone = content?.footerPhone || '+91 98765 43210';
    const email = content?.footerEmail || 'hello@sribalafashion.com';
    const instagram = content?.footerInstagram || '#';
    const facebook = content?.footerFacebook || '#';
    const twitter = content?.footerTwitter || '#';
    const youtube = content?.footerYoutube || '#';

    return (
        <footer className="site-footer">
            <div className="footer-grid">
                <div className="footer-brand">
                    <h3>Sri Bala Fashion</h3>
                    <p>
                        Discover the elegance of tradition with our exclusive collection of
                        handcrafted bangles, garlands, and fashion accessories. Quality and
                        craftsmanship you can trust.
                    </p>
                    <div className="footer-social">
                        <a href={instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                        <a href={facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
                        <a href={twitter} aria-label="Twitter" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                        <a href={youtube} aria-label="YouTube" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
                    </div>
                </div>

                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/shop">Shop</Link></li>
                        <li><Link to="/cart">Cart</Link></li>
                        <li><Link to="/login">My Account</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Categories</h4>
                    <ul>
                        <li><Link to="/shop">Bangles</Link></li>
                        <li><Link to="/shop">Garlands</Link></li>
                        <li><Link to="/shop">Accessories</Link></li>
                        <li><Link to="/shop">New Arrivals</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>Contact Us</h4>
                    <p><FiMapPin /> {address}</p>
                    <p><FiPhone /> {phone}</p>
                    <p><FiMail /> {email}</p>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Sri Bala Fashion. All rights reserved. Crafted with ❤️ in India.</p>
            </div>
        </footer>
    );
}

export default Footer;
