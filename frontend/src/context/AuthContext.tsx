
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { postJSON, fetchJSON } from '../lib/api';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    role: 'ADMIN' | 'USER';
    number?: number;
    position?: string;
    photo?: string | null;
    data?: any;
    kalkPlayer?: any;
    ppg?: number;
    rpg?: number;
    apg?: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('bkpk_token'));
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        if (token) {
            try {
                const data = await fetchJSON<{ user: User }>('/api/auth/me');
                setUser(data.user);
            } catch (err) {
                console.error('Failed to refresh user:', err);
            }
        }
    };

    useEffect(() => {
        if (token) {
            // Verify token and get user data
            fetchJSON<{ user: User }>('/api/auth/me')
                .then(data => setUser(data.user))
                .catch(() => {
                    // Invalid token
                    logout();
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (username: string, password: string) => {
        const data = await postJSON<{ user: User; token: string }>('/api/auth/login', { username, password });
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('bkpk_token', data.token);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('bkpk_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
