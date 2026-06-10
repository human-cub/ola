import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/referral";

const REF_RE = /^[A-Z2-9]{7}$/;

/**
 * On arrival via a personal referral link (?ref=CODE), record a unique click.
 * The server (record_referral_click) gates on viral_enabled, dedups by visitor,
 * applies a self-guard, and grants the referrer the share reward at the admin
 * threshold (referral_unlock_clicks). Fire-and-forget; runs once per load.
 */
export function useReferralClick() {
  useEffect(() => {
    try {
      const raw = new URLSearchParams(window.location.search).get("ref");
      if (!raw) return;
      const code = raw.trim().toUpperCase();
      if (!REF_RE.test(code)) return;
      void supabase
        .rpc("record_referral_click" as any, { _ref_code: code, _visitor_hash: getVisitorId() })
        .then(() => {}, () => {});
    } catch {
      /* ignore */
    }
  }, []);
}
