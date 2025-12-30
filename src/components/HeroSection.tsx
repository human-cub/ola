import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  const scrollToBenefits = () => {
    const element = document.getElementById('benefits');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-24 pb-4 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 animate-fade-in leading-tight pb-1">
          Comprá minorista <br className="md:hidden" />al precio mayorista
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium mb-6 mt-2 animate-fade-in">
          Hasta 3 veces más barato. Sin riesgos, pagás al recibir
        </p>
      </div>
    </section>
  );
};