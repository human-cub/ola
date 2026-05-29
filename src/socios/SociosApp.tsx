import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { SociosCartProvider } from "./SociosCartProvider";
import Catalogo from "./pages/Catalogo";
import Carrito from "./pages/Carrito";
import Finalizar from "./pages/Finalizar";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Profile from "@/pages/Profile";
import OrderDetail from "@/pages/OrderDetail";

const PUBLIC_PATHS = ["/login", "/registro"];

const Guard = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"loading" | "anon" | "authed" | "denied">("loading");
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const check = async (uid: string | null) => {
      if (!uid) {
        if (mounted) setStatus("anon");
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const roles = (data ?? []).map((r: any) => r.role);
      if (mounted) setStatus(roles.includes("mayorista") || roles.includes("admin") ? "authed" : "denied");
    };
    supabase.auth.getSession().then(({ data: { session } }) => check(session?.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => check(s?.user?.id ?? null));
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (PUBLIC_PATHS.includes(location.pathname)) return <>{children}</>;
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (status === "anon") return <Navigate to="/login" replace />;
  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-sm">
          <h1 className="text-xl font-bold mb-2">Acceso restringido</h1>
          <p className="text-muted-foreground text-sm">Este portal es exclusivo para socios mayoristas autorizados.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

export const SociosApp = () => {
  return (
    <SociosCartProvider>
      <Guard>
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/finalizar" element={<Finalizar />} />
          <Route path="/mi-cuenta" element={<Profile />} />
          <Route path="/mi-cuenta/pedidos/:orderId" element={<OrderDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Guard>
    </SociosCartProvider>
  );
};

export default SociosApp;