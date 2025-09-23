import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import wheyProteinMain from "@/assets/whey-protein-main.png";
import pumpV8Main from "@/assets/pump-v8-main.png";

export const MainProductCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const products = [
    {
      id: "protein",
      name: "TrueMade Whey Protein",
      description: "Proteína de suero premium",
      weight: "930g",
      link: "/ena-whey-930",
      image: "/truemade-protein-main.webp",
      originalPrice: "$64.000",
      discountPrice: "$36.200"
    },
    {
      id: "creatine",
      name: "Creatina Monohidrato Star Nutrition",
      description: "Creatina monohidrato micronizada",
      weight: "500g",
      link: "/sn-creatina-500",
      image: "https://www.demusculos.com/web/wp-content/uploads/2024/11/creatina-500-grs-star-1.jpg",
      originalPrice: "$52.900",
      discountPrice: "$34.000"
    },
    {
      id: "whey-protein",
      name: "Whey Protein Doypack 2 Lb",
      description: "Proteína en práctico doypack",
      weight: "900g",
      link: "/sn-whey-908",
      image: wheyProteinMain,
      originalPrice: "$41.900",
      discountPrice: "$23.000"
    },
    {
      id: "pump-v8",
      name: "Star Nutrition Pump V8",
      description: "Pre-entreno de máximo rendimiento",
      weight: "285g",
      link: "/sn-pumpv8-285",
      image: pumpV8Main,
      originalPrice: "$36.500",
      discountPrice: "$20.500"
    },
    {
      id: "gainer",
      name: "Gold Nutrition Gainer Gold",
      description: "Ganador de masa muscular premium",
      weight: "5 lbs",
      link: "/gn-gainer-2267",
      image: "https://acdn-us.mitiendanube.com/stores/583/512/products/gainer-cbc507a865b208583517254733035648-1024-1024.png",
      originalPrice: "$66.400",
      discountPrice: "$35.100"
    }
  ];

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleProductClick = (productLink: string) => {
    sessionStorage.setItem('scrollTarget', 'product-photos');
    window.location.href = productLink;
  };

  return (
    <section className="px-4 py-8">
      <div className="container mx-auto max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Nuestros Productos
          </h2>
          <p className="text-muted-foreground">
            Suplementos premium al mejor precio
          </p>
          <div className="w-20 h-1 bg-gradient-primary mx-auto rounded-full mt-4"></div>
        </div>

        <div className="relative">
          {/* Main product card */}
          <Card className="p-6 shadow-soft border border-border/50 bg-gradient-card">
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                <img 
                  src={products[currentIndex].image} 
                  alt={products[currentIndex].name}
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = '<div class="w-32 h-32 bg-primary/20 rounded-xl"></div>';
                  }}
                />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                {products[currentIndex].name}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-2">
                {products[currentIndex].description}
              </p>
              
              <p className="text-primary font-semibold mb-4">
                Masa neto: {products[currentIndex].weight}
              </p>

              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg text-muted-foreground line-through">
                    {products[currentIndex].originalPrice}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {products[currentIndex].discountPrice}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Precio por 100 pedidos
                </p>
              </div>

              <Button 
                onClick={() => handleProductClick(products[currentIndex].link)}
                className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-8 py-3 rounded-full shadow-elegant transition-all duration-300 hover:shadow-glow w-full"
              >
                Ver Producto
              </Button>
            </div>
          </Card>

          {/* Navigation buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevProduct}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-border/50 shadow-soft"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={nextProduct}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-border/50 shadow-soft"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-primary w-8' 
                  : 'bg-primary/30 hover:bg-primary/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};