import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/analytics";

/** Page views first-party (reemplaza el autotrack de Amplitude). */
export const AnalyticsTracker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  return null;
};
