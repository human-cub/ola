import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { formatPrice } from "@/lib/formatting";
import { useCategories } from "@/hooks/useCategories";

interface Product {
  id: string;
  name: string;
  weight: string;
  images: string[] | null;
  prices: { people: number; price: number }[] | null;
  link: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

const DEFAULT_TITLE = "Ola! - Suplementos Deportivos | Precio Mayorista en Argentina";
const DEFAULT_DESCRIPTION = "Comprá suplementos deportivos al precio mayorista en Argentina. Proteínas whey, creatina, aminoácidos y más. Envío el mismo día en CABA y GBA. ¡Sin riesgos, pagás al recibir!";

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  proteinas: {
    title: "Proteínas Whey al Precio Mayorista | Ola! Argentina",
    description: "Compra proteínas whey, isolate y concentrado al precio de mayorista en Argentina. ENA, Mervick, Gold Nutrition. Envío en CABA y GBA el mismo día.",
  },
  creatinas: {
    title: "Creatina al Precio Mayorista | Ola! Suplementos Argentina",
    description: "Creatina monohidratada y micronizada al precio mayorista. Mejor precio garantizado. Entrega en CABA y GBA.",
  },
  aminoacidos: {
    title: "Aminoácidos al Precio Mayorista | Ola! Argentina",
    description: "BCAAs, glutamina y aminoácidos esenciales al precio de mayorista. Marcas líderes con envío express en Buenos Aires.",
  },
  aumentadores: {
    title: "Ganadores de Masa al Precio Mayorista | Ola! Argentina",
    description: "Mass gainers y aumentadores de masa muscular al precio mayorista. Hasta 50% de descuento vs precio minorista.",
  },
  barras: {
    title: "Barras y Snacks Proteicos Mayorista | Ola! Argentina",
    description: "Barras proteicas y snacks saludables al precio mayorista. Mervick Protein Bar y más. Envío en CABA y GBA.",
  },
  "pre-entrenos": {
    title: "Pre-Entrenos al Precio Mayorista | Ola! Argentina",
    description: "Pre-workout y pre-entrenos al precio mayorista en Argentina. Beta alanina, cafeína y complejos energéticos.",
  },
  colageno: {
    title: "Colágeno Hidrolizado al Precio Mayorista | Ola! Argentina",
    description: "Colágeno hidrolizado y peptídico al precio mayorista. Gold Nutrition y más marcas. Envío el mismo día en CABA.",
  },
  vitaminas: {
    title: "Vitaminas y Minerales al Precio Mayorista | Ola! Argentina",
    description: "ZMA, vitamina C, magnesio y multivitamínicos al precio mayorista. Star Nutrition y más marcas en Argentina.",
  },
};

const Category = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const headerVisible = useScrollHeader();
  const { data: categories = [] } = useCategories();
  const categoryRow = useMemo<CategoryRow | null>(() => {
    const found = categories.find((c) => c.slug === category);
    if (!found) return null;
    return {
      id: found.id,
      name: found.name,
      slug: found.slug,
      emoji: found.emoji,
      seo_title: found.seo_title ?? null,
      seo_description: found.seo_description ?? null,
    };
  }, [categories, category]);

  useEffect(() => {
    if (!category) return;
    const meta = CATEGORY_META[category];
    const title = categoryRow?.seo_title || meta?.title || DEFAULT_TITLE;
    const description = categoryRow?.seo_description || meta?.description || DEFAULT_DESCRIPTION;
    const canonical = `https://alaola.com.ar/categoria/${category}`;

    document.title = title;

    let descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", description);

    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalTag) {
      canonicalTag.href = canonical;
    } else {
      canonicalTag = document.createElement("link");
      canonicalTag.rel = "canonical";
      canonicalTag.href = canonical;
      document.head.appendChild(canonicalTag);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      if (descTag) descTag.setAttribute("content", DEFAULT_DESCRIPTION);
      if (canonicalTag) canonicalTag.href = "https://alaola.com.ar/";
    };
  }, [category, categoryRow?.seo_title, categoryRow?.seo_description]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select("id, name, weight, images, prices, link")
        .eq("category", category)
        .order("name");

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(
          (data || []).map((p) => ({
            id: p.id,
            name: p.name,
            weight: p.weight,
            images: p.images as string[] | null,
            prices: p.prices as { people: number; price: number }[] | null,
            link: p.link,
          }))
        );
      }
      setLoading(false);
    };

    fetchProducts();
  }, [category]);

  const categoryName = categoryRow?.name || category || "Categoría";

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />
      
      <main className="pb-[24px] pt-[120px] sm:pt-[104px]">
        <Breadcrumb items={[{ label: "Catálogo", href: "/catalogo" }, { label: categoryName }]} />
        
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-center mb-8 bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-2">
            {categoryRow?.emoji && <span className="text-3xl">{categoryRow.emoji}</span>}
            {categoryName}
          </h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
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
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={400}
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
