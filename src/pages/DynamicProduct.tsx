import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { PriceSlider } from "@/components/PriceSlider";
import { RelatedProducts } from "@/components/RelatedProducts";
import { FloatingButton } from "@/components/FloatingButton";
import { supabase } from "@/integrations/supabase/client";
import { DynamicProductCarousel } from "@/components/DynamicProductCarousel";
import { DynamicProductInfo } from "@/components/DynamicProductInfo";
import { DynamicProductDescription } from "@/components/DynamicProductDescription";

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
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
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

      // Subscribe to realtime updates
      const channel = supabase
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
              setWaitingCount(newData.total_orders_count);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchProduct();
  }, [slug]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando producto...</p>
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
        { label: categoryLabel, href: `/categoria/${product.category}` },
        { label: product.name }
      ]
    : [{ label: product.name }];

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />
      
      <main className="pb-24 pt-[96px] sm:pt-[104px]">
        <Breadcrumb items={breadcrumbItems} />
        <DynamicProductCarousel images={product.images} productName={product.name} />
        <DynamicProductInfo 
          name={product.name} 
          weight={product.weight} 
          flavors={product.flavors} 
          variants={product.variants}
        />
        <PriceSlider priceData={product.prices} waitingCount={waitingCount} />
        <DynamicProductDescription description={product.description} />
        <RelatedProducts currentProduct={product.id} />
      </main>

      <Footer />

      <FloatingButton 
        productName={product.name} 
        productId={product.id}
        productImage={product.images.length > 0 ? product.images[0] : null}
        flavors={product.flavors}
        prices={product.prices}
        waitingCount={waitingCount}
      />
    </div>
  );
};

export default DynamicProduct;
