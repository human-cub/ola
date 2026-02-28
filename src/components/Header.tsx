import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, LogIn, ShoppingCart, Clock } from "lucide-react";
import olaLogo from "@/assets/ola-logo-new.webp";
import { TopHeader } from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BurgerMenu } from "@/components/BurgerMenu";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

interface HeaderProps {
  isVisible: boolean;
}

export const Header = ({ isVisible }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);
  const { cartItems, waitingListItems } = useCart();

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-soft transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <TopHeader />
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BurgerMenu />
          <div 
            className="flex items-center gap-1 cursor-pointer" 
            onClick={handleHomeClick}
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={olaLogo} alt="Ola Wave Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Ola!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Waiting List Icon */}
          <Link to="/lista-espera">
            <Button 
              variant="ghost" 
              size="icon"
              className="relative hover:bg-primary/5"
            >
              <Clock className="w-5 h-5 text-muted-foreground" />
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
    </header>
  );
};
