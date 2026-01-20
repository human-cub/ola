import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, ArrowLeft, User, Shield, LogOut, Eye, EyeOff, Package } from "lucide-react";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import OrdersTab from "@/components/profile/OrdersTab";
import { AddressForm } from "@/components/AddressForm";
import { isCABAProvince } from "@/data/argentinaLocations";

const profileSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido").max(50),
  lastName: z.string().min(1, "El apellido es requerido").max(50),
  phone: z.string().min(8, "Teléfono inválido").max(20),
  address: z.string().max(200).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
  newPassword: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[a-zA-Z]/, "Debe contener letras")
    .regex(/[0-9]/, "Debe contener números"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
}

interface AddressData {
  street: string;
  number: string;
  floor: string;
  postalCode: string;
  city: string;
  province: string;
  references: string;
}

// Format address for display - remove labels and brackets
const formatAddressForDisplay = (address: string): string => {
  if (!address) return "";
  
  try {
    const addr = JSON.parse(address) as AddressData;
    const parts = [
      addr.street,
      addr.number,
      addr.floor,
      addr.postalCode,
      addr.city,
      addr.province,
      addr.references,
    ].filter(Boolean);
    return parts.join(", ");
  } catch {
    return address;
  }
};

// Parse stored address JSON to individual fields
const parseStoredAddress = (address: string): AddressData => {
  try {
    const addr = JSON.parse(address);
    return {
      street: addr.street || "",
      number: addr.number || "",
      floor: addr.floor || "",
      postalCode: addr.postalCode || "",
      city: addr.city || "",
      province: addr.province || "",
      references: addr.references || "",
    };
  } catch {
    return {
      street: "",
      number: "",
      floor: "",
      postalCode: "",
      city: "",
      province: "",
      references: "",
    };
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Address fields
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [references, setReferences] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/ingresar");
        return;
      }

      setEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setPhone(profile.phone || "");
        
        // Parse stored address
        if (profile.address) {
          const addr = parseStoredAddress(profile.address);
          setStreet(addr.street);
          setStreetNumber(addr.number);
          setFloor(addr.floor);
          setPostalCode(addr.postalCode);
          setCity(addr.city);
          setProvince(addr.province);
          setReferences(addr.references);
        }
      }

      setLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setErrors({});

    const validation = profileSchema.safeParse({
      firstName,
      lastName,
      phone,
      address: street ? JSON.stringify({
        street,
        number: streetNumber,
        floor,
        postalCode,
        city: isCABAProvince(province) ? province : city,
        province,
        references,
      }) : undefined,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Build address JSON
      const addressJson = street ? JSON.stringify({
        street,
        number: streetNumber,
        floor,
        postalCode,
        city: isCABAProvince(province) ? province : city,
        province,
        references,
      }) : null;

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          address: addressJson,
        })
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast.success("Perfil actualizado");
    } catch (error: any) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});

    const validation = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setPasswordErrors(fieldErrors);
      return;
    }

    setChangingPassword(true);

    try {
      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordErrors({ currentPassword: "Contraseña actual incorrecta" });
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast.success("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Error al cambiar la contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="container mx-auto max-w-2xl">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mi cuenta</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Mis Pedidos</span>
              <span className="sm:hidden">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Mi Perfil</span>
              <span className="sm:hidden">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Seguridad</span>
              <span className="sm:hidden">Clave</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Información personal</CardTitle>
                <CardDescription>
                  Actualizá tus datos de contacto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    El email no se puede cambiar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                <Separator className="my-4" />

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
                  hideReferences={true}
                  title="Dirección"
                />

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar contraseña</CardTitle>
                <CardDescription>
                  Actualizá tu contraseña de acceso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={passwordErrors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={passwordErrors.newPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, con letras y números
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirmar nueva contraseña</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={passwordErrors.confirmPassword ? "border-destructive" : ""}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    "Cambiar contraseña"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <FloatingWhatsApp />
    </div>
  );
};

export default Profile;
