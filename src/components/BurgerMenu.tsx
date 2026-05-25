import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, ChevronRight, ChevronLeft, Home, BookOpen, HelpCircle, Briefcase, Users, MessageCircle, Truck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCategories } from "@/hooks/useCategories";
import { useBrands } from "@/hooks/useBrands";

type MenuChild = { name: string; slug: string; emoji?: string | null; basePath: string };

type MenuItem = {
  name: string;
  to?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: MenuChild[];
  allHref?: string;
  allLabel?: string;
};

export const BurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const categoryChildren: MenuChild[] = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    emoji: c.emoji,
    basePath: "/categoria",
  }));

  const brandChildren: MenuChild[] = brands.map((b) => ({
    name: b.name,
    slug: b.slug,
    emoji: b.emoji,
    basePath: "/marca",
  }));

  const mainMenu: MenuItem[] = [
    { name: "Inicio", to: "/", icon: Home },
    {
      name: "Catálogo",
      to: "/catalogo",
      icon: BookOpen,
      children: categoryChildren,
      allHref: "/catalogo",
      allLabel: "Ver todo el catálogo",
    },
    ...(brandChildren.length
      ? [
          {
            name: "Marcas",
            to: "/catalogo",
            icon: Tag,
            children: brandChildren,
            allLabel: "Todas las marcas",
          } as MenuItem,
        ]
      : []),
    { name: "Cómo Comprar", to: "/como-comprar", icon: HelpCircle },
    { name: "Envíos y Devoluciones", to: "/envios-y-devoluciones", icon: Truck },
    { name: "Ventas Mayoristas", to: "/mayoristas", icon: Briefcase },
    { name: "Quiénes Somos", to: "/quienes-somos", icon: Users },
    { name: "Contacto", to: "/contacto", icon: MessageCircle },
  ];

  const close = () => {
    setIsOpen(false);
    setActiveSubmenu(null);
    setHoveredItem(null);
  };

  const handleNav = (path: string) => {
    close();
    navigate(path);
  };

  const activeMenuItem = mainMenu.find((m) => m.name === activeSubmenu);

  // ============ MOBILE: Multi-level push menu ============
  const renderMobile = () => (
    <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 overflow-hidden">
      <SheetHeader className="p-6 pb-4 border-b">
        <SheetTitle className="text-left">
          {activeSubmenu ? (
            <button
              onClick={() => setActiveSubmenu(null)}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="font-bold text-xl">{activeSubmenu}</span>
            </button>
          ) : (
            <span className="bg-gradient-primary bg-clip-text text-transparent font-bold text-xl">
              Menú
            </span>
          )}
        </SheetTitle>
      </SheetHeader>

      {/* Sliding container */}
      <div className="relative w-full h-[calc(100%-73px)] overflow-hidden">
        {/* Level 1 */}
        <nav
          className={`absolute inset-0 p-4 transition-transform duration-300 ${
            activeSubmenu ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          <ul className="space-y-1">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  {item.children ? (
                    <div className="flex items-center rounded-lg hover:bg-primary/10 transition-colors group">
                      <button
                        onClick={() => handleNav(item.to!)}
                        className="flex items-center gap-3 flex-1 p-3 text-left"
                      >
                        {Icon && <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveSubmenu(item.name)}
                        className="p-3 border-l border-border/50"
                        aria-label={`Abrir ${item.name}`}
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleNav(item.to!)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                    >
                      {Icon && <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Level 2 */}
        <nav
          className={`absolute inset-0 p-4 transition-transform duration-300 ${
            activeSubmenu ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {activeMenuItem?.children && (
            <ul className="space-y-1">
              {activeMenuItem.allHref && (
                <li>
                  <button
                    onClick={() => handleNav(activeMenuItem.allHref!)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/10 transition-colors text-left group border-b border-border/50 mb-2"
                  >
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {activeMenuItem.allLabel || "Ver todo"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </li>
              )}
              {activeMenuItem.children.map((child) => (
                <li key={`${child.basePath}-${child.slug}`}>
                  <button
                    onClick={() => handleNav(`${child.basePath}/${child.slug}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {child.emoji && <span className="text-lg">{child.emoji}</span>}
                      {child.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>
    </SheetContent>
  );

  // ============ DESKTOP: Flyout menu ============
  const renderDesktop = () => (
    <SheetContent side="left" className="w-[280px] p-0 overflow-visible">
      <SheetHeader className="p-6 pb-4 border-b">
        <SheetTitle className="text-left">
          <span className="bg-gradient-primary bg-clip-text text-transparent font-bold text-xl">
            Menú
          </span>
        </SheetTitle>
      </SheetHeader>

      <nav className="p-4 relative">
        <ul className="space-y-1">
          {mainMenu.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const isHovered = hoveredItem === item.name;
            return (
              <li
                key={item.name}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => handleNav(item.to!)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                  </div>
                  {hasChildren && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </button>

                {/* Flyout submenu */}
                {hasChildren && isHovered && (
                  <div
                    className="absolute left-full top-0 ml-1 w-[260px] bg-background border rounded-lg shadow-elegant p-2 z-50 animate-in fade-in slide-in-from-left-2 duration-150"
                  >
                    <ul className="space-y-1">
                      {item.allHref && (
                        <li>
                          <button
                            onClick={() => handleNav(item.allHref!)}
                            className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-primary/10 transition-colors text-left group border-b border-border/50 mb-1"
                          >
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {item.allLabel || "Ver todo"}
                            </span>
                          </button>
                        </li>
                      )}
                      {item.children!.map((child) => (
                        <li key={`${child.basePath}-${child.slug}`}>
                          <button
                            onClick={() => handleNav(`${child.basePath}/${child.slug}`)}
                            className="w-full flex items-center justify-between p-2.5 rounded-md hover:bg-primary/10 transition-colors text-left group"
                          >
                            <span className="text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                              {child.emoji && <span>{child.emoji}</span>}
                              {child.name}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </SheetContent>
  );

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setActiveSubmenu(null); setHoveredItem(null); } }}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-primary/10"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      {isMobile ? renderMobile() : renderDesktop()}
    </Sheet>
  );
};
