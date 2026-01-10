import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Check, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";

const addressSchema = z.object({
  street: z.string().min(1, "La calle es requerida").max(200),
  number: z.string().min(1, "El número es requerido").max(20),
  floor: z.string().max(20).optional(),
  postalCode: z.string().regex(/^\d{4}$/, "Código postal debe tener 4 dígitos"),
  city: z.string().min(1, "La ciudad es requerida"),
  province: z.string().min(1, "La provincia es requerida"),
  references: z.string().max(500).optional(),
});

const contactSchema = z.object({
  phone: z.string().regex(/^[\+]?[0-9\s\-()]{7,20}$/, "Formato de teléfono inválido"),
  email: z.string().email("Email inválido"),
});

const CompletarDatosColectiva = () => {
  const navigate = useNavigate();
  
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasExistingData, setHasExistingData] = useState(false);
  
  // Address fields
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("Ciudad Autónoma de Buenos Aires");
  const [province, setProvince] = useState("Buenos Aires");
  const [references, setReferences] = useState("");
  
  // Contact fields
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  // Delivery
  const [isInCABA, setIsInCABA] = useState(true);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/ingresar?redirect=/completar-datos-colectiva");
        return;
      }

      setEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
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
            
            // Check if user already has address data
            if (addr.street && addr.number && addr.postalCode) {
              setHasExistingData(true);
            }
          } catch {
            setStreet(profile.address);
          }
        }
      }
      setDataLoading(false);
    };

    loadProfile();
  }, [navigate]);

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

  // Check if address is in CABA
  useEffect(() => {
    const cabaPostalCodes = ['1000', '1001', '1002', '1003', '1004', '1005'];
    const isCaba = city.toLowerCase().includes('buenos aires') && 
                   city.toLowerCase().includes('ciudad') ||
                   cabaPostalCodes.some(cp => postalCode.startsWith(cp.slice(0, 2)));
    setIsInCABA(isCaba);
  }, [city, postalCode]);

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

    const contactValidation = contactSchema.safeParse({ phone, email });
    if (!contactValidation.success) {
      const fieldErrors: Record<string, string> = {};
      contactValidation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
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

      // Save profile data
      await supabase
        .from("profiles")
        .update({
          phone,
          address: JSON.stringify(addressData),
        })
        .eq("user_id", session.user.id);

      toast.success("¡Datos guardados correctamente!");
      navigate("/lista-espera");
    } catch (error: any) {
      toast.error(error.message || "Error al guardar los datos");
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={true} />
        <main className="pt-20 pb-8 px-4">
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

      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Link
            to="/lista-espera"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a lista de espera
          </Link>

          <h1 className="text-2xl font-bold mb-2">Completar mis datos</h1>
          <p className="text-muted-foreground mb-6">
            Estos datos se usarán cuando se cierre la compra colectiva el domingo a las 23:59
          </p>

          {hasExistingData && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm mb-6">
              <p className="text-green-800">
                <Check className="w-4 h-4 inline mr-1" />
                Ya tenés tus datos guardados. Podés actualizarlos si querés.
              </p>
            </div>
          )}

          {/* Address Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" />
              Dirección de entrega
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="street" className="text-sm">Calle *</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Av. Corrientes"
                    className={errors.street ? "border-destructive" : ""}
                  />
                  {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="number" className="text-sm">Número *</Label>
                  <Input
                    id="number"
                    value={streetNumber}
                    onChange={(e) => setStreetNumber(e.target.value)}
                    placeholder="1234"
                    className={errors.number ? "border-destructive" : ""}
                  />
                  {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="floor" className="text-sm">Piso/Depto</Label>
                  <Input
                    id="floor"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="3° B"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="postalCode" className="text-sm">CP *</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1043"
                    maxLength={4}
                    className={errors.postalCode ? "border-destructive" : ""}
                  />
                  {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="city" className="text-sm">Ciudad *</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger id="city">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ciudad Autónoma de Buenos Aires">CABA</SelectItem>
                      <SelectItem value="La Plata">La Plata</SelectItem>
                      <SelectItem value="Mar del Plata">Mar del Plata</SelectItem>
                      <SelectItem value="Córdoba">Córdoba</SelectItem>
                      <SelectItem value="Rosario">Rosario</SelectItem>
                      <SelectItem value="Mendoza">Mendoza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="province" className="text-sm">Provincia *</Label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger id="province">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buenos Aires">Buenos Aires</SelectItem>
                      <SelectItem value="Córdoba">Córdoba</SelectItem>
                      <SelectItem value="Santa Fe">Santa Fe</SelectItem>
                      <SelectItem value="Mendoza">Mendoza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="references" className="text-sm">Referencias</Label>
                <Textarea
                  id="references"
                  value={references}
                  onChange={(e) => setReferences(e.target.value)}
                  placeholder="Timbre, indicaciones, etc."
                  rows={2}
                  className="resize-none"
                />
              </div>

              {isInCABA ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">¡Envío gratis en CABA!</span>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm">
                  <p className="font-medium text-amber-800">Tu dirección está fuera de CABA</p>
                  <p className="text-amber-700 text-xs">Nos pondremos en contacto para coordinar la entrega.</p>
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Contact Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Datos de contacto</h2>
            <div className="space-y-4">
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
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
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
                Guardando...
              </>
            ) : (
              "Guardar mis datos"
            )}
          </Button>

          <p className="text-sm text-center text-muted-foreground mt-4">
            Tus datos se guardarán para cuando se cierre la compra colectiva
          </p>
        </div>
      </main>

      <FloatingWhatsApp />
    </div>
  );
};

export default CompletarDatosColectiva;
