import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShoppingCart, User, LogIn, Search } from "lucide-react";
import olaLogo from "@/assets/ola-logo-new.webp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useSociosCartCtx } from "./SociosCartProvider";
import { useMayoristaMin } from "./hooks/useMayoristaMin";
import { formatARS } from "./lib/format";

interface Props {
  search: string;
  onSearchChange: (s: string) => void;
}

export const SociosHeader = ({ search, onSearchChange }: Props) => {
  const { items, subtotal } = useSociosCartCtx();
  const min = useMayoristaMin();
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async (uid: string | null) => {
      if (!uid) {
        setFirstName("");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", uid)
        .maybeSingle();
      setFirstName((data?.first_name as string) || "");
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      void loadProfile(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      void loadProfile(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const cartCount = items.length;
  const missing = Math.max(0, min - subtotal);
  const showFaltan = subtotal > 0 && missing > 0;
  const minReached = subtotal > 0 && missing === 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-soft">
      <div className="container mx-auto px-4 h-16 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={olaLogo} alt="Ola Socios" className="w-8 h-8 object-contain" loading="eager" />
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent hidden sm:inline">
            Ola! <span className="text-sm font-medium text-muted-foreground">Socios</span>
          </span>
        </Link>

        <div className="flex-1 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar productos…"
              className="pl-9 h-10 rounded-full bg-muted/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to="/carrito">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 hover:border-primary hover:bg-primary/5 gap-2"
            onClick={() => {
              if (user) {
                // Exit /socios basename to reach the shared profile page
                window.location.href = "/mi-cuenta";
              } else {
                navigate("/login");
              }
            }}
          >
            {user ? <User className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span className="hidden sm:inline">{user ? "Mi cuenta" : "Ingresar"}</span>
          </Button>
        </div>
      </div>

      {user && (
        <div className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-1.5 text-xs sm:text-sm text-right">
            <span className="text-muted-foreground">Hola, </span>
            <span className="font-medium">{firstName || "socio"}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            {showFaltan ? (
              <span className="text-destructive font-medium">
                Faltan: {formatARS(missing)}
              </span>
            ) : minReached ? (
              <span className="text-primary font-medium">
                Total: {formatARS(subtotal)}
              </span>
            ) : (
              <span className="text-muted-foreground">
                Mínimo: {formatARS(min)}
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
};