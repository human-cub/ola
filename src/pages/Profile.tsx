import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { signOutAndRedirect } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, User, Shield, LogOut, Package, Copy, Share2 } from "lucide-react";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import OrdersTab from "@/components/profile/OrdersTab";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { SecurityForm } from "@/components/profile/SecurityForm";
import { useUserRole } from "@/hooks/useUserRole";
import { useAppSetting } from "@/hooks/useAppSetting";
import { ShareBlock } from "@/components/ShareBlock";
import { toast } from "sonner";
import type { AddressData } from "@/lib/address";
import logoOlaSocios from "@/assets/logo-ola-socios.png";
import logoOla from "@/assets/logo-ola.png";

const fetchProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return { session, profile };
}


// Format address for display - remove labels and brackets
// const formatAddressForDisplay = (address: string): string => {
//   if (!address) return "";
  
//   try {
//     const addr = JSON.parse(address) as AddressData;
//     const parts = [
//       addr.street,
//       addr.number,
//       addr.floor,
//       addr.postalCode,
//       addr.city,
//       addr.province,
//       addr.references,
//     ].filter(Boolean);
//     return parts.join(", ");
//   } catch {
//     return address;
//   }
// };

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
      city: "Capital Federal (CABA)",
      province: "Buenos Aires",
      references: "",
    };
  }
};

const profileDefaults = {
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
};

const Profile = () => {
  const navigate = useNavigate();
  const { isMayorista, isAdmin } = useUserRole();
  const { value: viralEnabled } = useAppSetting<boolean>("viral_enabled", false);

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const email = data?.session?.user?.email || "";
  const refCode = (data?.profile as any)?.referral_code as string | undefined;
  const refLink = refCode ? `https://alaola.com.ar/?ref=${refCode}` : null;
  const showInvite = !!(viralEnabled && refLink);

  useEffect(() => {
    if (!isLoading && !data) navigate("/ingresar");
  }, [isLoading, data, navigate]);

  const handleLogout = () => signOutAndRedirect();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="container mx-auto max-w-2xl">
        {isMayorista || isAdmin ? (
          <div className={`grid gap-3 mb-6 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
            {(isMayorista || isAdmin) && (
              <a
                href="/socios"
                className="flex items-center justify-center h-11 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
              >
                Ola Socios
              </a>
            )}
            <a
              href="/"
              className="flex items-center justify-center h-11 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
            >
              Ola
            </a>
            {isAdmin && (
              <a
                href="/admin"
                className="flex items-center justify-center h-11 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-medium"
              >
                Admin
              </a>
            )}
          </div>
        ) : (
          <a
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </a>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {isMayorista ? "Mi cuenta Mayorista" : "Mi cuenta"}
          </h1>
          <Button variant="outline" onClick={handleLogout} className="mx-0">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>

        <Tabs defaultValue={showInvite ? "invite" : "orders"} key={showInvite ? "with-invite" : "no-invite"}>
          <TabsList className={`grid w-full ${showInvite ? "grid-cols-4" : "grid-cols-3"} mb-6`}>
            {showInvite && (
              <TabsTrigger value="invite" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>Invitar</span>
              </TabsTrigger>
            )}
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

          {showInvite && (
            <TabsContent value="invite">
              <div className="rounded-lg border border-primary/20 bg-gradient-primary/10 p-4">
                <p className="text-base font-semibold text-primary mb-1">Tu link de invitación</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Invitá amigos: cuando se suman a un grupo, todos pagamos menos.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <code className="flex-1 truncate rounded bg-background/60 px-3 py-2 text-sm">{refLink}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { navigator.clipboard.writeText(refLink!); toast.success("\u00a1Link copiado!"); }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <ShareBlock refLink={refLink!} />
              </div>
            </TabsContent>
          )}

          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileEditForm profile={data?.profile} email={email} />
          </TabsContent>

          <TabsContent value="security">
            <SecurityForm email={email} />
          </TabsContent>
        </Tabs>
      </div>

      <FloatingWhatsApp />
    </div>
  );
};

export default Profile;
