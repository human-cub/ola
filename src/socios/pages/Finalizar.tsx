import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { AddressForm } from "@/components/AddressForm";
import { CheckoutContactForm } from "@/components/checkout/CheckoutContactForm";
import { CheckoutPaymentForm } from "@/components/checkout/CheckoutPaymentForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SociosHeader } from "../SociosHeader";
import { useSociosCartCtx } from "../SociosCartProvider";
import { useMayoristaMin } from "../hooks/useMayoristaMin";
import { formatARS } from "../lib/format";

const schema = z.object({
  firstName: z.string().trim().min(1, "El nombre es requerido").max(100),
  lastName: z.string().trim().max(100),
  phone: z.string().regex(/^[\+]?[0-9\s\-()]{7,20}$/, "Teléfono inválido"),
  street: z.string().min(1, "La calle es requerida").max(200),
  streetNumber: z.string().min(1, "El número es requerido").max(20),
  floor: z.string().max(20),
  postalCode: z.string().max(8),
  city: z.string().min(1, "La ciudad es requerida"),
  province: z.string().min(1, "La provincia es requerida"),
  references: z.string().max(500),
  paymentMethod: z.string().min(1, "Seleccioná un método de pago"),
});
type FormValues = z.infer<typeof schema>;

const Finalizar = () => {
  const { items, subtotal, clear } = useSociosCartCtx();
  const min = useMayoristaMin();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "", lastName: "", phone: "",
      street: "", streetNumber: "", floor: "", postalCode: "",
      city: "Capital Federal (CABA)", province: "Buenos Aires",
      references: "", paymentMethod: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, address")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (p) {
        form.setValue("firstName", p.first_name || "");
        form.setValue("lastName", p.last_name || "");
        form.setValue("phone", p.phone || "");
        if (p.address) {
          try {
            const a = typeof p.address === "string" ? JSON.parse(p.address) : p.address;
            form.setValue("street", a.street || "");
            form.setValue("streetNumber", a.number || "");
            form.setValue("floor", a.floor || "");
            form.setValue("postalCode", a.postalCode || "");
            form.setValue("city", a.city || form.getValues("city"));
            form.setValue("province", a.province || form.getValues("province"));
            form.setValue("references", a.references || "");
          } catch {}
        }
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [street, streetNumber, floor, postalCode, city, province, references] =
    form.watch(["street", "streetNumber", "floor", "postalCode", "city", "province", "references"]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SociosHeader search={search} onSearchChange={setSearch} />
        <main className="pt-[120px] px-4 text-center">
          <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
          <Button asChild><Link to="/">Ver catálogo</Link></Button>
        </main>
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    if (subtotal < min) {
      toast.error(`El mínimo es ${formatARS(min)}`);
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sin sesión");
      const addressData = {
        street: data.street, number: data.streetNumber,
        floor: data.floor || null, postalCode: data.postalCode,
        city: data.city, province: data.province,
        references: data.references || null,
      };
      const orderItems = items.map((it) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        flavor: it.flavor,
        quantity: it.quantity,
        price_per_unit: it.price_per_unit,
        product_image: it.product_image,
      }));
      const orderNumber = `MAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const { data: order, error } = await (supabase.from("user_orders") as any).insert([{
        user_id: session.user.id,
        order_number: orderNumber,
        order_type: "mayorista",
        items: orderItems,
        subtotal,
        discount_amount: 0,
        total_amount: subtotal,
        delivery_cost: 0,
        delivery_address: addressData,
        payment_method: data.paymentMethod,
        status: "pending",
        participants_count: 1,
      }]).select("id, order_number").single();
      if (error) throw error;
      await supabase.from("profiles").update({
        first_name: data.firstName,
        last_name: data.lastName || null,
        phone: data.phone,
        address: JSON.stringify(addressData),
        profile_completed: true,
      }).eq("user_id", session.user.id);
      await clear();
      toast.success(`Pedido ${order.order_number} creado`);
      navigate(`/mi-cuenta`);
    } catch (e: any) {
      toast.error(e.message || "Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SociosHeader search={search} onSearchChange={setSearch} />
      <main className="pt-[120px] px-4">
        <div className="container mx-auto max-w-2xl">
          <Link to="/carrito" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver al carrito
          </Link>
          <h1 className="text-2xl font-bold mb-4">Finalizar Compra</h1>

          <div className="border rounded-lg p-4 mb-4 bg-card">
            <div className="flex justify-between text-sm mb-1">
              <span>{items.length} productos</span>
              <span>{items.reduce((s, i) => s + i.quantity, 0)} unidades</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span><span>{formatARS(subtotal)}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AddressForm
                street={street} setStreet={(v) => form.setValue("street", v)}
                streetNumber={streetNumber} setStreetNumber={(v) => form.setValue("streetNumber", v)}
                floor={floor} setFloor={(v) => form.setValue("floor", v)}
                postalCode={postalCode} setPostalCode={(v) => form.setValue("postalCode", v)}
                city={city} setCity={(v) => form.setValue("city", v)}
                province={province} setProvince={(v) => form.setValue("province", v)}
                references={references} setReferences={(v) => form.setValue("references", v)}
                errors={{}}
              />
              <Separator className="my-6" />
              <CheckoutContactForm form={form} />
              <Separator className="my-6" />
              <CheckoutPaymentForm form={form} />
              <Button type="submit" disabled={loading} className="w-full mt-6" size="lg">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando…</> : "Finalizar pedido"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
};

export default Finalizar;