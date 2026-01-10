import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { CartProvider } from './contexts/CartContext'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <App />
  </CartProvider>
);
