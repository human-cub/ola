import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PriceCurtainValue {
  /** Master flag: app_settings.price_curtain_enabled */
  enabled: boolean;
  /** A full member = authenticated AND not a guest-checkout account. */
  isFullMember: boolean;
  /** enabled && !isFullMember — hide group prices / gate joining (anon AND guests). */
  curtained: boolean;
}

const Ctx = createContext<PriceCurtainValue>({
  enabled: false,
  isFullMember: false,
  curtained: false,
});

/**
 * Computes the group-price curtain once per app. Anonymous visitors AND
 * guest-checkout accounts (role 'guest') are curtained until an admin
 * promotes the guest to a full member.
 */
export const PriceCurtainProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(false);
  const [isFullMember, setIsFullMember] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    const evaluate = async (session: { user?: { id: string } } | null) => {
      const user = session?.user;
      if (!user) {
        if (mounted) setIsFullMember(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "guest")
        .maybeSingle();
      if (mounted) setIsFullMember(!data); // a 'guest' role row => not a full member
    };
    void supabase.auth.getSession().then(({ data }) => evaluate(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      void evaluate(session);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const curtained = enabled && !isFullMember;

  return (
    <Ctx.Provider value={{ enabled, isFullMember, curtained }}>
      {children}
    </Ctx.Provider>
  );
};

export const usePriceCurtain = () => useContext(Ctx);
