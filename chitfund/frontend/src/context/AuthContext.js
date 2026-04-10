import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

// Checks if a JWT token is expired client-side (no network round-trip needed)
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Fast client-side expiry check — avoids unnecessary API call
    if (isTokenExpired(token)) {
      clearSession();
      setUser(null);
      setLoading(false);
      return;
    }
    // Server-side token validation (catches revoked/deactivated accounts)
    api.get('/auth/me')
      .then(res => {
        const serverUser = res.data.user;
        serverUser.role = res.data.role || serverUser.role;
        setUser(serverUser);
        localStorage.setItem('user', JSON.stringify(serverUser));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    user.role = res.data.role || user.role || 'admin';
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const memberLogin = async (phone) => {
    const res = await api.post('/auth/member-login', { phone });
    const { token, user } = res.data;
    user.role = 'member';
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, memberLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
