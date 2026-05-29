export const formatARS = (n: number): string => {
  const rounded = Math.round(n);
  return `$${rounded.toLocaleString("es-AR").replace(/,/g, ".")}`;
};

const INVITE_TOKEN_KEY = "socios_pending_invite_token";

export const storeInviteToken = (token: string) => {
  try { localStorage.setItem(INVITE_TOKEN_KEY, token); } catch {}
};
export const readInviteToken = (): string | null => {
  try { return localStorage.getItem(INVITE_TOKEN_KEY); } catch { return null; }
};
export const clearInviteToken = () => {
  try { localStorage.removeItem(INVITE_TOKEN_KEY); } catch {}
};