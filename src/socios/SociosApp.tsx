import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { SociosCartProvider } from "./SociosCartProvider";
import Catalogo from "./pages/Catalogo";
import Carrito from "./pages/Carrito";
import Finalizar from "./pages/Finalizar";
import Registro from "./pages/Registro";
import RevisarEmail from "./pages/RevisarEmail";

const PUBLIC_PATHS = ["/registro", "/registro/revisar-email"];

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
      try {
        const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
        if (error) console.error("[Socios Guard] role query error:", error);
        const roles = (data ?? []).map((r: any) => r.role);
        if (mounted) setStatus(roles.includes("mayorista") || roles.includes("admin") ? "authed" : "denied");
      } catch (e) {
        console.error("[Socios Guard] role query exception:", e);
        if (mounted) setStatus("denied");
      }
    };
    supabase.auth.getSession().then(({ data: { session } }) => check(session?.user?.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      // Defer supabase calls to avoid deadlock inside onAuthStateChange
      setTimeout(() => check(s?.user?.id ?? null), 0);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (PUBLIC_PATHS.includes(location.pathname)) return <>{children}</>;
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }
  if (status === "anon") return <Navigate to="/ingresar?redirect=/socios" replace />;
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
          <Route path="/login" element={<Navigate to="/ingresar?redirect=/socios" replace />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/registro/revisar-email" element={<RevisarEmail />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/finalizar" element={<Finalizar />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Guard>
    </SociosCartProvider>
  );
};

export default SociosApp;