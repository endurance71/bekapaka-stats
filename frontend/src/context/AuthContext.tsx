
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { postJSON, fetchJSON, setUnauthorizedHandler } from '../lib/api';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    role: 'ADMIN' | 'USER';
    number?: number;
    position?: string;
    photo?: string | null;
    data?: Record<string, unknown>;
    kalkPlayer?: Record<string, unknown>;
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

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('bkpk_token');
    }, []);

    const refreshUser = useCallback(async () => {
        if (token) {
            try {
                const data = await fetchJSON<{ user: User }>('/api/auth/me');
                setUser(data.user);
            } catch {
                logout();
            }
        }
    }, [token, logout]);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            logout();
            const redirect = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.assign(`/login?redirect=${redirect}`);
        });
        return () => setUnauthorizedHandler(null);
    }, [logout]);

    useEffect(() => {
        if (token) {
            fetchJSON<{ user: User }>('/api/auth/me')
                .then(data => setUser(data.user))
                .catch(() => {
                    logout();
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token, logout]);

    const login = useCallback(async (username: string, password: string) => {
        const data = await postJSON<{ user: User; token: string }>('/api/auth/login', { username, password });
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('bkpk_token', data.token);
    }, []);

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated: !!user,
            login,
            logout,
            refreshUser,
            loading
        }),
        [user, token, login, logout, refreshUser, loading]
    );

    return (
        <AuthContext.Provider value={value}>
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
