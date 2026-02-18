import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const syncingRef = useRef(false);

    // Sync user to backend (find/create in DB) and get role
    const syncUserToBackend = useCallback(async (accessToken) => {
        if (syncingRef.current) return;
        syncingRef.current = true;
        try {
            const response = await axios.post('/api/auth/google',
                { accessToken },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const { email, role, fullName } = response.data;
            setUser({ email, role, fullName });
        } catch (err) {
            console.error('Failed to sync user to backend:', err);
            // Still set basic user info from token if backend sync fails
            try {
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                setUser({ email: payload.email || payload.sub, role: 'CUSTOMER', fullName: '' });
            } catch {
                // Token decode failed
            }
        } finally {
            syncingRef.current = false;
        }
    }, []);

    // Initialize: check for existing Supabase session
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token && mounted) {
                setToken(session.access_token);
                await syncUserToBackend(session.access_token);
            }
            if (mounted) setLoading(false);
        };

        initAuth();

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return;

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    if (session?.access_token) {
                        setToken(session.access_token);
                        await syncUserToBackend(session.access_token);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setToken(null);
                    setUser(null);
                }
            }
        );

        return () => {
            mounted = false;
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
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
