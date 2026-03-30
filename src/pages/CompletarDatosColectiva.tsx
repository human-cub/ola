import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as amplitude from "@amplitude/analytics-browser";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { AddressForm } from "@/components/AddressForm";
import { isCABAProvince } from "@/data/argentinaLocations";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { formatPrice } from "@/lib/formatting";

const addressSchema = z.object({
  street: z.string().min(1, "La calle es requerida").max(200),
  number: z.string().min(1, "El número es requerido").max(20),
  floor: z.string().max(20).optional(),
  postalCode: z.string().max(8).optional(),
  city: z.string().optional(), // City is optional when CABA is selected
  province: z.string().min(1, "La provincia es requerida"),
  references: z.string().max(500).optional(),
  isCABA: z.boolean().optional(),
}).refine(
  (data) => data.isCABA || (data.city && data.city.length >= 1),
  { message: "La ciudad es requerida", path: ["city"] }
);

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre es demasiado largo"),
  lastName: z.string().trim().max(100, "El apellido es demasiado largo").optional(),
  phone: z.string().regex(/^[\+]?[0-9\s\-()]{7,20}$/, "Formato de teléfono inválido"),
});

const CompletarDatosColectiva = () => {
  const navigate = useNavigate();
  
  const headerVisible = useScrollHeader();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  
  // Address fields
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("Capital Federal (CABA)");
  const [province, setProvince] = useState("Buenos Aires");
  const [references, setReferences] = useState("");
  
  // Contact fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const scrollToFirstError = (fieldErrors: Record<string, string>) => {
    const firstField = Object.keys(fieldErrors)[0];
    if (!firstField) return;
    // Field names match input ids
    const el = document.getElementById(firstField);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Small delay to allow scroll before focusing
      setTimeout(() => {
        try {
          (el as HTMLElement).focus?.();
        } catch {
          // no-op
        }
      }, 200);
    }
  };

  // Load profile data and check for existing order
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/ingresar?redirect=/completar-datos-colectiva");
        return;
      }

      // Check for existing pending collective order
      const { data: existingOrder } = await supabase
        .from("user_orders")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("order_type", "collective")
        .eq("status", "pending")
        .maybeSingle();
      
      setHasExistingOrder(!!existingOrder);

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
            setCity(addr.city || "");
            setProvince(addr.province || "Buenos Aires");
            setReferences(addr.references || "");
          } catch {
            setStreet(profile.address);
          }
        }
      }
      setDataLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async () => {
    setErrors({});
    const loadingToastId = toast.loading("Guardando...");

    const isCABA = isCABAProvince(province);
    
    const addressValidation = addressSchema.safeParse({
      street,
      number: streetNumber,
      floor: floor || undefined,
      postalCode,
      city: isCABA ? undefined : city,
      province,
      references: references || undefined,
      isCABA,
    });

    if (!addressValidation.success) {
      const fieldErrors: Record<string, string> = {};
      addressValidation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Revisá los campos marcados", { id: loadingToastId });
      scrollToFirstError(fieldErrors);
      return;
    }

    const contactValidation = contactSchema.safeParse({ 
      firstName,
      lastName: lastName || undefined,
      phone,
    });
    if (!contactValidation.success) {
      const fieldErrors: Record<string, string> = {};
      contactValidation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      toast.error("Revisá los campos marcados", { id: loadingToastId });
      scrollToFirstError(fieldErrors);
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

      const customerName = [firstName, lastName].filter(Boolean).join(' ') || 'Cliente';

      // Save profile data including first_name and last_name + set profile_completed
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName || null,
          phone,
          address: JSON.stringify(addressData),
          profile_completed: true,
        })
        .eq("user_id", session.user.id);
      if (profileError) throw profileError;

      // Fetch waiting list items
      const { data: waitingListItems, error: waitingListError } = await supabase
        .from("waiting_list_items")
        .select("*")
        .eq("user_id", session.user.id);
      if (waitingListError) throw waitingListError;

      if (waitingListItems && waitingListItems.length > 0) {
        // Prepare order items
        const orderItems = waitingListItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          flavor: item.flavor,
          quantity: item.quantity,
          price_per_unit: item.current_price_per_unit,
          product_image: item.product_image,
        }));

        const subtotal = waitingListItems.reduce(
          (sum, item) => sum + item.current_price_per_unit * item.quantity,
          0
        );

        // Check if pending collective order already exists
        const { data: existingOrder } = await supabase
          .from("user_orders")
          .select("id, items, order_number")
          .eq("user_id", session.user.id)
          .eq("order_type", "collective")
          .eq("status", "pending")
          .maybeSingle();

        let orderNumber = existingOrder?.order_number;
        let orderId = existingOrder?.id;
        let isNewOrder = false;

        if (existingOrder) {
          // Update existing order - NO Telegram notification
          const { error: updateOrderError } = await supabase
            .from("user_orders")
            .update({
              items: orderItems,
              subtotal,
              total_amount: subtotal,
              delivery_address: addressData,
              notes: phone,
            })
            .eq("id", existingOrder.id);
          if (updateOrderError) throw updateOrderError;
        } else {
          // Create new collective order - SEND Telegram notification
          isNewOrder = true;
          orderNumber = `OLA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          
          const { data: newOrder } = await supabase
            .from("user_orders")
            .insert({
              user_id: session.user.id,
              order_number: orderNumber,
              order_type: "collective",
              items: orderItems,
              subtotal,
              total_amount: subtotal,
              delivery_address: addressData,
              status: "pending",
              notes: phone,
            })
            .select("id, order_number")
            .single();
          
          orderId = newOrder?.id;
          orderNumber = newOrder?.order_number;
        }

        // Send Telegram notification ONLY for new orders
        if (isNewOrder && orderId && orderNumber) {
          const orderUrl = `${window.location.origin}/mi-cuenta/pedidos/${orderId}`;
          
          await supabase.functions.invoke("notify-telegram", {
            body: {
              order_id: orderId,
              order_number: orderNumber,
              order_type: 'Compra Colectiva',
              customer_name: customerName,
              phone,
              total: formatPrice(subtotal),
              order_url: orderUrl,
              waiting_for_discount: true,
            },
          });
        }
      }

      toast.success("¡Datos guardados correctamente!", { id: loadingToastId });
      navigate("/lista-espera", { replace: true });
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error(error?.message || "Error al guardar los datos", { id: loadingToastId });
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={true} />
        <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <p className="text-muted-foreground">Cargando datos...</p>
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
            to="/lista-espera"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a lista de espera
          </Link>

          <h1 className="text-2xl font-bold mb-2">
            {hasExistingOrder ? "¡Ya participás! 🎉" : "Entrar en lista de espera"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {hasExistingOrder 
              ? "Podés editar tus datos si querés"
              : "Estos datos se usarán cuando se cierre la compra colectiva el domingo a las 23:59"
            }
          </p>

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
                />
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

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mx-auto"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Listo"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground mt-4">
            Al confirmar, entrás en la lista de espera para la compra colectiva de esta semana
          </p>
        </div>
      </main>

      <FloatingWhatsApp />
    </div>
  );
};

export default CompletarDatosColectiva;
