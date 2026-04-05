import { useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { AddressForm } from "@/components/AddressForm";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import * as amplitude from "@amplitude/analytics-browser";
import { useCheckoutProfile } from "@/hooks/useCheckoutProfile";
import { useCheckoutPricing } from "@/hooks/useCheckoutPricing";
import { useCheckoutSubmit } from "@/hooks/useCheckoutSubmit";
import { CheckoutSuccessDialog } from "@/components/checkout/CheckoutSuccessDialog";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutContactForm } from "@/components/checkout/CheckoutContactForm";
import { CheckoutPaymentForm } from "@/components/checkout/CheckoutPaymentForm";
import { CheckoutPriceSummary } from "@/components/checkout/CheckoutPriceSummary";
import { PromoCodeInput } from "@/components/checkout/PromoCodeInput";
import { usePromoCode } from "@/hooks/usePromoCode";

const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es requerido").max(100),
  lastName: z.string().trim().max(100),
  phone: z.string().regex(/^[\+]?[0-9\s\-()]{7,20}$/, "Formato de teléfono inválido"),
  street: z.string().min(1, "La calle es requerida").max(200),
  streetNumber: z.string().min(1, "El número es requerido").max(20),
  floor: z.string().max(20),
  postalCode: z.string().max(8),
  city: z.string().min(1, "La ciudad es requerida"),
  province: z.string().min(1, "La provincia es requerida"),
  references: z.string().max(500),
  paymentMethod: z.string().min(1, "Seleccioná un método de pago"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export interface CheckoutProps {
  isCollective?: boolean;
}

const Checkout = ({ isCollective = false }: CheckoutProps) => {
  const [searchParams] = useSearchParams();
  const { cartItems, waitingListItems, clearCart, clearWaitingList } = useCart();

  const fromWaitingList = searchParams.get('from') === 'waiting-list';
  const items = isCollective ? waitingListItems : cartItems;

  const headerVisible = useScrollHeader();
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [finalTotal, setFinalTotal] = useState(0);
  const [deliveryZone, setDeliveryZone] = useState<'caba' | 'gba' | 'other'>('caba');
  const { appliedPromo, setAppliedPromo, removePromo } = usePromoCode();

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
      city: "Capital Federal (CABA)",
      province: "Buenos Aires",
      references: "",
      paymentMethod: "",
    },
  });

  const [street, streetNumber, floor, postalCode, city, province, references, paymentMethod] =
    form.watch(["street", "streetNumber", "floor", "postalCode", "city", "province", "references", "paymentMethod"]);

  const validationErrors = Object.values(form.formState.errors)
    .map((error) => error?.message)
    .filter((message): message is string => typeof message === "string" && message.trim().length > 0);

  useCheckoutProfile(form, isCollective);

  const { subtotal, fullPrice, discount, deliveryCost, total } =
    useCheckoutPricing(items, deliveryZone, appliedPromo?.tier_bonus ?? 0, isCollective);

  const { loading, handleSubmit } = useCheckoutSubmit({
    isCollective,
    subtotal,
    discount,
    deliveryCost,
    total,
    items,
    clearItems: isCollective ? clearWaitingList : clearCart,
    onSuccess: (data) => {
      amplitude.track('Checkout Complete', {
        button_label: 'Finalizar pedido',
        order_number: data.orderNumber,
        order_id: data.orderId,
        total: data.total,
        order_type: isCollective ? 'collective' : 'immediate',
        items_count: items.length,
      });
      setOrderNumber(data.orderNumber);
      setOrderId(data.orderId);
      setFinalTotal(data.total);
      setShowSuccess(true);
    },
  });

  const handleDeliveryZoneChange = useCallback((zone: 'caba' | 'gba' | 'other') => {
    setDeliveryZone(zone);
  }, []);

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
        <div className="container mx-auto max-w-2xl flex flex-col">
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

          <CheckoutOrderSummary items={items} total={total} />

          <Separator className="mb-6" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col">
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

              <CheckoutContactForm form={form} />

              <Separator className="mb-6" />

              <CheckoutPaymentForm form={form} />

              <Separator className="mb-6" />

              <PromoCodeInput
                appliedPromo={appliedPromo}
                onApply={setAppliedPromo}
                onRemove={removePromo}
              />

              <CheckoutPriceSummary
                fullPrice={fullPrice}
                discount={discount}
                subtotal={subtotal}
                deliveryCost={deliveryCost}
                total={total}
              />

              {validationErrors.length > 0 && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-4"
                >
                  <p className="mb-2 text-sm font-semibold text-destructive">
                    Revisá los siguientes campos antes de continuar:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                    {validationErrors.map((message, index) => (
                      <li key={`${message}-${index}`}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full mx-auto"
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
