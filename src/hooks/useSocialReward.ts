import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SocialRewardState = "loading" | "available" | "claimed";

/**
 * Instagram social reward (honor-system, Phase A).
 * Separate from the referral reward but with the same effect
 * (a one-time Súper-Precio on the user's group order).
 *   available -> user can claim (followed @ola.unity)
 *   claimed   -> social_reward_granted_at is set; the button is gone for good
 */
export function useSocialReward() {
  const [state, setState] = useState<SocialRewardState>("loading");

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setState("loading"); return; }
    const { data } = await supabase
      .from("profiles")
      .select("social_reward_granted_at")
      .eq("user_id", session.user.id)
      .maybeSingle();
    setState((data as any)?.social_reward_granted_at ? "claimed" : "available");
  }, []);

  useEffect(() => { void load(); }, [load]);

  const claim = useCallback(async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc("claim_social_reward" as any);
    if (error || data !== true) return false;
    setState("claimed");
    return true;
  }, []);

  return { state, claim, reload: load };
}
