import { cn } from "@/lib/utils";

export const HeroSection = () => {
  return (
    <section className="hidden md:block pt-1 pb-4 px-3" id="hero-section">
      <div className="mx-auto text-center md:max-w-none">
        <h1 className={cn(
          "font-bold bg-gradient-primary bg-clip-text text-transparent animate-fade-in leading-[1.15] pb-1 overflow-visible whitespace-nowrap",
          "text-2xl md:text-3xl"
        )}>
          ¡Seamos más pagamos menos!
        </h1>
      </div>
    </section>
  );
};
