import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Whether the current user has an unredeemed referral reward
 * (profiles.has_referral_reward) — a one-time Súper-Precio on their group order.
 * syncWaitingListOrder already writes the pending order at Súper using this flag;
 * the UI reads it here so the displayed price + a badge match what's charged.
 */
export function useReferralReward() {
  const [hasReward, setHasReward] = useState(false);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (mounted) setHasReward(false); return; }
      const { data } = await supabase
        .from("profiles")
        .select("has_referral_reward, has_social_reward")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (mounted) setHasReward(!!(data as any)?.has_referral_reward || !!(data as any)?.has_social_reward);
    })();
    return () => { mounted = false; };
  }, []);
  return { hasReward };
}
