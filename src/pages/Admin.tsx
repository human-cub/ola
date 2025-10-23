import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ProductsTable from "@/components/admin/ProductsTable";
import OrdersTable from "@/components/admin/OrdersTable";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roles) {
        toast.error("No tienes permisos de administrador");
        await supabase.auth.signOut();
        navigate("/auth");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        <Tabs defaultValue="participants" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participants">Participantes</TabsTrigger>
            <TabsTrigger value="buynow">Comprar Ahora</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
          </TabsList>
          <TabsContent value="participants">
            <OrdersTable waitingForDiscount={true} />
          </TabsContent>
          <TabsContent value="buynow">
            <OrdersTable waitingForDiscount={false} />
          </TabsContent>
          <TabsContent value="products">
            <ProductsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
