import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { AddressForm } from "@/components/AddressForm";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { formatPrice } from "@/lib/formatting";
import { CheckoutSuccessDialog } from "@/components/checkout/CheckoutSuccessDialog";

const checkoutSchema = z.object({
  // Contact
  firstName: z.string().trim().min(1, "El nombre es requerido").max(100),
  lastName: z.string().trim().max(100),
  phone: z.string().regex(/^[\+]?[0-9\s\-()]{7,20}$/, "Formato de teléfono inválido"),
  // Address
  street: z.string().min(1, "La calle es requerida").max(200),
  streetNumber: z.string().min(1, "El número es requerido").max(20),
  floor: z.string().max(20),
  postalCode: z.string().max(8),
  city: z.string().min(1, "La ciudad es requerida"),
  province: z.string().min(1, "La provincia es requerida"),
  references: z.string().max(500),
  // Payment
  paymentMethod: z.string().min(1, "Seleccioná un método de pago"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export interface CheckoutProps {
  isCollective?: boolean;
}

const Checkout = ({ isCollective = false }: CheckoutProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, waitingListItems, clearCart, clearWaitingList } = useCart();

  const fromWaitingList = searchParams.get('from') === 'waiting-list';
  const items = isCollective ? waitingListItems : cartItems;

  const headerVisible = useScrollHeader();
  const [loading, setLoading] = useState(false);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [finalTotal, setFinalTotal] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState<'caba' | 'gba' | 'other'>('caba');

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      street: "",
      streetNumber: "",
      floor: "",
      postalCode: "",
      city: "Ciudad Autónoma de Buenos Aires",
      province: "Buenos Aires",
      references: "",
      paymentMethod: "",
    },
  });

  const [street, streetNumber, floor, postalCode, city, province, references, paymentMethod, firstName] =
    form.watch(["street", "streetNumber", "floor", "postalCode", "city", "province", "references", "paymentMethod", "firstName"]);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/ingresar?redirect=" + (isCollective ? "/checkout-colectivo" : "/checkout"));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        form.reset({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          phone: profile.phone || "",
          street: "",
          streetNumber: "",
          floor: "",
          postalCode: "",
          city: "Ciudad Autónoma de Buenos Aires",
          province: "Buenos Aires",
          references: "",
          paymentMethod: "",
        });

        if (profile.address) {
          try {
            const addr = JSON.parse(profile.address);
            form.setValue("street", addr.street || "");
            form.setValue("streetNumber", addr.number || "");
            form.setValue("floor", addr.floor || "");
            form.setValue("postalCode", addr.postalCode || "");
            form.setValue("city", addr.city || "Ciudad Autónoma de Buenos Aires");
            form.setValue("province", addr.province || "Buenos Aires");
            form.setValue("references", addr.references || "");
          } catch {
            form.setValue("street", profile.address);
          }
        }
      }
    };

    loadProfile();
  }, [navigate, isCollective, form]);

  const handleDeliveryZoneChange = useCallback((zone: 'caba' | 'gba' | 'other') => {
    setDeliveryZone(zone);
  }, []);

  const [productFirstPrices, setProductFirstPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const productIds = [...new Set(items.map(item => item.product_id))];
      if (productIds.length === 0) return;
      const { data } = await supabase.from("products").select("id, prices").in("id", productIds);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach(p => {
          const prices = (p.prices as any[]) || [];
          map[p.id] = prices.length > 0 ? prices[0].price : 0;
        });
        setProductFirstPrices(map);
      }
    };
    fetchPrices();
  }, [items]);

  const subtotal = items.reduce(
    (sum, item) => {
      const price = 'price_per_unit' in item ? item.price_per_unit : item.current_price_per_unit;
      return sum + price * item.quantity;
    },
    0
  );

  const fullPrice = items.reduce(
    (sum, item) => sum + (productFirstPrices[item.product_id] || ('price_per_unit' in item ? item.price_per_unit : item.current_price_per_unit)) * item.quantity,
    0
  );
  const discount = fullPrice - subtotal;
  const baseDeliveryCost = deliveryZone === 'caba' ? 0 : deliveryZone === 'gba' ? 3000 : 5000;
  const deliveryCost = subtotal >= 100000 ? 0 : baseDeliveryCost;
  const total = subtotal + deliveryCost;

  const handleSubmit = async (formData: CheckoutFormValues) => {
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

      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: 'price_per_unit' in item ? item.price_per_unit : item.current_price_per_unit,
        product_image: item.product_image,
      }));

      let order: { id: string; order_number: string } | null = null;

      if (isCollective) {
        const { data: pendingOrder, error: fetchError } = await supabase
          .from("user_orders")
          .select("id, order_number, subtotal")
          .eq("user_id", session.user.id)
          .eq("order_type", "collective")
          .eq("status", "pending")
          .single();

        if (fetchError || !pendingOrder) throw fetchError || new Error("No pending collective order found");

        const collectiveTotal = Number(pendingOrder.subtotal) + (deliveryCost || 0);

        const { error: updateError } = await supabase
          .from("user_orders")
          .update({
            status: "confirmed" as const,
            delivery_address: addressData as any,
            delivery_cost: deliveryCost || 0,
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
            subtotal: subtotal,
            discount_amount: discount,
            total_amount: total,
            delivery_cost: deliveryCost || 0,
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

      const customerName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Sin nombre';
      const orderUrl = `https://alaola.com.ar/mi-cuenta/pedidos/${order.id}`;

      try {
        await supabase.functions.invoke("notify-telegram", {
          body: {
            order_id: order.id,
            order_number: order.order_number,
            order_type: isCollective ? 'Compra Colectiva Confirmada' : 'Compra Inmediata',
            customer_name: customerName,
            phone: formData.phone,
            total: formatPrice(total),
            order_url: orderUrl,
            waiting_for_discount: isCollective,
          },
        });
      } catch {
        // Notification failed but order was saved
      }

      try {
        const userEmail = session.user.email;
        if (userEmail) {
          const addressStr = [formData.street, formData.streetNumber, formData.city].filter(Boolean).join(', ');
          await supabase.functions.invoke("send-email", {
            body: {
              type: isCollective ? "collective_order_confirmed" : "order_confirmation",
              to: userEmail,
              data: {
                order_id: order.id,
                order_number: order.order_number,
                items: orderItems,
                total,
                delivery_cost: deliveryCost,
                payment_method: formData.paymentMethod,
                address: addressStr,
              },
            },
          });
        }
      } catch {
        // Email failed but order was saved
      }

      if (isCollective) {
        await clearWaitingList();
      } else {
        await clearCart();
      }

      setOrderNumber(order.order_number);
      setOrderId(order.id);
      setFinalTotal(total);
      setShowSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={true} />
        <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <p className="text-muted-foreground mb-4">No hay productos para checkout</p>
            <Button asChild>
              <Link to="/">Ir a comprar</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Link
            to={isCollective || fromWaitingList ? "/lista-espera" : "/carrito"}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>

          <h1 className="text-2xl font-bold mb-6">
            {isCollective ? "Confirmar Compra Colectiva" : "Finalizar Compra"}
          </h1>

          {/* Order Summary - Collapsible */}
          <Collapsible open={orderSummaryOpen} onOpenChange={setOrderSummaryOpen} className="mb-6">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between py-3 px-1">
                <span className="text-lg font-semibold">Resumen del pedido</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatPrice(total)}</span>
                  {orderSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 pb-4">
                {items.map((item) => {
                  const price = 'price_per_unit' in item ? item.price_per_unit : item.current_price_per_unit;
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.quantity}x {item.product_name} {item.flavor && `(${item.flavor})`}</span>
                      <span>{formatPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="mb-6" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              {/* Address Section */}
              <div className="mb-6">
                <AddressForm
                  street={street}
                  setStreet={(v) => form.setValue("street", v)}
                  streetNumber={streetNumber}
                  setStreetNumber={(v) => form.setValue("streetNumber", v)}
                  floor={floor}
                  setFloor={(v) => form.setValue("floor", v)}
                  postalCode={postalCode}
                  setPostalCode={(v) => form.setValue("postalCode", v)}
                  city={city}
                  setCity={(v) => form.setValue("city", v)}
                  province={province}
                  setProvince={(v) => form.setValue("province", v)}
                  references={references}
                  setReferences={(v) => form.setValue("references", v)}
                  errors={Object.fromEntries(
                    Object.entries(form.formState.errors)
                      .filter(([k]) => ['street', 'number', 'city', 'province'].includes(k))
                      .map(([k, v]) => [k === 'streetNumber' ? 'number' : k, v?.message || ''])
                  )}
                  onDeliveryZoneChange={handleDeliveryZoneChange}
                />
              </div>

              <Separator className="mb-6" />

              {/* Contact Section */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Datos de contacto</h2>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Nombre *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Tu nombre" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Apellido</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Tu apellido (opcional)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Teléfono *</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" placeholder="+54 9 11 1234-5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Payment Section */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Forma de pago</h2>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná forma de pago" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">Transferencia</SelectItem>
                          <SelectItem value="tarjeta" disabled>Tarjeta (Próximamente)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="mb-6" />

              {/* Order Total */}
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio sin descuento:</span>
                  <span className="line-through text-muted-foreground">{formatPrice(fullPrice)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento:</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío:</span>
                  <span>{deliveryCost === 0 ? "Gratis" : formatPrice(deliveryCost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold pt-2">
                  <span>TOTAL:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Finalizar pedido"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </main>

      <CheckoutSuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        orderNumber={orderNumber}
        orderId={orderId}
        total={finalTotal}
        paymentMethod={paymentMethod}
        addressSummary={`${street} ${streetNumber}, ${city}`}
      />

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Checkout;
