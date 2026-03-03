import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WaitingListItem } from "@/contexts/CartContext";

interface FrozenOrderData {
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price_per_unit: number;
    flavor: string | null;
    product_image: string | null;
    participants_count?: number;
  }>;
  subtotal: number;
  participants_count: number;
}

interface PendingOrderResult {
  hasExistingOrder: boolean;
  profileCompleted: boolean;
  pendingOrderCreatedAt: Date | null;
  frozenOrderData: FrozenOrderData | null;
}

export const usePendingOrder = (
  waitingListItems: WaitingListItem[]
): PendingOrderResult => {
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [pendingOrderCreatedAt, setPendingOrderCreatedAt] = useState<Date | null>(null);
  const [frozenOrderData, setFrozenOrderData] = useState<FrozenOrderData | null>(null);

  useEffect(() => {
    const checkExistingOrder = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasExistingOrder(false);
        setPendingOrderCreatedAt(null);
        setFrozenOrderData(null);
        setProfileCompleted(false);
        return;
      }

      const [orderResult, profileResult] = await Promise.all([
        supabase
          .from("user_orders")
          .select("id, created_at, items, subtotal, participants_count")
          .eq("user_id", session.user.id)
          .eq("order_type", "collective")
          .eq("status", "pending")
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("profile_completed, first_name, phone")
          .eq("user_id", session.user.id)
          .maybeSingle()
      ]);

      const data = orderResult.data;
      const profile = profileResult.data;

      setHasExistingOrder(!!data);
      setPendingOrderCreatedAt(data ? new Date(data.created_at) : null);

      const isComplete = profile?.profile_completed === true &&
                         !!profile?.first_name?.trim() &&
                         !!profile?.phone?.trim();
      setProfileCompleted(isComplete);

      if (data) {
        const items = data.items as any[];
        setFrozenOrderData({
          items,
          subtotal: data.subtotal || 0,
          participants_count: data.participants_count || 1,
        });
      } else {
        setFrozenOrderData(null);
      }
    };

    checkExistingOrder();
  }, [waitingListItems]);

  return { hasExistingOrder, profileCompleted, pendingOrderCreatedAt, frozenOrderData };
};
