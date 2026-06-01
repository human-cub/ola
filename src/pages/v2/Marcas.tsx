import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Footer } from "@/components/Footer";
import { Spinner } from "@/components/ui/spinner";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useBrands } from "@/hooks/useBrands";
import { BrandProgressBar, useBrandProgress } from "@/components/BrandProgressBar";

const MarcasV2 = () => {
  const headerVisible = useScrollHeader();
  const { data: brands = [], isLoading } = useBrands();

  useEffect(() => {
    document.title = "Marcas | Ola! Argentina";
  }, []);

  const sorted = [...brands].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />
      <main className="pb-[24px] pt-[120px] sm:pt-[104px]">
        <Breadcrumb items={[{ label: "Marcas" }]} />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Marcas
          </h1>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-2 mb-8" />

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {sorted.map((b) => (
                <BrandIndexCard
                  key={b.slug}
                  slug={b.slug}
                  name={b.name}
                  logoUrl={b.logo_url}
                  emoji={b.emoji}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MarcasV2;

const BrandIndexCard = ({
  slug,
  name,
  logoUrl,
  emoji,
}: {
  slug: string;
  name: string;
  logoUrl?: string | null;
  emoji?: string | null;
}) => {
  const { reached } = useBrandProgress(slug);
  return (
    <Link
      to={`/marcas/${slug}`}
      className={`group bg-card rounded-xl border p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col gap-3 ${
        reached ? "ring-2 ring-primary border-primary shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-3 h-16">
        {logoUrl ? (
          <img src={logoUrl} alt={`Logo ${name}`} className="h-12 w-auto object-contain" loading="lazy" decoding="async" />
        ) : (
          <span className="text-2xl">{emoji || "🏷️"}</span>
        )}
        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </span>
      </div>
      <BrandProgressBar brandSlug={slug} />
    </Link>
  );
};