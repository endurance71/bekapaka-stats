
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { postJSON, fetchJSON, setUnauthorizedHandler, ApiError, clearApiCache } from '../lib/api';
import { normalizePlayerIdentity } from '../shared/lib/playerIdentity';

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
    /** Pierwsza piątka (flaga składu) */
    starter?: boolean;
    /** Slug KALK — tożsamość zawodnika w danych ligi */
    kalkSlug?: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    /** Nowy token po zmianie hasła (serwer unieważnia starsze) */
    updateToken: (token: string) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'bkpk_token';
/** Ostatni profil z `/api/auth/me` — pozwala otworzyć aplikację bez zasięgu (hala, metro). */
const USER_KEY = 'bkpk_user';

function readCachedUser(): User | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
}

/** Wylogowanie tylko, gdy serwer odrzucił sesję; brak sieci i błędy serwera zostawiają zawodnika zalogowanego. */
export function isSessionRejected(err: unknown): boolean {
    return err instanceof ApiError && err.status === 401;
}

/** Czyści dane użytkownika z pamięci telefonu (cache service workera z odpowiedziami API). */
async function clearOfflineData() {
    try {
        if (typeof caches === 'undefined') return;
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
        // brak Cache API (prywatne okno) — nic do czyszczenia
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(true);

    const rememberUser = useCallback((u: User) => {
        const normalized = normalizePlayerIdentity(u);
        setUser(normalized);
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(normalized));
        } catch {
            // pełna pamięć / prywatne okno — działa bez zapamiętania
        }
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        clearApiCache();
        void clearOfflineData();
    }, []);

    const updateToken = useCallback((next: string) => {
        localStorage.setItem(TOKEN_KEY, next);
        setToken(next);
    }, []);

    const refreshUser = useCallback(async () => {
        if (token) {
            try {
                const data = await fetchJSON<{ user: User }>('/api/auth/me');
                rememberUser(data.user);
            } catch (err) {
                if (isSessionRejected(err)) logout();
            }
        }
    }, [token, logout, rememberUser]);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            logout();
            // Już na logowaniu (np. przekierował tam ProtectedRoute) — bez zagnieżdżania ?redirect=/login?redirect=…
            if (window.location.pathname.startsWith('/login')) return;
            const redirect = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.assign(`/login?redirect=${redirect}`);
        });
        return () => setUnauthorizedHandler(null);
    }, [logout]);

    useEffect(() => {
        if (token) {
            fetchJSON<{ user: User }>('/api/auth/me')
                .then((data) => rememberUser(data.user))
                .catch((err) => {
                    if (isSessionRejected(err)) {
                        logout();
                        return;
                    }
                    // Brak sieci / serwer niedostępny: ostatni znany profil, dane stron pokażą błąd z „Spróbuj ponownie”
                    const cached = readCachedUser();
                    if (cached) setUser(cached);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token, logout, rememberUser]);

    const login = useCallback(async (username: string, password: string) => {
        const data = await postJSON<{ user: User; token: string }>('/api/auth/login', { username, password });
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        rememberUser(data.user);
    }, [rememberUser]);

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated: !!user,
            login,
            logout,
            refreshUser,
            updateToken,
            loading
        }),
        [user, token, login, logout, refreshUser, updateToken, loading]
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

/** Admin (trener) — narzędzia i komunikaty techniczne; zawodnik ich nie widzi. */
export function useIsAdmin(): boolean {
    return useAuth().user?.role === 'ADMIN';
}
