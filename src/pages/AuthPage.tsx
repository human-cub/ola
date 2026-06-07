import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ArrowLeft } from "lucide-react";
import { consumePendingAddAction, PendingAddAction } from "@/lib/postAuthAction";
import { toast } from "sonner";
import { ensurePendingCollectiveOrder } from "@/services/orderService";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("login");
  
  const redirectTo = searchParams.get("redirect") || "/";

  // Process pending add action after login
  const processPendingAction = async (userId: string, action: PendingAddAction) => {
    try {
      if (action.kind === "cart") {
        // Insert item into cart
        const { error: cartError } = await supabase.from("cart_items").insert({
          user_id: userId,
          product_id: action.item.product_id,
          product_name: action.item.product_name,
          flavor: action.item.flavor,
          quantity: action.item.quantity,
          price_per_unit: action.item.price_per_unit,
          product_image: action.item.product_image,
          product_link: action.item.product_link ?? null,
          mode: "retail",
        });
        if (cartError) throw cartError;
        toast.success("Producto agregado al carrito");
        navigate(action.redirectTo);
      } else {
        // Waiting list: insert item + ensure pending collective order
        const { error: waitingError } = await supabase.from("waiting_list_items").insert({
          user_id: userId,
          product_id: action.item.product_id,
          product_name: action.item.product_name,
          flavor: action.item.flavor,
          quantity: action.item.quantity,
          current_price_per_unit: action.item.current_price_per_unit,
          product_image: action.item.product_image,
          brand_slug: action.item.brand_slug ?? null,
          retail_price_per_unit: action.item.retail_price_per_unit ?? null,
          guaranteed_price_per_unit: action.item.guaranteed_price_per_unit ?? action.item.current_price_per_unit,
          super_price_per_unit: action.item.super_price_per_unit ?? null,
          product_link: action.item.product_link ?? null,
        });
        if (waitingError) throw waitingError;

        await ensurePendingCollectiveOrder(userId);
        if (action.item.brand_slug) {
          const { error: goalError } = await supabase.rpc("refresh_brand_goal" as any, { _brand_slug: action.item.brand_slug } as any);
          if (goalError) throw goalError;
        }
        toast.success("Producto agregado a mis grupos");
        navigate(action.redirectTo);
      }
    } catch (err) {
      console.error("processPendingAction error:", err);
      navigate(redirectTo);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Check for pending add action
          const pendingAction = consumePendingAddAction();
          if (pendingAction) {
            // Give a moment for auth to settle, then process
            setTimeout(() => {
              void processPendingAction(session.user.id, pendingAction);
            }, 300);
          } else {
            setTimeout(() => {
              navigate(redirectTo);
            }, 500);
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const pendingAction = consumePendingAddAction();
        if (pendingAction) {
          void processPendingAction(session.user.id, pendingAction);
        } else {
          navigate(redirectTo);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <img 
                src="/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" 
                alt="Ola Logo" 
                className="w-12 h-12"
                loading="eager"
                decoding="async"
              />
            </div>
            <CardTitle className="text-2xl">
              {activeTab === "login" ? "Iniciá sesión" : "Creá tu cuenta"}
            </CardTitle>
            <CardDescription>
              {activeTab === "login"
                ? "Ingresá a tu cuenta para ver tus pedidos"
                : "Registrate para acceder a descuentos exclusivos"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm onSuccess={() => {}} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
