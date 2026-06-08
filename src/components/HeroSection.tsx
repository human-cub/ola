import { cn } from "@/lib/utils";

export const HeroSection = () => {
  return (
    <section className="hidden md:block py-8 md:py-12 px-3" id="hero-section">
      <div className="mx-auto text-center md:max-w-none">
        <h1 className={cn(
          "font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in leading-[1.15] py-2 overflow-visible whitespace-nowrap",
          "text-4xl md:text-5xl"
        )}>
          ¡Seamos más pagamos menos!
        </h1>
      </div>
    </section>
  );
};
