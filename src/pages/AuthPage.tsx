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

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("login");
  
  const redirectTo = searchParams.get("redirect") || "/";

  // Helper: format price for notifications
  const formatPrice = (price: number) => `$${Math.round(price).toLocaleString('es-AR')}`;

  // Helper: calculate next Sunday 23:59 ISO
  const computeNextSundayCloseIso = (): string => {
    const now = new Date();
    const nextSunday = new Date(now);
    const daysUntilSunday = (7 - now.getDay()) % 7;
    if (daysUntilSunday === 0 && now.getHours() < 23) {
      nextSunday.setHours(23, 59, 59, 999);
    } else {
      nextSunday.setDate(now.getDate() + (daysUntilSunday || 7));
      nextSunday.setHours(23, 59, 59, 999);
    }
    return nextSunday.toISOString();
  };

  // Process pending add action after login
  const processPendingAction = async (userId: string, action: PendingAddAction) => {
    try {
      if (action.kind === "cart") {
        // Insert item into cart
        await supabase.from("cart_items").insert({
          user_id: userId,
          product_id: action.item.product_id,
          product_name: action.item.product_name,
          flavor: action.item.flavor,
          quantity: action.item.quantity,
          price_per_unit: action.item.price_per_unit,
          product_image: action.item.product_image,
        });
        toast.success("Producto agregado al carrito");
        navigate(action.redirectTo);
      } else {
        // Waiting list: insert item + ensure pending collective order
        await supabase.from("waiting_list_items").insert({
          user_id: userId,
          product_id: action.item.product_id,
          product_name: action.item.product_name,
          flavor: action.item.flavor,
          quantity: action.item.quantity,
          current_price_per_unit: action.item.current_price_per_unit,
          product_image: action.item.product_image,
        });

        // Check if pending collective order exists
        const { data: existingOrder } = await supabase
          .from("user_orders")
          .select("id")
          .eq("user_id", userId)
          .eq("order_type", "collective")
          .eq("status", "pending")
          .maybeSingle();

        if (existingOrder) {
          // Sync order items
          const { data: waitingListData } = await supabase
            .from("waiting_list_items")
            .select("*")
            .eq("user_id", userId);

          if (waitingListData && waitingListData.length > 0) {
            const orderItems = waitingListData.map((i) => ({
              product_id: i.product_id,
              product_name: i.product_name,
              flavor: i.flavor,
              quantity: i.quantity,
              price_per_unit: i.current_price_per_unit,
              product_image: i.product_image,
            }));
            const subtotal = waitingListData.reduce(
              (sum, i) => sum + Number(i.current_price_per_unit) * i.quantity,
              0
            );
            await supabase
              .from("user_orders")
              .update({
                items: orderItems,
                subtotal,
                total_amount: subtotal,
                collective_close_date: computeNextSundayCloseIso(),
              })
              .eq("id", existingOrder.id);
          }
          toast.success("Producto agregado a la lista de espera");
        } else {
          // Create new pending collective order
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, phone, address")
            .eq("user_id", userId)
            .maybeSingle();

          const customerName =
            [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
            "Cliente";
          const phone = profile?.phone || "";

          let deliveryAddress: any = null;
          if (profile?.address) {
            try {
              deliveryAddress = JSON.parse(profile.address);
            } catch {
              deliveryAddress = null;
            }
          }

          const orderItems = [
            {
              product_id: action.item.product_id,
              product_name: action.item.product_name,
              flavor: action.item.flavor,
              quantity: action.item.quantity,
              price_per_unit: action.item.current_price_per_unit,
              product_image: action.item.product_image,
            },
          ];

          const subtotal = action.item.current_price_per_unit * action.item.quantity;

          const orderNumber = `OLA-${new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          const { data: newOrder, error: insertError } = await supabase
            .from("user_orders")
            .insert({
              user_id: userId,
              order_number: orderNumber,
              order_type: "collective",
              items: orderItems,
              subtotal,
              total_amount: subtotal,
              delivery_address: deliveryAddress,
              status: "pending",
              collective_close_date: computeNextSundayCloseIso(),
              notes: phone || null,
            })
            .select("id, order_number")
            .single();

          if (insertError) {
            console.error("Error creating order:", insertError);
          } else {
            // Notify Telegram
            const orderUrl = `${window.location.origin}/mi-cuenta/pedidos/${newOrder.id}`;
            await supabase.functions.invoke("notify-telegram", {
              body: {
                order_id: newOrder.id,
                order_number: newOrder.order_number,
                order_type: "Compra Colectiva",
                customer_name: customerName,
                phone,
                total: formatPrice(subtotal),
                order_url: orderUrl,
                waiting_for_discount: true,
              },
            });
          }
          toast.success("Producto agregado a la lista de espera");
        }
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
