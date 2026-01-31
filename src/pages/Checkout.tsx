import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ChevronDown, ChevronUp, Check, Loader2, Share2, MessageCircle, FileText } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { AddressForm } from "@/components/AddressForm";

const addressSchema = z.object({
  street: z.string().min(1, "La calle es requerida").max(200),
  number: z.string().min(1, "El número es requerido").max(20),
  floor: z.string().max(20).optional(),
  postalCode: z.string().max(8).optional(),
  city: z.string().min(1, "La ciudad es requerida"),
  province: z.string().min(1, "La provincia es requerida"),
  references: z.string().max(500).optional(),
});

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es requerido").max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().regex(/^[\+]?[0-9\s\-()]{7,20}$/, "Formato de teléfono inválido"),
});

interface CheckoutProps {
  isCollective?: boolean;
}

const Checkout = ({ isCollective = false }: CheckoutProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, waitingListItems, clearCart, clearWaitingList } = useCart();
  
  const items = isCollective ? waitingListItems : cartItems;
  
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState("");
  const [finalTotal, setFinalTotal] = useState(0);
  
  // Address fields
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("Ciudad Autónoma de Buenos Aires");
  const [province, setProvince] = useState("Buenos Aires");
  const [references, setReferences] = useState("");
  
  // Contact fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Delivery zone: 'caba' | 'gba' | 'other'
  const [deliveryZone, setDeliveryZone] = useState<'caba' | 'gba' | 'other'>('caba');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setPhone(profile.phone || "");
        if (profile.address) {
          try {
            const addr = JSON.parse(profile.address);
            setStreet(addr.street || "");
            setStreetNumber(addr.number || "");
            setFloor(addr.floor || "");
            setPostalCode(addr.postalCode || "");
            setCity(addr.city || "Ciudad Autónoma de Buenos Aires");
            setProvince(addr.province || "Buenos Aires");
            setReferences(addr.references || "");
          } catch {
            setStreet(profile.address);
          }
        }
      }
    };

    loadProfile();
  }, [navigate, isCollective]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Handle delivery zone change from AddressForm
  const handleDeliveryZoneChange = useCallback((zone: 'caba' | 'gba' | 'other') => {
    setDeliveryZone(zone);
  }, []);

  const subtotal = items.reduce(
    (sum, item) => {
      const price = 'price_per_unit' in item ? item.price_per_unit : item.current_price_per_unit;
      return sum + price * item.quantity;
    },
    0
  );

  const originalPrice = subtotal * 1.2;
  const discount = originalPrice - subtotal;
  const deliveryCost = deliveryZone === 'caba' ? 0 : deliveryZone === 'gba' ? 3000 : 5000;
  const total = subtotal + deliveryCost;

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString('es-AR')}`;
  };

  const handleSubmit = async () => {
    setErrors({});

    const addressValidation = addressSchema.safeParse({
      street,
      number: streetNumber,
      floor: floor || undefined,
      postalCode,
      city,
      province,
      references: references || undefined,
    });

    if (!addressValidation.success) {
      const fieldErrors: Record<string, string> = {};
      addressValidation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const contactValidation = contactSchema.safeParse({ 
      firstName,
      lastName: lastName || undefined,
      phone 
    });
    if (!contactValidation.success) {
      const fieldErrors: Record<string, string> = {};
      contactValidation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      return;
    }

    if (!paymentMethod) {
      setErrors((prev) => ({ ...prev, paymentMethod: "Seleccioná un método de pago" }));
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const addressData = {
        street,
        number: streetNumber,
        floor: floor || null,
        postalCode,
        city,
        province,
        references: references || null,
      };

      const orderItems = items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        flavor: item.flavor,
        quantity: item.quantity,
        price_per_unit: 'price_per_unit' in item ? item.price_per_unit : item.current_price_per_unit,
        product_image: item.product_image,
      }));

      const generatedOrderNumber = `OLA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data: order, error: orderError } = await supabase
        .from("user_orders")
        .insert([{
          user_id: session.user.id,
          order_number: generatedOrderNumber,
          order_type: isCollective ? 'collective' as const : 'immediate' as const,
          items: orderItems as any,
          subtotal: originalPrice,
          discount_amount: discount,
          total_amount: total,
          delivery_cost: deliveryCost || 0,
          delivery_address: addressData as any,
          payment_method: paymentMethod,
          status: 'pending' as const,
        }])
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName || null,
          phone,
          address: JSON.stringify(addressData),
          profile_completed: true,
        })
        .eq("user_id", session.user.id);

      const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Sin nombre';
      const orderUrl = `https://ola.lovable.app/mi-cuenta/pedidos/${order.id}`;

      try {
        await supabase.functions.invoke("notify-telegram", {
          body: {
            order_id: order.id,
            order_number: order.order_number,
            order_type: isCollective ? 'Compra Colectiva' : 'Compra Inmediata',
            customer_name: customerName,
            phone,
            total: formatPrice(total),
            order_url: orderUrl,
            waiting_for_discount: isCollective,
          },
        });
      } catch {
        // Notification failed but order was saved
      }

      if (isCollective) {
        await clearWaitingList();
        // Delete any pending collective order since we're finalizing
        await supabase
          .from("user_orders")
          .delete()
          .eq("user_id", session.user.id)
          .eq("order_type", "collective")
          .eq("status", "pending");
      } else {
        await clearCart();
        // Also clear waiting list and pending collective order if user is buying from cart
        // (items may have been moved from waiting list)
        await clearWaitingList();
        await supabase
          .from("user_orders")
          .delete()
          .eq("user_id", session.user.id)
          .eq("order_type", "collective")
          .eq("status", "pending");
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

  const getShareText = () => {
    return `Che! Mirá esto - descuentos increíbles de suplementos 🎉 Podés comprar al precio actual o esperar y pagar menos 🤑 https://ola.lovable.app/`;
  };

  const handleNativeShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(text);
          toast.success("¡Texto copiado!");
        }
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("¡Texto copiado!");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (items.length === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={true} />
        <main className="pt-20 pb-8 px-4">
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

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Link
            to={isCollective ? "/lista-espera" : "/carrito"}
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

          {/* Address Section */}
          <div className="mb-6">
            <AddressForm
              street={street}
              setStreet={setStreet}
              streetNumber={streetNumber}
              setStreetNumber={setStreetNumber}
              floor={floor}
              setFloor={setFloor}
              postalCode={postalCode}
              setPostalCode={setPostalCode}
              city={city}
              setCity={setCity}
              province={province}
              setProvince={setProvince}
              references={references}
              setReferences={setReferences}
              errors={errors}
              onDeliveryZoneChange={handleDeliveryZoneChange}
            />
          </div>

          <Separator className="mb-6" />

          {/* Contact Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Datos de contacto</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">Nombre *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName" className="text-sm">Apellido</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido (opcional)"
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Payment Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Forma de pago</h2>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className={errors.paymentMethod ? "border-destructive" : ""}>
                <SelectValue placeholder="Seleccioná forma de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta" disabled>Tarjeta (Próximamente)</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && <p className="text-xs text-destructive mt-1">{errors.paymentMethod}</p>}
          </div>

          <Separator className="mb-6" />

          {/* Order Total */}
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="line-through text-muted-foreground">{formatPrice(originalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento:</span>
              <span>-{formatPrice(discount)}</span>
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
            onClick={handleSubmit}
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
        </div>
      </main>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              ¡Pedido confirmado!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p>Tu pedido ha sido registrado exitosamente</p>
              <p className="text-xl font-bold text-foreground">Pedido #{orderNumber}</p>
              <p className="text-sm">
                Nos pondremos en contacto en las próximas horas para confirmar los detalles.
              </p>
              
              <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold">{formatPrice(finalTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Forma de pago:</span>
                  <span className="capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dirección:</span>
                  <span className="text-right text-xs">{street} {streetNumber}, {city}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="font-semibold mb-3">¡Comparte con tus amigos!</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={handleNativeShare}>
                    <Share2 className="w-4 h-4 mr-1" />
                    Compartir
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleWhatsAppShare}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate(`/mi-cuenta/pedidos/${orderId}`)} className="w-full">
              <FileText className="w-4 h-4 mr-2" />
              Ver comprobante
            </Button>
            <Button variant="outline" onClick={() => navigate("/mi-cuenta")} className="w-full">
              Ir a Mis Pedidos
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer showCategories />

      <FloatingWhatsApp />
    </div>
  );
};

export default Checkout;