import { useState, useEffect, useCallback } from "react";

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
  }, []);

  const removePromo = useCallback(() => setAppliedPromo(null), [setAppliedPromo]);

  return { appliedPromo, setAppliedPromo, removePromo };
}
