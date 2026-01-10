import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ArrowLeft } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("login");
  
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    const checkProfileAndRedirect = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("user_id", userId)
        .maybeSingle();

      if (profile?.profile_completed) {
        // Redirect to the original destination or home
        navigate(redirectTo);
      } else {
        // Store redirect for after profile completion
        sessionStorage.setItem("auth_redirect", redirectTo);
        navigate("/completar-perfil");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Give CartContext time to migrate cart items
          setTimeout(() => {
            checkProfileAndRedirect(session.user.id);
          }, 500);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkProfileAndRedirect(session.user.id);
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
