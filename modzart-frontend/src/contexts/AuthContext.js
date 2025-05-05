import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only run authentication check in browser environment
        if (isBrowser) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuth = async () => {
        if (!isBrowser) return;
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await authService.getCurrentUser();
                setUser(response.data);
            } catch (error) {
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (username, password) => {
        if (!isBrowser) throw new Error('Authentication is only available in browser');
        
        try {
            const response = await authService.login(username, password);
            localStorage.setItem('token', response.data.access_token);
            await checkAuth();
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Login failed');
        }
    };

    const register = async (userData) => {
        if (!isBrowser) throw new Error('Authentication is only available in browser');
        
        try {
            await authService.register(userData);
            await login(userData.username, userData.password);
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.detail || 'Registration failed');
        }
    };

    const logout = () => {
        if (!isBrowser) return;
        
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);