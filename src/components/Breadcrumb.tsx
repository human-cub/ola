import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav className="bg-muted/30 border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <ol className="flex items-center gap-2 text-sm flex-wrap">
          <li>
            <Link 
              to="/" 
              className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
          </li>
          
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              {item.href ? (
                <Link 
                  to={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
};
