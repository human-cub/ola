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
      { people: 10, price: 54900 },
      { people: 30, price: 48600 },
      { people: 50, price: 44200 },
      { people: 100, price: 39800 },
    ],
    originalPrice: "$67.200",
    discountPrice: "$39.800",
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
      { people: 1, price: 56000 },
      { people: 10, price: 53400 },
      { people: 30, price: 48100 },
      { people: 50, price: 43600 },
      { people: 100, price: 36800 },
    ],
    originalPrice: "$56.000",
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
      { people: 1, price: 47900 },
      { people: 10, price: 43100 },
      { people: 30, price: 39800 },
      { people: 50, price: 36400 },
      { people: 100, price: 34200 },
    ],
    originalPrice: "$47.900",
    discountPrice: "$34.200",
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
      { people: 1, price: 36900 },
      { people: 10, price: 33250 },
      { people: 30, price: 30000 },
      { people: 50, price: 27800 },
      { people: 100, price: 25500 },
    ],
    originalPrice: "$36.900",
    discountPrice: "$25.500",
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
      { people: 1, price: 62200 },
      { people: 10, price: 56500 },
      { people: 30, price: 49700 },
      { people: 50, price: 45200 },
      { people: 100, price: 38500 },
    ],
    originalPrice: "$62.200",
    discountPrice: "$38.500",
    flavors: ["Chocolate", "Vainilla"]
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
