import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChevronRight } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";

const catalogCategories = [
  { name: "Proteínas", slug: "proteinas", emoji: "💪" },
  { name: "Creatinas", slug: "creatinas", emoji: "⚡" },
  { name: "Aminoácidos", slug: "aminoacidos", emoji: "🧬" },
  { name: "Ganadores de masa", slug: "aumentadores", emoji: "🚀" },
  { name: "Barras y snacks", slug: "barras", emoji: "🍫" },
  { name: "Pre-entrenos", slug: "pre-entrenos", emoji: "🔥" },
  { name: "Colágeno", slug: "colageno", emoji: "✨" },
  { name: "Vitaminas y minerales", slug: "vitaminas", emoji: "💊" },
];

const Catalog = () => {
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <div className="pt-[120px] sm:pt-[104px]">
        <Breadcrumb items={[{ label: "Catálogo" }]} />
      </div>

      <main className="pb-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Catálogo
          </h1>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-2 mb-8"></div>

          <div className="max-w-md mx-auto space-y-3">
            {catalogCategories.map((category) => (
              <Link
                key={category.slug}
                to={`/categoria/${category.slug}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-card shadow-soft hover:shadow-elegant transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.emoji}</span>
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Catalog;
