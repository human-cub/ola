import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BurgerMenu } from "@/components/BurgerMenu";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  isVisible: boolean;
}

export const Header = ({ isVisible }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);

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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
        <div className="z-20">
          <BurgerMenu />
        </div>
        
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 cursor-pointer z-20" 
          onClick={handleHomeClick}
        >
          <div className="w-12 h-12 flex items-center justify-center">
            <img src="/lovable-uploads/f61342f0-4c86-4d5f-8e4a-6f6380460a50.png" alt="Ola Wave Logo" className="w-8 h-8 object-contain" />
          </div>
          <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Ola!
          </span>
        </div>

        <Link to={user ? "/mi-cuenta" : "/ingresar"} className="z-20">
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
    </header>
  );
};
