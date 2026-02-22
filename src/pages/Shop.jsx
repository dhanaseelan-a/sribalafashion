import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiFilter } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard';

// Simple in-memory + sessionStorage cache (survives same-tab navigation, clears on tab close)
const CACHE_KEY = 'sbf_products_cache';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

function getCachedProducts(category) {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        const key = category || '__ALL__';
        const entry = cache[key];
        if (entry && Date.now() - entry.ts < CACHE_TTL) {
            return entry.data;
        }
    } catch { /* ignore */ }
    return null;
}

function setCachedProducts(category, data) {
    try {
        let cache = {};
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) cache = JSON.parse(raw);
        cache[category || '__ALL__'] = { data, ts: Date.now() };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch { /* ignore */ }
}

// Skeleton card placeholder
function SkeletonCard() {
    return (
        <div className="product-card" style={{ pointerEvents: 'none' }}>
            <div className="product-card-image">
                <div style={{
                    width: '100%', height: '220px',
                    background: 'linear-gradient(110deg, #f0e6d6 30%, #f5efe5 50%, #f0e6d6 70%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                }} />
            </div>
            <div className="product-card-body">
                <div style={{
                    height: '1.1rem', width: '70%', borderRadius: '4px', marginBottom: '0.75rem',
                    background: 'linear-gradient(110deg, #e8e0d4 30%, #f0ebe3 50%, #e8e0d4 70%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite'
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                        height: '1rem', width: '35%', borderRadius: '4px',
                        background: 'linear-gradient(110deg, #e8e0d4 30%, #f0ebe3 50%, #e8e0d4 70%)',
                        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite'
                    }} />
                    <div style={{
                        height: '2rem', width: '4.5rem', borderRadius: '6px',
                        background: 'linear-gradient(110deg, #e8e0d4 30%, #f0ebe3 50%, #e8e0d4 70%)',
                        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite'
                    }} />
                </div>
            </div>
        </div>
    );
}

function Shop() {
    const [products, setProducts] = useState(() => getCachedProducts('') || []);
    const [loading, setLoading] = useState(() => !getCachedProducts(''));
    const [searchParams, setSearchParams] = useSearchParams();
    const category = searchParams.get('category') || '';
    const abortRef = useRef(null);

    const fetchProducts = useCallback(async () => {
        // Check cache first
        const cached = getCachedProducts(category);
        if (cached) {
            setProducts(cached);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Cancel previous in-flight request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const url = category ? `/api/products?category=${category}` : '/api/products';
            const response = await axios.get(url, { signal: controller.signal });
            setProducts(response.data);
            setCachedProducts(category, response.data);
        } catch (error) {
            if (!axios.isCancel(error)) {
                console.error("Error fetching products:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => {
        // Instantly show cached data if available, then still fetch fresh
        const cached = getCachedProducts(category);
        if (cached) {
            setProducts(cached);
            setLoading(false);
        } else {
            setLoading(true);
        }
        fetchProducts();

        return () => {
            if (abortRef.current) abortRef.current.abort();
        };
    }, [fetchProducts, category]);

    const categories = ['', 'Bangles', 'Garlands', 'Accessories'];

    const handleCategoryChange = (cat) => {
        if (cat) {
            setSearchParams({ category: cat });
        } else {
            setSearchParams({});
        }
    };

    // Show 6 skeleton cards while loading (matches a typical grid)
    const skeletonCount = 6;

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

            {loading && products.length === 0 ? (
                <div className="products-grid">
                    {Array.from({ length: skeletonCount }, (_, i) => (
                        <SkeletonCard key={i} />
                    ))}
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
