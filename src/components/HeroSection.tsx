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
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4 animate-fade-in">
          Comprá minorista al precio mayorista. Hasta 3 veces más barato. Sin riesgos, pagás al recibir
        </h1>
        <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mb-6"></div>
        <Button 
          onClick={scrollToBenefits}
          className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-8 py-3 rounded-full shadow-elegant transition-all duration-300 hover:shadow-glow animate-fade-in"
        >
          Más info
        </Button>
      </div>
    </section>
  );
};