import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiFilter } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';

function Shop() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category') || '';

    const fetchProducts = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const url = category ? `/api/products?category=${category}` : '/api/products';
            const response = await axios.get(url);
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        fetchProducts(true);
    }, [fetchProducts]);

    // Auto-polling removed for free tier optimization
    // useEffect(() => {
    //     const interval = setInterval(() => fetchProducts(false), 10000);
    //     return () => clearInterval(interval);
    // }, [fetchProducts]);

    const categories = ['', 'Bangles', 'Garlands', 'Accessories'];

    const handleCategoryChange = (cat) => {
        if (cat) {
            setSearchParams({ category: cat });
        } else {
            setSearchParams({});
        }
    };

    return (
        <div>
            <div className="shop-header">
                <h2>Shop Collection</h2>
                <p>Explore our curated selection of traditional and modern designs</p>
            </div>

            <div className="filter-pills">
                <FiFilter style={{ color: 'var(--clr-gray-400)', marginRight: '0.25rem', alignSelf: 'center' }} />
                {categories.map(cat => (
                    <button
                        key={cat || 'all'}
                        onClick={() => handleCategoryChange(cat)}
                        className={`filter-pill ${category === cat ? 'active' : ''}`}
                    >
                        {cat || 'All Products'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <span className="loading-text">Loading products...</span>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Shop;
