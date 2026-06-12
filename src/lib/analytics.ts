// First-party analytics: events go to our own analytics_events table (Supabase).
// Amplitude stays as a secondary sink for key events; this module also exposes an
// Amplitude enrichment plugin that mirrors every amplitude.track() call into our DB,
// so existing instrumentation keeps working without touching call sites.
import type { Types } from "@amplitude/analytics-browser";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/lib/referral";

const SESSION_KEY = "ola_an_session"; // sessionStorage: { id, last }
const NO_TRACK_KEY = "ola_no_track"; // "1" = this browser belongs to an admin, never track
const FIRST_TOUCH_KEY = "ola_first_touch"; // localStorage, set once per visitor
const SESSION_GAP_MS = 30 * 60 * 1000;

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>> & { ref?: string };

interface EventRow {
  visitor_id: string;
  session_id: string;
  user_id: string | null;
  event: string;
  props: Record<string, unknown>;
  path: string | null;
  referrer: string | null;
  utm: Utm | null;
  device: string | null;
}

let currentUserId: string | null = null;
let noTrack = false;
try { noTrack = localStorage.getItem("ola_no_track") === "1"; } catch { /* ignore */ }
let sessionUtm: Utm | null = null;
let sessionReferrerSent = false;
let queue: EventRow[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;

function readUtmFromUrl(): Utm | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Utm = {};
    let any = false;
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) { utm[k] = v.slice(0, 120); any = true; }
    }
    const ref = params.get("ref");
    if (ref) { utm.ref = ref.slice(0, 16); any = true; }
    return any ? utm : null;
  } catch {
    return null;
  }
}

/** Rolling 30-min session id (new id after 30 min of inactivity). */
function getSessionId(): string {
  try {
    const now = Date.now();
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const s = JSON.parse(raw) as { id: string; last: number };
      if (now - s.last < SESSION_GAP_MS) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: s.id, last: now }));
        return s.id;
      }
    }
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }));
    sessionReferrerSent = false; // new session → resend referrer once
    return id;
  } catch {
    return "no-session";
  }
}

/** First-touch attribution: stored once, never overwritten. */
function captureFirstTouch(utm: Utm | null): void {
  try {
    if (localStorage.getItem(FIRST_TOUCH_KEY)) return;
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify({
      utm,
      referrer: document.referrer || null,
      landing: window.location.pathname,
      ts: new Date().toISOString(),
    }));
  } catch { /* ignore */ }
}

export function getFirstTouch(): { utm: Utm | null; referrer: string | null; landing: string; ts: string } | null {
  try {
    const raw = localStorage.getItem(FIRST_TOUCH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function device(): string {
  try {
    return window.innerWidth < 768 ? "mobile" : "desktop";
  } catch {
    return "unknown";
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { void flush(); }, 2500);
}

async function flush(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    await supabase.from("analytics_events").insert(batch as never[]);
  } catch { /* fire-and-forget */ }
}

/** Track an event into our own analytics_events table. */
export function track(event: string, props: Record<string, unknown> = {}): void {
  try {
    if (noTrack) return;
    if (window.location.pathname.startsWith("/admin")) return;
    queue.push({
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      user_id: currentUserId,
      event: event.slice(0, 80),
      props,
      path: window.location.pathname,
      referrer: sessionReferrerSent ? null : (document.referrer || null),
      utm: sessionUtm,
      device: device(),
    });
    sessionReferrerSent = true;
    scheduleFlush();
  } catch { /* never break the app over analytics */ }
}

export function trackPageView(path: string): void {
  track("Page View", { title: document.title.slice(0, 120) });
  void path; // path is read from window.location inside track()
}

/**
 * Amplitude enrichment plugin: mirrors every amplitude.track() into our DB.
 * Skips Amplitude-internal events ([Amplitude] ...).
 */
export function mirrorToOwnAnalytics(): Types.EnrichmentPlugin {
  return {
    name: "mirror-to-own-analytics",
    type: "enrichment",
    setup: async () => undefined,
    execute: async (event) => {
      const t = event.event_type;
      if (t && !t.startsWith("[Amplitude]")) {
        track(t, (event.event_properties as Record<string, unknown>) ?? {});
      }
      return event;
    },
  };
}

/**
 * Admin opt-out: once an admin signs in on this browser, flag the device and
 * stop sending events forever (covers their anonymous sessions too). The
 * report RPC additionally filters admin visitor_ids server-side, so history
 * is clean retroactively as well.
 */
async function refreshNoTrack(uid: string | null): Promise<void> {
  if (!uid || noTrack) return;
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    if (data) {
      noTrack = true;
      try { localStorage.setItem(NO_TRACK_KEY, "1"); } catch { /* ignore */ }
      queue = [];
    }
  } catch { /* ignore */ }
}

/** Call once at app start (main.tsx). */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;
  try {
    sessionUtm = readUtmFromUrl();
    captureFirstTouch(sessionUtm);

    // Keep user_id in sync (events before login stay anonymous but share visitor_id,
    // so journeys stitch together once the user signs up).
    void supabase.auth.getSession().then(({ data }) => {
      currentUserId = data.session?.user?.id ?? null;
      void refreshNoTrack(currentUserId);
    });
    supabase.auth.onAuthStateChange((_e, session) => {
      currentUserId = session?.user?.id ?? null;
      void refreshNoTrack(currentUserId);
    });

    // Flush on tab hide/close so we lose as little as possible.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void flush();
    });
    window.addEventListener("pagehide", () => { void flush(); });
  } catch { /* ignore */ }
}
