import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const FALLBACK_LINK = "https://alaola.com.ar/";

// Enlace de referido del usuario logueado (los clics con ?ref= se trackean).
// Para anónimos devuelve null → los componentes caen a FALLBACK_LINK.
const fetchReferralLink = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("user_id", session.user.id)
    .maybeSingle();
  const code = (data as { referral_code?: string | null } | null)?.referral_code;
  return code ? `https://alaola.com.ar/?ref=${code}` : null;
};

export const useReferralLink = () =>
  useQuery({ queryKey: ["referral-link"], queryFn: fetchReferralLink, staleTime: 5 * 60_000 });
