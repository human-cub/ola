import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { RecommendedProductsGrid } from "@/components/RecommendedProductsGrid";
import { BrandCollectiveCarousel } from "@/components/BrandCollectiveCarousel";
import { Benefits } from "@/components/Benefits";
import { ProcessSteps } from "@/components/ProcessSteps";
import { Testimonials } from "@/components/Testimonials";
import { ServiceDescription } from "@/components/ServiceDescription";
import { Footer } from "@/components/Footer";
import { useScrollHeader } from "@/hooks/useScrollHeader";

const Index = () => {
  const headerVisible = useScrollHeader();

  return (
    <div className="min-h-screen bg-background pt-[120px] sm:pt-[104px]">
      <Header isVisible={headerVisible} />
      
      <main>
        <HeroSection />
        <BrandCollectiveCarousel />
        <RecommendedProductsGrid />
        <Benefits />
        <ProcessSteps />
        <Testimonials />
        <ServiceDescription />
      </main>
      
      <Footer isHomePage />
    </div>
  );
};

export default Index;
