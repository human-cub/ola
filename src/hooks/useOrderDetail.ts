import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  shouldUseDynamicCollectivePricing,
} from "@/lib/collectivePricing";
import { recalculateOrderItems, type ProductPricingData } from "@/lib/orderPricingSync";

interface OrderItem {
  product_id: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  price_per_unit: number;
  product_image: string | null;
  participants_count?: number | null;
}

interface Order {
  id: string;
  order_number: string;
  order_type: 'immediate' | 'collective';
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  participants_count: number;
  total_amount: number;
  delivery_cost: number;
  delivery_address: any;
  payment_method: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes: string | null;
  collective_close_date: string | null;
  created_at: string;
  is_promo: boolean;
  promo_tier: number | null;
}

export function useOrderDetail(orderId: string | undefined) {
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Debés iniciar sesión para ver este pedido");
        navigate("/ingresar?redirect=/mi-cuenta/pedidos/" + orderId);
        return;
      }

      const { data, error } = await supabase
        .from("user_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error || !data) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          toast.error("No tenés permiso para ver este pedido");
          navigate("/mi-cuenta");
          return;
        }

        toast.error("Pedido no encontrado");
        navigate("/admin");
        return;
      }

      if (data.user_id !== session.user.id) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          toast.error("No tenés permiso para ver este pedido");
          navigate("/mi-cuenta");
          return;
        }
      }

      let resolvedOrder = data as unknown as Order;

      if (
        shouldUseDynamicCollectivePricing({
          orderType: resolvedOrder.order_type,
          status: resolvedOrder.status,
          createdAt: resolvedOrder.created_at,
          isPromo: resolvedOrder.is_promo,
          items: resolvedOrder.items,
        })
      ) {
        const productIds = [...new Set(resolvedOrder.items.map((item) => item.product_id))];

        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from("products")
            .select("id, prices, total_orders_count")
            .in("id", productIds);

          if (productsData) {
            const productMap = new Map<string, ProductPricingData>();
            productsData.forEach((product: any) => {
              productMap.set(product.id, {
                prices: product.prices,
                totalOrdersCount: Number(product.total_orders_count || 0),
              });
            });

            const result = recalculateOrderItems(
              resolvedOrder.items,
              productMap,
              Number(resolvedOrder.delivery_cost || 0),
            );

            if (result.hasChanges) {
              await supabase
                .from("user_orders")
                .update({
                  items: result.items as any,
                  subtotal: result.subtotal,
                  discount_amount: result.discountAmount,
                  total_amount: result.totalAmount,
                })
                .eq("id", resolvedOrder.id);

              resolvedOrder = {
                ...resolvedOrder,
                items: result.items as OrderItem[],
                subtotal: result.subtotal,
                discount_amount: result.discountAmount,
                total_amount: result.totalAmount,
              };
            }
          }
        }
      }

      setOrder(resolvedOrder);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, navigate]);

  return { order, setOrder, loading };
}

export type { Order, OrderItem };
