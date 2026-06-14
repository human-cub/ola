import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SocialRewardState = "loading" | "available" | "claimed";

/**
 * Instagram social reward (honor-system, Phase A).
 * The user confirms the follow by entering their Instagram handle, which is
 * stored on profiles.instagram_handle. Same effect as the referral reward
 * (a one-time Súper-Precio on the group order); granted once per account.
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

  const claim = useCallback(async (handle: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc("claim_social_reward" as any, { _handle: handle });
    if (error || data !== true) return false;
    setState("claimed");
    return true;
  }, []);

  return { state, claim, reload: load };
}
