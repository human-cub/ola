import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  const scrollToBenefits = () => {
    const element = document.getElementById('benefits');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-8 md:pt-24 pb-4 px-4">
      <div className="container mx-auto text-center max-w-xs sm:max-w-md md:max-w-2xl">
        <h1 className="text-3xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 animate-fade-in leading-snug pb-2 overflow-visible">
          Comprá al precio mayorista
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium mb-6 mt-2 animate-fade-in">
          Hasta 2 veces más barato. Sin riesgos, pagás al recibir
        </p>
      </div>
    </section>
  );
};