import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import App from './App.jsx';
import CartErrorBanner from './components/CartErrorBanner.jsx';
import FavoritesErrorBanner from './components/FavoritesErrorBanner.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <CartErrorBanner />
            <FavoritesErrorBanner />
            <App />
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
