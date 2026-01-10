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
import { getAllProducts } from "@/data/products";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const syncAttempted = useRef(false);

  // Sync products from products.ts to Supabase
  const syncProducts = async () => {
    if (syncAttempted.current) return;
    syncAttempted.current = true;

    try {
      const allProducts = getAllProducts();
      const productsData = allProducts.map(p => ({
        id: p.id,
        name: p.name,
        weight: p.weight,
        priceSlider: p.priceSlider,
        description: p.description,
        link: p.link,
        image: p.image,
        flavors: p.flavors,
        variants: p.variants,
      }));

      const { data, error } = await supabase.functions.invoke('sync-products', {
        body: { products: productsData }
      });

      if (error) throw error;
      
      if (data?.inserted > 0) {
        console.log(`Synced ${data.inserted} new products`);
      }
    } catch (error) {
      console.error('Error syncing products:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/ingresar");
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
        toast.error("No tenés permisos de administrador");
        // Don't sign out - just redirect to home
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      
      // Sync products after auth check
      syncProducts();
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
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </div>

        <Tabs defaultValue="userorders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="userorders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>
          <TabsContent value="userorders">
            <UserOrdersTable />
          </TabsContent>
          <TabsContent value="products">
            <ProductsTable />
          </TabsContent>
          <TabsContent value="users">
            <UsersTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
