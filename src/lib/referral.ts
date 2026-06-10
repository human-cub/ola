// Personal referral code (?ref=CODE) capture + storage for the signup loop.
// Inert until the registration flow reads it (gated by app_settings.viral_enabled).
export const REF_STORAGE_KEY = "ola_ref_code";
const REF_RE = /^[A-Z2-9]{7}$/;

/** Read ?ref=CODE from the current URL and persist it (permanent until used). */
export function captureRefFromUrl(): void {
  try {
    const raw = new URLSearchParams(window.location.search).get("ref");
    if (!raw) return;
    const code = raw.trim().toUpperCase();
    if (REF_RE.test(code)) localStorage.setItem(REF_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function getStoredRef(): string | null {
  try {
    return localStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredRef(): void {
  try {
    localStorage.removeItem(REF_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

const VISITOR_KEY = "ola_visitor_id";
/** Stable per-browser id used to dedup unique referral-link clicks. */
export function getVisitorId(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) { v = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, v); }
    return v;
  } catch {
    return "anon";
  }
}
