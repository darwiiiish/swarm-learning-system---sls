import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sls_token'));
  const [loading, setLoading] = useState(true);

  // Auto-verify token and fetch profile on app load/mount
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token is invalid/expired
          logout();
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (regnum, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ regnum, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please verify credentials.');
      }

      localStorage.setItem('sls_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login action error:', error);
      throw error;
    }
  };

  const signup = async (regnum, name, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ regnum, name, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed. Please try again.');
      }

      localStorage.setItem('sls_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Signup action error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('sls_token');
    setToken(null);
    setUser(null);
  };

  // Helper to make authenticated requests easily
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    return fetch(url, { ...options, headers });
  };

  const updateUserScore = (newScore) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        contribution_score: newScore
      };
    });
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    authFetch,
    updateUserScore,
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
