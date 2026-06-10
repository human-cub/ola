import { supabase } from "@/integrations/supabase/client";

/**
 * Sign out and redirect, clearing the local Supabase session even when the
 * server logout fails or hangs.
 *
 * Some pre-migration JWTs carry a `session_id` that no longer exists in the
 * current Supabase project, so `supabase.auth.signOut()` returns 403
 * (`session_not_found`) and skips clearing local storage. The user then stays
 * "logged in" and the auth page bounces them straight back to the home page.
 * We cap the network call with a timeout and then force-clear the auth token,
 * so the logout always sticks.
 */
export async function signOutAndRedirect(to = "/ingresar"): Promise<void> {
  // Best-effort server-side revoke, but never let it block the logout.
  try {
    await Promise.race([
      supabase.auth.signOut(),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    /* ignore — local storage is cleared below regardless */
  }
  // Guarantee the local session is gone even if signOut() 403'd or timed out.
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  window.location.href = to;
}
