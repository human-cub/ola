import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredRef, clearStoredRef } from "@/lib/referral";

/**
 * When an authenticated user has a captured ?ref= code (and the viral system is enabled),
 * record who referred them (set-once, server-side via set_referred_by) and clear the code.
 * Runs on mount and on every sign-in, so it covers both email and Google.
 */
export function useReferralClaim() {
  useEffect(() => {
    const claim = async () => {
      const ref = getStoredRef();
      if (!ref) return;
      const { data: flag } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "viral_enabled")
        .maybeSingle();
      if (!(flag as any)?.value) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // keep the code until the user signs in
      await supabase.rpc("set_referred_by" as any, { _ref_code: ref }).then(() => {}, () => {});
      clearStoredRef();
    };
    void claim();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void claim();
    });
    return () => sub.subscription.unsubscribe();
  }, []);
}
