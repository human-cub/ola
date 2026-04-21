import { useState } from "react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import * as amplitude from "@amplitude/analytics-browser";

const leadSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Ingresá tu nombre y apellido" })
    .max(200, { message: "Máximo 200 caracteres" }),
  phone: z
    .string()
    .trim()
    .min(6, { message: "Ingresá un teléfono válido" })
    .max(50, { message: "Teléfono demasiado largo" })
    .regex(/^[0-9+\-\s()]+$/, { message: "Solo números, espacios y +-()" }),
});

const Mayoristas = () => {
  const isVisible = useScrollHeader();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse({ full_name: fullName, phone });
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
      toast.error(firstError);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("wholesale_leads")
        .insert({
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
        });

      if (error) throw error;

      // Fire-and-forget Telegram notification
      void supabase.functions.invoke("notify-wholesale-lead", {
        body: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
        },
      });

      amplitude.track("Wholesale Lead Submitted", { source: "mayoristas_page" });
      setSuccess(true);
      setFullName("");
      setPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Hubo un error al enviar la solicitud. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={isVisible} />

      <main className="container mx-auto px-4 pt-[120px] sm:pt-[104px] pb-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
          Impulsá tu negocio con Ola! 🚀
        </h1>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-8" />

        <p className="text-muted-foreground text-base md:text-lg mb-4">
          ¿Tenés un gimnasio, un local de suplementos o sos revendedor? En Ola! te ofrecemos el respaldo que necesitás para que tus estantes nunca estén vacíos y tus márgenes sean los mejores del mercado.
        </p>
        <p className="text-foreground font-medium mb-10">
          Llevá tu stock al siguiente nivel con precios directos y una logística que vuela.
        </p>

        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
            ¿Por qué elegirnos como tu proveedor aliado?
          </h2>
          <ul className="space-y-4">
            <li className="text-foreground">
              <span className="font-semibold">💰 Precios de fábrica:</span>{" "}
              <span className="text-muted-foreground">
                Accedé a valores competitivos para maximizar tu rentabilidad desde la primera unidad
              </span>
            </li>
            <li className="text-foreground">
              <span className="font-semibold">📦 Stock permanente:</span>{" "}
              <span className="text-muted-foreground">
                Contamos con el catálogo más completo de suplementos deportivos: proteínas, creatinas, aminoácidos y más
              </span>
            </li>
            <li className="text-foreground">
              <span className="font-semibold">⚡ Logística récord:</span>{" "}
              <span className="text-muted-foreground">
                Olvidate de esperar semanas. Comprás hoy, y recibís al día siguiente
              </span>
            </li>
            <li className="text-foreground">
              <span className="font-semibold">🚚 Envío GRATIS:</span>{" "}
              <span className="text-muted-foreground">
                Si estás en CABA o GBA, nosotros nos hacemos cargo del flete en pedidos mayoristas
              </span>
            </li>
            <li className="text-foreground">
              <span className="font-semibold">📲 Pedido ágil:</span>{" "}
              <span className="text-muted-foreground">
                Sin vueltas. Usamos una plataforma intuitiva para que cargues tu orden en 2 minutos
              </span>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
            Condiciones claras, negocios reales
          </h2>
          <p className="text-muted-foreground mb-4">
            Queremos que crecer sea simple. Por eso mantenemos condiciones transparentes:
          </p>
          <ul className="space-y-3 ml-2">
            <li className="text-foreground">
              <span className="font-semibold">Mínimo de compra:</span>{" "}
              <span className="text-muted-foreground">$300.000</span>
            </li>
            <li className="text-foreground">
              <span className="font-semibold">Entrega:</span>{" "}
              <span className="text-muted-foreground">Al día siguiente (CABA/GBA)</span>
            </li>
            <li className="text-foreground">
              <span className="font-semibold">Atención:</span>{" "}
              <span className="text-muted-foreground">Soporte personalizado para armar tu mix de productos</span>
            </li>
          </ul>
        </section>

        <section id="form" className="bg-muted/40 rounded-2xl p-6 md:p-8 border border-border/50 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
            ¿Listo para arrancar?
          </h2>
          <p className="text-muted-foreground mb-6">
            No pierdas ventas por falta de stock. Sumate a nuestra red de distribuidores y empezá a comprar con el mejor precio del país.
          </p>

          {success ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="w-14 h-14 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">¡Recibimos tu solicitud!</h3>
              <p className="text-muted-foreground mb-4">
                Un asesor se va a contactar con vos a la brevedad.
              </p>
              <Button variant="outline" onClick={() => setSuccess(false)}>
                Enviar otra solicitud
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre y apellido *</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 11 6665-0878"
                  maxLength={50}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-primary text-white hover:opacity-90 justify-center"
                size="lg"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </span>
                ) : (
                  <span className="text-center">Quiero el catálogo mayorista</span>
                )}
              </Button>
            </form>
          )}
        </section>

        <section className="bg-muted/50 rounded-2xl p-6 text-center border border-border/50">
          <p className="text-foreground mb-4">
            ¿Preferís hablar con un asesor? Te damos el alta en el momento.
          </p>
          <a
            href="https://wa.me/5491166650878"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => amplitude.track("Whatsapp Opened", { source: "mayoristas" })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Escribinos por WhatsApp
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Mayoristas;