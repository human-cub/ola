export const isSociosHost = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host.startsWith("socios.")) return true;
  // Path-based portal: alaola.com.ar/socios/*
  if (window.location.pathname === "/socios" || window.location.pathname.startsWith("/socios/")) {
    return true;
  }
  // Dev fallback: ?socios=1 forces socios mode
  if (typeof window.location.search === "string" && new URLSearchParams(window.location.search).get("socios") === "1") {
    return true;
  }
  return false;
};

export const SOCIOS_ORIGIN = "https://alaola.com.ar/socios";

export const buildSociosInviteUrl = (token: string): string => {
  return `${SOCIOS_ORIGIN}/registro?token=${token}`;
};