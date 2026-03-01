import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { clearAuth, getToken, getUser, setToken, setUser } from '../utils/authStorage';
import { NOTES_KEY } from '../utils/noteStorage';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: validate stored token with /api/auth/me
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u: User) => {
        setUserState(u);
        setUser(u);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Sign in failed');
    localStorage.removeItem(NOTES_KEY); // clear previous user's note cache
    setToken(data.token as string);
    setUser(data.user as User);
    setUserState(data.user as User);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Registration failed');
    localStorage.removeItem(NOTES_KEY); // clear previous user's note cache
    setToken(data.token as string);
    setUser(data.user as User);
    setUserState(data.user as User);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(NOTES_KEY); // clear note cache on logout
    clearAuth();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Convenience: cached user for non-hook contexts (e.g. api.ts)
export { getUser };
