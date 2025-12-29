export interface ProductFlavors {
  flavors?: string[];
  variants?: string[];
}

export interface ProductData {
  id: string;
  name: string;
  description: string;
  weight: string;
  link: string;
  image: string;
  priceSlider: { people: number; price: number }[];
  originalPrice: string;
  discountPrice: string;
  flavors?: string[];
  variants?: string[];
}

export const products: Record<string, ProductData> = {
  protein: {
    id: "protein",
    name: "ENA TrueMade Whey Protein",
    description: "Proteína de suero premium",
    weight: "930g",
    link: "/ena-whey-930",
    image: "/truemade-protein-main.webp",
    priceSlider: [
      { people: 1, price: 67200 },
      { people: 25, price: 59100 },
      { people: 50, price: 52600 },
      { people: 75, price: 45200 },
      { people: 100, price: 38800 },
    ],
    originalPrice: "$67.200",
    discountPrice: "$38.800",
    flavors: ["Double Rich Chocolate", "Vanilla Ice Cream", "Cookies & Cream", "Banana Shake", "Strawberry Milkshake"]
  },
  creatine: {
    id: "creatine",
    name: "Star Nutrition Creatina",
    description: "Creatina monohidrato micronizada",
    weight: "500g",
    link: "/sn-creatina-500",
    image: "https://www.demusculos.com/web/wp-content/uploads/2024/11/creatina-500-grs-star-1.jpg",
    priceSlider: [
      { people: 1, price: 53400 },
      { people: 25, price: 50700 },
      { people: 50, price: 47100 },
      { people: 75, price: 43600 },
      { people: 100, price: 36800 },
    ],
    originalPrice: "$53.400",
    discountPrice: "$36.800",
    variants: [
      "Polvo sin sabor 500g",
      "100% Pura - Creatina Micronizada",
      "Ultra Micronizada para mejor absorción",
      "5 gramos por porción",
      "Máxima pureza"
    ]
  },
  "whey-protein": {
    id: "whey-protein",
    name: "Star Nutrition Whey Protein",
    description: "Proteína en práctico doypack",
    weight: "908g",
    link: "/sn-whey-908",
    image: "/whey-protein-main.png",
    priceSlider: [
      { people: 1, price: 56800 },
      { people: 25, price: 54000 },
      { people: 50, price: 48800 },
      { people: 75, price: 41400 },
      { people: 100, price: 35200 },
    ],
    originalPrice: "$56.800",
    discountPrice: "$35.200",
    flavors: ["Chocolate", "Vanilla", "Cookies & Cream", "Frutilla", "Banana"]
  },
  "pump-v8": {
    id: "pump-v8",
    name: "Star Nutrition Pump V8",
    description: "Pre-entreno de máximo rendimiento",
    weight: "285g",
    link: "/sn-pumpv8-285",
    image: "/pump-v8-main.png",
    priceSlider: [
      { people: 1, price: 42000 },
      { people: 25, price: 40100 },
      { people: 50, price: 35200 },
      { people: 75, price: 32800 },
      { people: 100, price: 27500 },
    ],
    originalPrice: "$42.000",
    discountPrice: "$27.500",
    flavors: ["Açaí", "Grape", "Watermelon", "Lima Limón"]
  },
  gainer: {
    id: "gainer",
    name: "Gold Nutrition Gainer Gold",
    description: "Ganador de masa muscular premium",
    weight: "2267g",
    link: "/gn-gainer-2267",
    image: "https://acdn-us.mitiendanube.com/stores/583/512/products/gainer-cbc507a865b208583517254733035648-1024-1024.png",
    priceSlider: [
      { people: 1, price: 57900 },
      { people: 25, price: 54200 },
      { people: 50, price: 49700 },
      { people: 75, price: 43200 },
      { people: 100, price: 35500 },
    ],
    originalPrice: "$57.900",
    discountPrice: "$35.500",
    flavors: ["Chocolate", "Vainilla"]
  },
  "platinum-protein": {
    id: "platinum-protein",
    name: "Star Nutrition Platinum Protein",
    description: "Proteína premium Grass Fed",
    weight: "908g",
    link: "/sn-platinum-908",
    image: "/src/assets/platinum-protein-main.png",
    priceSlider: [
      { people: 1, price: 68079 },
      { people: 25, price: 61890 },
      { people: 50, price: 55701 },
      { people: 75, price: 49512 },
      { people: 100, price: 39628 },
    ],
    originalPrice: "$68.079",
    discountPrice: "$39.628",
    flavors: ["Chocolate", "Vanilla", "Cookies & Cream", "Frutilla", "Banana"]
  },
  "ena-bars": {
    id: "ena-bars",
    name: "ENA Protein Bar",
    description: "Snack rico en proteínas",
    weight: "16 unidades",
    link: "/ena-bars-16",
    image: "/src/assets/ena-bars-main.png",
    priceSlider: [
      { people: 1, price: 36198 },
      { people: 25, price: 32907 },
      { people: 50, price: 29616 },
      { people: 75, price: 26326 },
      { people: 100, price: 22813 },
    ],
    originalPrice: "$36.198",
    discountPrice: "$22.813",
    flavors: ["Chocolate", "Coco y dulce de leche", "Frutilla", "Banana"]
  },
  "plant-protein": {
    id: "plant-protein",
    name: "Star Nutrition Just Plant Protein",
    description: "Proteína 100% vegetal sin sabor",
    weight: "908g",
    link: "/sn-plant-908",
    image: "/src/assets/plant-protein-main.png",
    priceSlider: [
      { people: 1, price: 59287 },
      { people: 25, price: 53897 },
      { people: 50, price: 48507 },
      { people: 75, price: 43118 },
      { people: 100, price: 37231 },
    ],
    originalPrice: "$59.287",
    discountPrice: "$37.231",
    flavors: ["Sin sabor"]
  },
  "omega3": {
    id: "omega3",
    name: "Star Nutrition Omega 3",
    description: "Aceite de pescado ultra concentrado",
    weight: "60 cápsulas",
    link: "/sn-omega3-60",
    image: "/src/assets/omega3-main.png",
    priceSlider: [
      { people: 1, price: 46079 },
      { people: 25, price: 41890 },
      { people: 50, price: 37701 },
      { people: 75, price: 33512 },
      { people: 100, price: 26398 },
    ],
    originalPrice: "$46.079",
    discountPrice: "$26.398"
  },
  "collagen": {
    id: "collagen",
    name: "Star Nutrition Collagen",
    description: "Colágeno hidrolizado con vitamina C",
    weight: "210g",
    link: "/sn-collagen-210",
    image: "/src/assets/collagen-main.png",
    priceSlider: [
      { people: 1, price: 28342 },
      { people: 25, price: 25765 },
      { people: 50, price: 23189 },
      { people: 75, price: 20612 },
      { people: 100, price: 16047 },
    ],
    originalPrice: "$28.342",
    discountPrice: "$16.047",
    flavors: ["Limón", "Frutos Rojos"]
  },
  "magnesio": {
    id: "magnesio",
    name: "Star Nutrition Magnesio",
    description: "Citrato de magnesio en polvo",
    weight: "500g",
    link: "/sn-magnesio-500",
    image: "/src/assets/magnesio-main.png",
    priceSlider: [
      { people: 1, price: 41191 },
      { people: 25, price: 37446 },
      { people: 50, price: 33701 },
      { people: 75, price: 29957 },
      { people: 100, price: 24412 },
    ],
    originalPrice: "$41.191",
    discountPrice: "$24.412",
    flavors: ["Frutos Rojos", "Sin Sabor"]
  },
  "creatine-pote": {
    id: "creatine-pote",
    name: "Star Nutrition Creatina Pote",
    description: "Creatina monohidrato ultramicronizada",
    weight: "300g",
    link: "/sn-creatina-300",
    image: "/src/assets/creatine-pote-main.png",
    priceSlider: [
      { people: 1, price: 45247 },
      { people: 25, price: 41134 },
      { people: 50, price: 37021 },
      { people: 75, price: 32907 },
      { people: 100, price: 28306 },
    ],
    originalPrice: "$45.247",
    discountPrice: "$28.306"
  }
};

// Helper function to get product by ID
export const getProduct = (id: string): ProductData | undefined => {
  return products[id];
};

// Helper function to get all products as array
export const getAllProducts = (): ProductData[] => {
  return Object.values(products);
};
