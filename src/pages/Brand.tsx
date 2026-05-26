import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { formatPrice } from "@/lib/formatting";
import { useBrands } from "@/hooks/useBrands";

interface Product {
  id: string;
  name: string;
  weight: string;
  images: string[] | null;
  prices: { people: number; price: number }[] | null;
  link: string | null;
}

const DEFAULT_TITLE = "Ola! - Suplementos Deportivos | Precio Mayorista en Argentina";
const DEFAULT_DESCRIPTION =
  "Comprá suplementos deportivos al precio mayorista en Argentina. Envío el mismo día en CABA y GBA. ¡Sin riesgos, pagás al recibir!";

const Brand = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const headerVisible = useScrollHeader();
  const { data: brands = [], isLoading: brandsLoading } = useBrands({ includeInactive: true });

  const brand = useMemo(
    () => brands.find((b) => b.slug === slug) ?? null,
    [brands, slug],
  );

  useEffect(() => {
    if (!slug) return;
    const fallbackTitle = brand
      ? `${brand.name} al Precio Mayorista | Ola! Argentina`
      : DEFAULT_TITLE;
    const fallbackDescription = brand
      ? `Comprá productos ${brand.name} al precio mayorista en Argentina. Envío el mismo día en CABA y GBA.`
      : DEFAULT_DESCRIPTION;
    const title = brand?.seo_title || fallbackTitle;
    const description = brand?.seo_description || fallbackDescription;
    const canonical = `https://alaola.com.ar/marca/${slug}`;

    document.title = title;
    const descTag = document.querySelector('meta[name="description"]');
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
  }, [slug, brand]);

  useEffect(() => {
    const load = async () => {
      if (!slug || brandsLoading) return;
      setLoading(true);

      if (!brand || !brand.is_active) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setNotFound(false);

      const { data: prodData, error: prodErr } = await supabase
        .from("products")
        .select("id, name, weight, images, prices, link")
        .eq("brand_id", brand.id)
        .order("name");

      if (!prodErr) {
        setProducts(
          (prodData || []).map((p) => ({
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
    load();
  }, [slug, brand, brandsLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <main className="pb-[24px] pt-[120px] sm:pt-[104px]">
        <Breadcrumb
          items={[
            { label: "Catálogo", href: "/catalogo" },
            { label: brand?.name || "Marca" },
          ]}
        />

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center mb-8 gap-3">
            {brand?.logo_url && (
              <img
                src={brand.logo_url}
                alt={`Logo ${brand.name}`}
                className="h-20 w-auto object-contain"
                loading="eager"
                width={200}
                height={80}
              />
            )}
            <h1 className="text-2xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
              {brand?.name || "Marca"}
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : notFound ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">Marca no encontrada</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex justify-center py-12">
              <p className="text-muted-foreground">No hay productos de esta marca</p>
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

export default Brand;