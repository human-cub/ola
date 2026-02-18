import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  const scrollToBenefits = () => {
    const element = document.getElementById('benefits');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-8 md:pt-24 pb-4 px-3">
      <div className="mx-auto text-center max-w-[94%] sm:max-w-md md:max-w-2xl">
        <h1 className="text-[clamp(2rem,8.8vw,3rem)] md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 animate-fade-in leading-[1.15] pb-2 overflow-visible whitespace-nowrap">
          <span className="block">Comprá minorista</span>
          <span className="block">al precio mayorista</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium mb-6 mt-2 animate-fade-in max-w-[85%] sm:max-w-sm md:max-w-none mx-auto">
          Accedé a precios de mayorista - hasta 50% menos
        </p>
      </div>
    </section>
  );
};