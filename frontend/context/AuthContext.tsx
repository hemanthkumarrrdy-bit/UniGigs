'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'client' | 'admin';
  avatar?: string;
  bio?: string;
  skills?: string[];
  rating?: number;
  reviewCount?: number;
  earnings?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      // Verify token is still valid — keep loading=true until resolved
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          // Token invalid — clear auth
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setTokenCookie = (token: string) => {
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  };

  const clearTokenCookie = () => {
    document.cookie = 'token=; path=/; max-age=0';
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setTokenCookie(token);
    setUser(userData);
    return userData; // return user so caller can redirect by role
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    const { token, ...userData } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setTokenCookie(token);
    setUser(userData);
    return userData; // return user so caller can redirect by role
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearTokenCookie();
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    const updated = { ...user, ...data } as User;
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
