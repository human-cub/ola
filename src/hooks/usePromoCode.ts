import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "ola_applied_promo";

export interface AppliedPromo {
  code: string;
  tier_bonus: number;
}

export function usePromoCode() {
  const [appliedPromo, setAppliedPromoState] = useState<AppliedPromo | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setAppliedPromo = useCallback((promo: AppliedPromo | null) => {
    setAppliedPromoState(promo);
    if (promo) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(promo));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Mirror the applied/removed promo onto the user's pending collective order
    // so the admin sees it and the order total matches (fire-and-forget).
    supabase
      .rpc("set_pending_collective_promo" as any, {
        _code: promo?.code ?? null,
        _tier: promo?.tier_bonus ?? null,
      })
      .then(() => {}, () => {});
  }, []);

  const removePromo = useCallback(() => setAppliedPromo(null), [setAppliedPromo]);

  return { appliedPromo, setAppliedPromo, removePromo };
}
