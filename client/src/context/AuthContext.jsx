import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        if (err.code === 'UNAUTHORIZED') {
          localStorage.removeItem('token');
          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });

    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);

    return res.data.user;
  }

  async function register(email, password, name) {
    const res = await api.post('/auth/register', { email, password, name });

    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);

    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  const value = { user, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
