import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasPendingLogout = localStorage.getItem('pending_logout');
    if (hasPendingLogout) {
      api
        .post('/auth/logout')
        .then(() => {
          localStorage.removeItem('pendig_logout');
        })
        .catch((err) => {
          console.error(`При перемонтировке не удалось очистить куку ${err}`);
        });

      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
      })
      .catch((err) => {
        if (err.code === 'UNAUTHORIZED' || err.code === 'ACCOUNT_BLOCKED') {
          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    localStorage.removeItem('pending_logout');
    return res.data.user;
  }

  async function loginWithGoogle(credential) {
    const res = await api.post('/auth/google', { credential });
    setUser(res.data.user);
    localStorage.removeItem('pending_logout');
    return res.data.user;
  }

  async function register(email, password, name) {
    const res = await api.post('/auth/register', { email, password, name });
    return res.data;
  }

  async function logout() {
    setUser(null);
    try {
      await api.post('auth/logout');
    } catch (err) {
      console.error(`Ошибка сервера при выходе ${err} `);
      localStorage.setItem('pending_logout', 'yes');
    }
  }

  const value = { user, loading, login, loginWithGoogle, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
