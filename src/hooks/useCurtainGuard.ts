import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredRef } from "@/lib/referral";
import { toast } from "sonner";

/**
 * Closes the Google sign-in bypass of the price curtain.
 * When the curtain is on, a brand-new account created via Google that wasn't
 * referred is signed out and sent to the contact gate. Existing members and
 * referred users pass. Email signups are gated at the register form, and guest
 * checkout (provider=email) is intentionally exempt — so this only judges Google.
 * Runs only on the SIGNED_IN moment (not on reloads), with a short delay so
 * useReferralClaim can persist referred_by first (avoids a race).
 */
export function useCurtainGuard() {
  useEffect(() => {
    const guard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      if (user.app_metadata?.provider !== "google") return; // only Google can bypass
      const createdMs = new Date(user.created_at).getTime();
      if (Date.now() - createdMs > 60_000) return; // only brand-new accounts; returning members pass

      const { data: flag } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "price_curtain_enabled")
        .maybeSingle();
      if ((flag as any)?.value !== true) return; // curtain off -> nothing to enforce

      if (getStoredRef()) return; // arrived via a member link
      const { data: profile } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("user_id", user.id)
        .maybeSingle();
      if ((profile as any)?.referred_by) return; // referral persisted -> allowed

      // Cold Google signup under the curtain -> block.
      await supabase.auth.signOut();
      toast.error("El acceso es solo para miembros. Escribinos o entrá con el link de un invitado.");
      window.location.href = "/ingresar";
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setTimeout(() => void guard(), 2000);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
}
