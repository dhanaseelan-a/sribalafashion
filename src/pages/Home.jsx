import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GiRing, GiFlowerPot, GiNecklace } from 'react-icons/gi';
import { FiTruck, FiShield, FiAward, FiArrowRight, FiAlertCircle } from 'react-icons/fi';

function Home() {
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

        // Poll every 30s for live updates from admin (Disabled for free tier)
        // const interval = setInterval(fetchContent, 30000);

        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            // clearInterval(interval);
        };
    }, [fetchContent]);

    // Defaults (fallback if API fails)
    const heroTitle = content?.heroTitle || 'Welcome to Sri Bala Fashion';
    const heroSubtitle = content?.heroSubtitle || 'Discover our stunning collection of covering jewellery, imitation bangles, fashion accessories & garlands — elegant designs at affordable prices.';
    const promoTitle = content?.promoTitle || '✨ Special Collection Available Now ✨';
    const promoText = content?.promoText || 'Explore our latest covering jewellery arrivals – handcrafted with love and tradition.';
    const promoBtnText = content?.promoBtnText || 'Explore Collection';
    const featureTitle = content?.featureTitle || 'Why Choose Us';
    const featureSubtitle = content?.featureSubtitle || 'Quality covering jewellery you can trust';

    // Split heroTitle to highlight the brand name
    const renderHeroTitle = () => {
        if (heroTitle.includes('Sri Bala Fashion')) {
            const parts = heroTitle.split('Sri Bala Fashion');
            return <>{parts[0]}<span>Sri Bala Fashion</span>{parts[1]}</>;
        }
        return heroTitle;
    };

    return (
        <div>
            {/* Hero Section */}
            <section className="hero">
                <h1>{renderHeroTitle()}</h1>
                <p>{heroSubtitle}</p>
                <div className="hero-cta">
                    <Link to="/shop" className="btn btn-primary btn-lg">
                        <FiArrowRight /> Shop Now
                    </Link>
                    <Link to="/shop?category=Bangles" className="btn btn-outline-light btn-lg">
                        View Bangles
                    </Link>
                </div>
            </section>

            {/* Categories Section */}
            <section className="categories-section">
                <h2 className="section-title">Our Collections</h2>
                <p className="section-subtitle">
                    Explore our curated selection of covering jewellery & accessories
                </p>
                <div className="category-grid">
                    <Link to="/shop?category=Bangles" className="category-card" style={{ textDecoration: 'none' }}>
                        <div className="category-icon bangles">
                            <GiRing />
                        </div>
                        <h3>Covering Bangles</h3>
                        <p>Exquisite imitation bangles for every occasion</p>
                    </Link>
                    <Link to="/shop?category=Garlands" className="category-card" style={{ textDecoration: 'none' }}>
                        <div className="category-icon garlands">
                            <GiFlowerPot />
                        </div>
                        <h3>Garlands</h3>
                        <p>Vetiver, Khus & other natural garlands for every occasion</p>
                    </Link>
                    <Link to="/shop?category=Accessories" className="category-card" style={{ textDecoration: 'none' }}>
                        <div className="category-icon accessories">
                            <GiNecklace />
                        </div>
                        <h3>Fashion Accessories</h3>
                        <p>Complete your look with our stunning covering accessories</p>
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">{featureTitle}</h2>
                <p className="section-subtitle">{featureSubtitle}</p>
                <div className="features-grid">
                    <div className="feature-item">
                        <div className="feature-icon">
                            <FiAward />
                        </div>
                        <h4>Premium Covering Quality</h4>
                        <p>Every piece is crafted with the finest covering materials and utmost attention to detail.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <FiTruck />
                        </div>
                        <h4>Fast Delivery</h4>
                        <p>We deliver across India with secure packaging and timely shipping.</p>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon">
                            <FiShield />
                        </div>
                        <h4>Trusted Brand</h4>
                        <p>Thousands of happy customers trust us for quality and affordable fashion jewellery.</p>
                    </div>
                </div>
            </section>

            {/* Promo Banner */}
            <section className="promo-banner">
                <h2>{promoTitle}</h2>
                <p>{promoText}</p>
                <Link to="/shop" className="btn btn-secondary btn-lg" style={{ position: 'relative' }}>
                    {promoBtnText}
                </Link>
            </section>

            {/* Disclaimer / Important Notice Section */}
            <section className="disclaimer-section">
                <div className="disclaimer-banner-visual">
                    <div className="disclaimer-icon-row">
                        <span className="disclaimer-deco-icon"><FiAward /></span>
                        <span className="disclaimer-deco-icon"><FiTruck /></span>
                        <span className="disclaimer-deco-icon"><FiShield /></span>
                    </div>
                    <div className="disclaimer-badge">
                        <FiAlertCircle style={{ fontSize: '1.5rem' }} />
                        <span>Important Notice</span>
                    </div>
                </div>
                <div className="disclaimer-content">
                    <h3>📋 Disclaimer</h3>
                    <p>
                        <strong>This is NOT real gold, silver, or diamond jewellery.</strong> All products sold
                        on Sri Bala Fashion are <strong>covering (imitation) jewellery, bangles, and fashion accessories</strong>.
                        Product images are for illustration purposes only. Actual products may vary slightly in
                        color, design, and finish due to the handcrafted nature of our items. Each piece is unique
                        and made with care. Colors may also appear differently depending on your device settings.
                        For any queries, please contact our support team.
                    </p>
                </div>
            </section>
        </div>
    );
}

export default Home;
