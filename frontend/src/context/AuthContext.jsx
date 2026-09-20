import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true during initial auth restore

  // ─── Restore session from localStorage on app start ───────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setCurrentUser(parsedUser);

        // Validate token against the server (catches expired/revoked tokens)
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.user) {
              setCurrentUser(res.data.user);
              localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // Token invalid or expired — clear everything
            clearSession();
          })
          .finally(() => setLoading(false));
      } catch {
        clearSession();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // ─── Internal helpers ─────────────────────────────────────────────────────
  const persistSession = (newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setCurrentUser(newUser);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setCurrentUser(null);
  };

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Register a new user.
   * Throws on error so the calling component can display the message.
   */
  const register = useCallback(async ({ username, email, phone, password, confirmPassword }) => {
    const res = await api.post('/auth/register', {
      username,
      email,
      phone,
      password,
      confirmPassword,
      // NOTE: role is NOT sent — backend always assigns USER
    });
    return res;
  }, []);

  /**
   * Log in with username + password.
   * Persists token and user to localStorage.
   * Returns the logged-in user so the caller can redirect by role.
   */
  const login = useCallback(async ({ username, password }) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data?.token && res.data?.user) {
      persistSession(res.data.token, res.data.user);
      return res.data.user;
    }
    throw new Error('Invalid response structure from server.');
  }, []);

  /**
   * Log out: clear all auth state and storage.
   */
  const logout = useCallback(() => {
    clearSession();
  }, []);

  const updateCurrentUser = useCallback((user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const isAuthenticated = Boolean(currentUser && token);
  const role = currentUser?.role ?? null;
  const isAdmin = role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        role,
        isAuthenticated,
        isAdmin,
        loading,
        register,
        login,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth — convenience hook
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
