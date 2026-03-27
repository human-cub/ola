import { createRoot } from 'react-dom/client'
import * as amplitude from '@amplitude/analytics-browser'
import App from './App.tsx'
import { CartProvider } from './contexts/CartContext'
import './index.css'

amplitude.init('8308e53a7a79469337419645b55075f8', {
  defaultTracking: {
    pageViews: true,
  },
  transport: 'beacon',
})

createRoot(document.getElementById("root")!).render(
  <CartProvider>
    <App />
  </CartProvider>
);
