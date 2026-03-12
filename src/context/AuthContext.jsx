import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

// Maximum time to wait for auth before showing the page anyway
const MAX_AUTH_WAIT_MS = 3000;

// Branded loading screen shown while auth initializes (max 3s)
function AuthLoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #FFF8F0 0%, #FFF0E6 100%)',
            fontFamily: "'Playfair Display', serif"
        }}>
            <div style={{
                fontSize: '1.5rem',
                color: '#6B0F2A',
                fontWeight: 600,
                marginBottom: '1rem',
                letterSpacing: '0.02em'
            }}>
                Sri Bala Fashion
            </div>
            <div style={{
                width: '36px',
                height: '36px',
                border: '3px solid #F3E8DC',
                borderTopColor: '#6B0F2A',
                borderRadius: '50%',
                animation: 'authSpin 0.8s linear infinite'
            }} />
            <style>{`@keyframes authSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// Extract basic user info from a JWT token (instant, no network call)
function getUserFromJwt(accessToken) {
    try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const meta = payload.user_metadata || {};
        return {
            email: payload.email || meta.email || payload.sub,
            role: 'CUSTOMER', // Default role; backend sync will update if ADMIN
            fullName: meta.full_name || meta.name || ''
        };
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const syncingRef = useRef(false);
    const initDoneRef = useRef(false); // Prevents duplicate sync from initAuth + onAuthStateChange

    // Sync user to backend (find/create in DB) and get role — runs in background
    const syncUserToBackend = useCallback(async (accessToken) => {
        if (syncingRef.current) return;
        syncingRef.current = true;
        try {
            // Extract full name from JWT payload to send to backend
            const jwtUser = getUserFromJwt(accessToken);
            const fullName = jwtUser?.fullName || '';

            const response = await axios.post('/api/auth/google',
                { accessToken, fullName },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const { email, role, fullName: responseName } = response.data;
            // Update user with backend data (mainly for role)
            setUser(prev => ({
                email: email || prev?.email,
                role: role || prev?.role || 'CUSTOMER',
                fullName: responseName || prev?.fullName
            }));
        } catch (err) {
            console.error('Failed to sync user to backend:', err);
            // JWT user was already set; no action needed on failure
        } finally {
            syncingRef.current = false;
        }
    }, []);

    // Initialize: check for existing Supabase session
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token && mounted) {
                    setToken(session.access_token);
                    // Set user instantly from JWT (no network wait)
                    const jwtUser = getUserFromJwt(session.access_token);
                    if (jwtUser) setUser(jwtUser);
                    initDoneRef.current = true;
                    // Sync role from backend in background (non-blocking)
                    syncUserToBackend(session.access_token);
                }
            } catch (err) {
                console.error('Auth init failed:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initAuth();

        // Safety net: ALWAYS stop loading after MAX_AUTH_WAIT_MS
        // This prevents blank screen even if Supabase hangs
        const timeout = setTimeout(() => {
            if (mounted) setLoading(false);
        }, MAX_AUTH_WAIT_MS);

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (session?.access_token) {
                        setToken(session.access_token);
                        // Set user instantly from JWT (no waiting for backend)
                        const jwtUser = getUserFromJwt(session.access_token);
                        if (jwtUser) setUser(jwtUser);
                        setLoading(false);

                        // Fix mobile desktop-site issue: after OAuth callback,
                        // the URL has a long #access_token hash that can trigger
                        // Chrome mobile to enable "Request Desktop Site".
                        // A clean redirect strips the hash and forces proper viewport,
                        // which is exactly what a manual refresh does.
                        const hash = window.location.hash;
                        if (event === 'SIGNED_IN' && hash &&
                            (hash.includes('access_token') || hash.includes('refresh_token'))) {
                            window.location.replace(window.location.origin + window.location.pathname);
                            return;
                        }

                        // Skip duplicate sync if initAuth already handled this session
                        if (initDoneRef.current && event === 'SIGNED_IN') {
                            initDoneRef.current = false; // Reset for future events
                            return;
                        }
                        // Sync role from backend in background (non-blocking)
                        syncUserToBackend(session.access_token);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setToken(null);
                    setUser(null);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [syncUserToBackend]);

    // Configure axios to always send the current Supabase token
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use((config) => {
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (error.response?.status === 401 && token) {
                    // Token might be expired, try to refresh
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                        // Session truly expired, logout
                        setToken(null);
                        setUser(null);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [token]);

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/' }
        });
        if (error) {
            return { success: false, message: error.message };
        }
        return { success: true };
    };

    const logout = async () => {
        // Clear local state first for instant UX
        localStorage.removeItem('cart');
        setToken(null);
        setUser(null);
        // Then sign out from Supabase (clears browser token)
        await supabase.auth.signOut();
        // Dispatch logout event for CartContext
        window.dispatchEvent(new Event('app-logout'));
    };

    return (
        <AuthContext.Provider value={{ user, token, loginWithGoogle, logout, loading }}>
            {loading ? <AuthLoadingScreen /> : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
