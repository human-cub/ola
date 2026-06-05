import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ProductsTable from "@/components/admin/ProductsTable";
import OrdersTable from "@/components/admin/OrdersTable";
import UsersTable from "@/components/admin/UsersTable";
import UserOrdersTable from "@/components/admin/UserOrdersTable";
import PromoCodesTable from "@/components/admin/PromoCodesTable";
import CategoriesTable from "@/components/admin/CategoriesTable";
import BrandsTable from "@/components/admin/BrandsTable";
import AdminSettings from "@/components/admin/AdminSettings";
import ProductsV2Table from "@/components/admin/ProductsV2Table";
import { ExternalLink } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/ingresar");
        return;
      }

      // Check if user is admin
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (rolesError) console.error("[Admin] role query error:", rolesError);
      if (!roles) {
        toast.error("No tenés permisos de administrador");
        // Don't sign out - just redirect to home
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/ingresar");
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open("/", "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir sitio
            </Button>
            <Button onClick={handleLogout} variant="outline" className="mx-0">
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <Tabs defaultValue="userorders" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="userorders">Pedidos</TabsTrigger>
            <TabsTrigger value="productsv2">Productos</TabsTrigger>
            <TabsTrigger value="taxonomy">Cat. y Marcas</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="promos">Promos</TabsTrigger>
            <TabsTrigger value="settings">Mayorista</TabsTrigger>
          </TabsList>
          <TabsContent value="userorders">
            <UserOrdersTable />
          </TabsContent>
          <TabsContent value="productsv2">
            <ProductsV2Table />
          </TabsContent>
          <TabsContent value="taxonomy">
            <div className="space-y-10">
              <CategoriesTable />
              <BrandsTable />
            </div>
          </TabsContent>
          <TabsContent value="users">
            <UsersTable />
          </TabsContent>
          <TabsContent value="promos">
            <PromoCodesTable />
          </TabsContent>
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
