import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { GroupBuyPriceBlock } from "@/components/GroupBuyPriceBlock";
import { RelatedProducts } from "@/components/RelatedProducts";
import { supabase } from "@/integrations/supabase/client";
import { DynamicProductCarousel } from "@/components/DynamicProductCarousel";
import { DynamicProductInfo } from "@/components/DynamicProductInfo";
import { DynamicProductDescription } from "@/components/DynamicProductDescription";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";

const categoryLabels: Record<string, string> = {
  proteinas: "Proteínas",
  creatinas: "Creatinas",
  aminoacidos: "Aminoácidos",
  aumentadores: "Ganadores de masa",
  barras: "Barras y snacks",
  "pre-entrenos": "Pre-entrenos",
  colageno: "Colágeno",
  vitaminas: "Vitaminas y minerales",
};

interface ProductData {
  id: string;
  name: string;
  weight: string;
  category: string;
  description: string;
  images: string[];
  prices: { people: number; price: number }[];
  flavors: string[];
  variants: string[];
  waiting_for_discount_count: number;
  virtual_orders_count: number;
}

const DynamicProduct = () => {
  const { slug } = useParams<{ slug: string }>();
  const headerVisible = useScrollHeader();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchProduct = async () => {
      // Try to find by short link first (e.g., /sn-creatina-300)
      let { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("link", `/${slug}`)
        .maybeSingle();

      // Fallback to old format for backwards compatibility
      if (!data) {
        const fallbackResult = await supabase
          .from("products")
          .select("*")
          .eq("link", `/producto/${slug}`)
          .maybeSingle();

        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (cancelled) return;

      if (error || !data) {
        console.error("Product not found:", error);
        setLoading(false);
        return;
      }

      const productData: ProductData = {
        id: data.id,
        name: data.name,
        weight: data.weight,
        category: data.category || "",
        description: data.description || "",
        images: (data.images as string[]) || [],
        prices: (data.prices as { people: number; price: number }[]) || [],
        flavors: (data.flavors as string[]) || [],
        variants: (data.variants as string[]) || [],
        waiting_for_discount_count: data.waiting_for_discount_count,
        virtual_orders_count: data.virtual_orders_count,
      };

      setProduct(productData);
      setWaitingCount(data.total_orders_count || 0);
      setLoading(false);

      // Subscribe to realtime updates (incl. prices thresholds)
      channel = supabase
        .channel(`product-${data.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "products",
            filter: `id=eq.${data.id}`,
          },
          (payload) => {
            const newData = payload.new as any;

            if (newData.total_orders_count !== undefined) {
              setWaitingCount(newData.total_orders_count ?? 0);
            }

            // Keep product fields in sync when admin updates prices/flavors/images
            setProduct((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                prices: (newData.prices as { people: number; price: number }[]) ?? prev.prices,
                flavors: (newData.flavors as string[]) ?? prev.flavors,
                variants: (newData.variants as string[]) ?? prev.variants,
                images: (newData.images as string[]) ?? prev.images,
              };
            });
          }
        )
        .subscribe();
    };

    fetchProduct();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Producto no encontrado</p>
      </div>
    );
  }

  const categoryLabel = product.category ? categoryLabels[product.category] || product.category : null;

  const breadcrumbItems = categoryLabel
    ? [
      { label: "Catálogo", href: "/catalogo" },
      { label: categoryLabel, href: `/categoria/${product.category}` },
      { label: product.name }
    ]
    : [
      { label: "Catálogo", href: "/catalogo" },
      { label: product.name }
    ];

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <main className="pb-[24px] pt-[120px] sm:pt-[104px]">
        <Breadcrumb items={breadcrumbItems} />
        <div className="container gap-4 lg:grid lg:grid-cols-2 lg:justify-center lg:pt-10">
          <div className="contents lg:block">
            <DynamicProductCarousel images={product.images} productName={product.name} />

            <DynamicProductInfo
              name={product.name}
              weight={product.weight}
              flavors={product.flavors}
              variants={product.variants}
            />

            <DynamicProductDescription description={product.description} />
          </div>

          <div className="sticky-viewport lg:contents">
            <div className="sm:flex sm:justify-center sm:gap-6 lg:block">
              <GroupBuyPriceBlock
                productName={product.name}
                productId={product.id}
                productImage={product.images.length > 0 ? product.images[0] : null}
                flavors={product.flavors}
                priceData={product.prices}
                waitingCount={waitingCount}
              />
            </div>
          </div>
        </div>
        <RelatedProducts currentProduct={product.id} />
      </main>

      <Footer />
    </div>
  );
};

export default DynamicProduct;
