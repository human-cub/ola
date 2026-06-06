import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, LogIn, ShoppingCart, Search } from "lucide-react";
import { GroupIcon } from "@/components/icons/GroupIcon";
import olaLogo from "@/assets/ola-logo-new.webp";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BurgerMenu } from "@/components/BurgerMenu";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useUserRole } from "@/hooks/useUserRole";

interface HeaderProps {
  isVisible: boolean;
}

export const Header = ({ isVisible }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);
  const { cartItems, waitingListItems } = useCart();
  const { isMayorista } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const initialQ =
    location.pathname === "/catalogo"
      ? new URLSearchParams(location.search).get("q") ?? ""
      : "";
  const [searchValue, setSearchValue] = useState(initialQ);

  useEffect(() => {
    if (location.pathname === "/catalogo") {
      const q = new URLSearchParams(location.search).get("q") ?? "";
      setSearchValue(q);
    }
  }, [location.pathname, location.search]);

  // Show number of unique items (positions), not total quantities
  const cartCount = cartItems.length;
  const waitingCount = waitingListItems.length;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleHomeClick = () => {
    window.location.href = "/";
  };

  const submitSearch = (value: string) => {
    const trimmed = value.trim();
    const target = trimmed ? `/catalogo?q=${encodeURIComponent(trimmed)}` : "/catalogo";
    navigate(target);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-soft transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      <TopBar />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BurgerMenu />
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={handleHomeClick}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={olaLogo} alt="Ola Wave Logo" className="w-8 h-8 object-contain" loading="eager" decoding="async" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Ola!
            </span>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); submitSearch(searchValue); }}
          className="hidden sm:block flex-1 max-w-md mx-2 sm:mx-3"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar productos…"
              className="pl-9 h-9 rounded-full bg-muted/40"
              aria-label="Buscar productos"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {/* Waiting List Icon — hidden for mayorista (no waiting list flow) */}
          <Link to="/mis-grupos">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/5"
              >
                <GroupIcon className="w-5 h-5 text-muted-foreground" />
                {waitingCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-amber-500 hover:bg-amber-500">
                    {waitingCount}
                  </Badge>
                )}
              </Button>
          </Link>

          {/* Cart Icon */}
          <Link to="/carrito">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary/5"
            >
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User Account */}
          <Link to={user ? "/mi-cuenta" : "/ingresar"}>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/20 hover:border-primary hover:bg-primary/5 gap-2 px-3"
            >
              {user ? (
                <>
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Mi cuenta</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Ingresar</span>
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); submitSearch(searchValue); }}
        className="sm:hidden container mx-auto px-4 pb-2"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Buscar productos…"
            className="pl-9 h-9 rounded-full bg-muted/40"
            aria-label="Buscar productos"
          />
        </div>
      </form>
    </header>
  );
};
