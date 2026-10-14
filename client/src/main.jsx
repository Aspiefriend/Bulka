import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext.jsx';
import App from './App.jsx';
import CartErrorBanner from './components/CartErrorBanner.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <CartErrorBanner />
        <App />
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);
