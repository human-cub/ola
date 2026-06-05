import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseAddress } from "@/lib/address";
import { getDeliveryZone } from "@/data/argentinaLocations";

export type DeliveryZone = "caba" | "gba" | "other";

// Единый источник тарифов доставки (то же правило, что в checkout)
export const DELIVERY_COST: Record<DeliveryZone, number> = {
  caba: 0,
  gba: 3000,
  other: 5000,
};
export const FREE_DELIVERY_THRESHOLD = 100000;

const fetchProfileZone = async (): Promise<DeliveryZone> => {
  const { data: { session } } = await supabase.auth.getSession();
  // Гость или без адреса в кабинете → CABA (Envío: Gratis por defecto)
  if (!session?.user) return "caba";
  const { data } = await supabase
    .from("profiles")
    .select("address")
    .eq("user_id", session.user.id)
    .maybeSingle();
  const addr = parseAddress(((data as any)?.address as string) ?? null);
  if (!addr || (!addr.province && !addr.city && !addr.postalCode)) return "caba";
  return getDeliveryZone(addr.postalCode, addr.province, addr.city);
};

/**
 * Оценка доставки по адресу из кабинета: по умолчанию Gratis (CABA);
 * если у юзера сохранён адрес платной зоны — её тариф.
 */
export const useDeliveryEstimate = () => {
  const { data: zone = "caba" } = useQuery({
    queryKey: ["delivery-estimate-zone"],
    queryFn: fetchProfileZone,
    staleTime: 5 * 60 * 1000,
  });
  const baseCost = DELIVERY_COST[zone];
  return {
    zone,
    baseCost,
    /** Стоимость с учётом порога бесплатной доставки от суммы */
    costFor: (subtotal: number) =>
      subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : baseCost,
  };
};
