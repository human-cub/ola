import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, User, Shield, LogOut, Package } from "lucide-react";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import OrdersTab from "@/components/profile/OrdersTab";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { SecurityForm } from "@/components/profile/SecurityForm";

const fetchProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return { session, profile };
};

const Profile = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const email = data?.session?.user?.email || "";

  useEffect(() => {
    if (!isLoading && !data) navigate("/ingresar");
  }, [isLoading, data, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

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
