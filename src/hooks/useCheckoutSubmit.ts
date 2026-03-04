import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPrice, formatFullName } from "@/lib/formatting";

interface SubmitOptions {
  isCollective: boolean;
  subtotal: number;
  discount: number;
  deliveryCost: number;
  total: number;
  items: any[];
  onSuccess: (data: { orderNumber: string; orderId: string; total: number }) => void;
  clearItems: () => Promise<void>;
}

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  streetNumber: string;
  floor: string;
  postalCode: string;
  city: string;
  province: string;
  references: string;
  paymentMethod: string;
}

export function useCheckoutSubmit(options: SubmitOptions) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: CheckoutFormData) => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const addressData = {
        street: formData.street,
        number: formData.streetNumber,
        floor: formData.floor || null,
        postalCode: formData.postalCode,
        city: formData.city,
        province: formData.province,
        references: formData.references || null,
      };

      const orderItems = options.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: 'price_per_unit' in item ? item.price_per_unit : item.current_price_per_unit,
        product_image: item.product_image,
      }));

      let order: { id: string; order_number: string } | null = null;

      if (options.isCollective) {
        const { data: pendingOrder, error: fetchError } = await supabase
          .from("user_orders")
          .select("id, order_number, subtotal")
          .eq("user_id", session.user.id)
          .eq("order_type", "collective")
          .eq("status", "pending")
          .single();

        if (fetchError || !pendingOrder) throw fetchError || new Error("No pending collective order found");

        const collectiveTotal = Number(pendingOrder.subtotal) + (options.deliveryCost || 0);

        const { error: updateError } = await supabase
          .from("user_orders")
          .update({
            status: "confirmed" as const,
            delivery_address: addressData as any,
            delivery_cost: options.deliveryCost || 0,
            total_amount: collectiveTotal,
            payment_method: formData.paymentMethod,
          })
          .eq("id", pendingOrder.id);

        if (updateError) throw updateError;
        order = { id: pendingOrder.id, order_number: pendingOrder.order_number };

        const { data: verifiedOrder } = await supabase
          .from("user_orders")
          .select("id")
          .eq("id", order.id)
          .single();

        if (!verifiedOrder) {
          throw new Error("Order updated but not readable");
        }
      } else {
        const generatedOrderNumber = `OLA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const { data: newOrder, error: orderError } = await supabase
          .from("user_orders")
          .insert([{
            user_id: session.user.id,
            order_number: generatedOrderNumber,
            order_type: 'immediate' as const,
            items: orderItems as any,
            subtotal: options.subtotal,
            discount_amount: options.discount,
            total_amount: options.total,
            delivery_cost: options.deliveryCost || 0,
            delivery_address: addressData as any,
            payment_method: formData.paymentMethod,
            status: 'pending' as const,
          }])
          .select('id, order_number')
          .single();

        if (orderError) throw orderError;
        order = newOrder;
      }

      if (!order) throw new Error("No order created or updated");

      // Update profile
      await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName || null,
          phone: formData.phone,
          address: JSON.stringify(addressData),
          profile_completed: true,
        })
        .eq("user_id", session.user.id);

      const customerName = formatFullName(formData.firstName, formData.lastName, 'Sin nombre');
      const orderUrl = `https://alaola.com.ar/mi-cuenta/pedidos/${order.id}`;

      // Send notifications in parallel — failures don't affect the order
      const notifications: Promise<unknown>[] = [
        supabase.functions.invoke("notify-telegram", {
          body: {
            order_id: order.id,
            order_number: order.order_number,
            order_type: options.isCollective ? 'Compra Colectiva Confirmada' : 'Compra Inmediata',
            customer_name: customerName,
            phone: formData.phone,
            total: formatPrice(options.total),
            order_url: orderUrl,
            waiting_for_discount: options.isCollective,
          },
        }).catch(() => {}),
      ];

      const userEmail = session.user.email;
      if (userEmail) {
        const addressStr = [formData.street, formData.streetNumber, formData.city].filter(Boolean).join(', ');
        notifications.push(
          supabase.functions.invoke("send-email", {
            body: {
              type: options.isCollective ? "collective_order_confirmed" : "order_confirmation",
              to: userEmail,
              data: {
                order_id: order.id,
                order_number: order.order_number,
                items: orderItems,
                total: options.total,
                delivery_cost: options.deliveryCost,
                payment_method: formData.paymentMethod,
                address: addressStr,
              },
            },
          }).catch(() => {}),
        );
      }

      await Promise.all(notifications);

      await options.clearItems();

      options.onSuccess({
        orderNumber: order.order_number,
        orderId: order.id,
        total: options.total,
      });
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSubmit };
}
