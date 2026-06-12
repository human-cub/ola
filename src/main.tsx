import { createRoot } from 'react-dom/client'
import * as amplitude from '@amplitude/analytics-browser'
import App from './App.tsx'
import './index.css'
import { initAnalytics, mirrorToOwnAnalytics } from '@/lib/analytics'

// Аналитика first-party (своя БД): visitor/session/UTM + зеркало Amplitude-событий.
initAnalytics()

amplitude.init('8308e53a7a79469337419645b55075f8', {
  defaultTracking: {
    // Page views ведём сами (lib/analytics + AnalyticsTracker) — autotrack выжирал
    // квоту Amplitude Starter (10k событий/мес).
    pageViews: false,
  },
  transport: 'beacon',
})
amplitude.add(mirrorToOwnAnalytics())

// CartProvider живёт внутри App (поверх Routes). Второй провайдер здесь
// дублировал все стартовые запросы корзины и листа ожидания.
createRoot(document.getElementById("root")!).render(<App />);
