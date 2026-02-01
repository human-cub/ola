import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { HeroSection } from "@/components/HeroSection";

interface Product {
  id: string;
  name: string;
  weight: string;
  images: string[] | null;
  prices: { people: number; price: number }[] | null;
  link: string | null;
}

const categoryLabels: Record<string, string> = {
  proteinas: "Proteínas",
  creatinas: "Creatinas",
  aminoacidos: "Aminoácidos",
  aumentadores: "Aumentadores de masa",
  barras: "Barras y snacks",
  "pre-entrenos": "Pre-entrenos",
  colageno: "Colágeno",
  vitaminas: "Vitaminas y minerales",
};

const Category = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) return;

      const { data, error } = await supabase
        .from("products")
        .select("id, name, weight, images, prices, link")
        .eq("category", category)
        .order("name");

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        const formattedProducts: Product[] = (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          weight: p.weight,
          images: p.images as string[] | null,
          prices: p.prices as { people: number; price: number }[] | null,
          link: p.link,
        }));
        setProducts(formattedProducts);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [category]);

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const categoryName = category ? categoryLabels[category] || category : "Categoría";

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />
      
      <main className="pb-24 pt-[96px] sm:pt-[104px]">
        <Breadcrumb items={[{ label: categoryName }]} />
        <HeroSection />
        
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-center mb-8 bg-gradient-primary bg-clip-text text-transparent">
            {categoryName}
          </h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">Cargando productos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">No hay productos en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => {
                const images = Array.isArray(product.images) ? product.images : [];
                const prices = Array.isArray(product.prices) ? product.prices : [];
                const firstImage = images[0] || "/placeholder.svg";
                const firstPrice = prices[0]?.price || 0;
                const lastPrice = prices[prices.length - 1]?.price || 0;

                return (
                  <Link
                    key={product.id}
                    to={product.link || "#"}
                    className="group bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-square bg-muted/30 p-4 flex items-center justify-center">
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{product.weight}</p>
                      <div className="space-y-0.5">
                        {firstPrice !== lastPrice && (
                          <p className="text-sm text-muted-foreground/70 line-through">
                            {formatPrice(firstPrice)}
                          </p>
                        )}
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(lastPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground">(Precio mínimo)</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Category;
