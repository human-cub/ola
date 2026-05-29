export const isSociosHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host.startsWith("socios.")) return true;
  // Dev fallback: ?socios=1 forces socios mode
  if (typeof window.location.search === "string" && new URLSearchParams(window.location.search).get("socios") === "1") {
    return true;
  }
  return false;
};

export const SOCIOS_ORIGIN = "https://socios.alaola.com.ar";

export const buildSociosInviteUrl = (token: string): string => {
  return `${SOCIOS_ORIGIN}/registro?token=${token}`;
};