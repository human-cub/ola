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

// Microsoft Clarity (session replay + heatmaps). Пустой ID = выключено.
// Дима создаёт проект на clarity.microsoft.com и вписывает Project ID сюда.
const CLARITY_PROJECT_ID = ""
if (CLARITY_PROJECT_ID) {
  ;(function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] = c[a] || function (...args: unknown[]) { (c[a].q = c[a].q || []).push(args) }
    const t = l.createElement(r) as HTMLScriptElement
    t.async = true
    t.src = 'https://www.clarity.ms/tag/' + i
    const y = l.getElementsByTagName(r)[0]
    y.parentNode?.insertBefore(t, y)
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID)
}

// CartProvider живёт внутри App (поверх Routes). Второй провайдер здесь
// дублировал все стартовые запросы корзины и листа ожидания.
createRoot(document.getElementById("root")!).render(<App />);
