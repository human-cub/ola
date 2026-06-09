import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PriceCurtainValue {
  /** Master flag: app_settings.price_curtain_enabled */
  enabled: boolean;
  /** Visitor is authenticated */
  isAuthenticated: boolean;
  /** enabled && !isAuthenticated — hide group prices / gate joining */
  curtained: boolean;
}

const Ctx = createContext<PriceCurtainValue>({
  enabled: false,
  isAuthenticated: false,
  curtained: false,
});

/**
 * Computes the group-price curtain state ONCE per app (one app_settings read +
 * one auth subscription) and exposes it via context, so each product card can
 * read it without firing its own query.
 */
export const PriceCurtainProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // master flag — single read on load
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "price_curtain_enabled")
        .maybeSingle();
      if (mounted) setEnabled((data as any)?.value === true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // session — initial + reactive
  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setIsAuthenticated(!!data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const curtained = enabled && !isAuthenticated;

  return (
    <Ctx.Provider value={{ enabled, isAuthenticated, curtained }}>
      {children}
    </Ctx.Provider>
  );
};

export const usePriceCurtain = () => useContext(Ctx);
