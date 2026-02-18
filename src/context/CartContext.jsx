import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    // Sync cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Listen for logout: when AuthContext removes 'cart' from localStorage,
    // the 'storage' event fires in the same tab via a custom dispatch,
    // or we check on the 'storage' event from other tabs.
    // We also listen for a custom 'logout' event dispatched by AuthContext.
    useEffect(() => {
        const handleLogoutEvent = () => {
            setCartItems([]);
        };

        window.addEventListener('app-logout', handleLogoutEvent);

        // Also listen for storage changes from other tabs
        const handleStorageChange = (e) => {
            if (e.key === 'cart' && e.newValue === null) {
                setCartItems([]);
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('app-logout', handleLogoutEvent);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const addToCart = (product, quantity = 1) => {
        const discount = product.discountPercent || 0;
        const finalPrice = discount > 0
            ? Math.round(product.price * (1 - discount / 100))
            : product.price;

        // Use composite key: productId + selectedSize for uniqueness
        const cartKey = product.selectedSize ? `${product.id}-${product.selectedSize}` : `${product.id}`;

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.cartKey === cartKey);
            if (existingItem) {
                const newQty = existingItem.quantity + quantity;
                const maxQty = product.stock != null ? Math.min(newQty, product.stock) : newQty;
                return prevItems.map(item =>
                    item.cartKey === cartKey
                        ? { ...item, quantity: maxQty, finalPrice, discountPercent: discount, originalPrice: product.price, stock: product.stock }
                        : item
                );
            }
            const maxQty = product.stock != null ? Math.min(quantity, product.stock) : quantity;
            return [...prevItems, {
                ...product,
                cartKey,
                quantity: maxQty,
                finalPrice,
                originalPrice: product.price,
                discountPercent: discount,
                stock: product.stock
            }];
        });
    };

    const removeFromCart = (cartKey) => {
        setCartItems(prevItems => prevItems.filter(item => item.cartKey !== cartKey));
    };

    const updateQuantity = (cartKey, quantity) => {
        if (quantity < 1) return;
        setCartItems(prevItems =>
            prevItems.map(item => {
                if (item.cartKey === cartKey) {
                    const maxQty = item.stock != null ? Math.min(quantity, item.stock) : quantity;
                    return { ...item, quantity: maxQty };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const cartTotal = cartItems.reduce((total, item) => {
        const price = item.finalPrice != null ? item.finalPrice : item.price;
        return total + (price * item.quantity);
    }, 0);
    const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
