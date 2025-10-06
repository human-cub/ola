export interface PriceData {
  people: number;
  price: number;
}

export interface ProductPrices {
  id: string;
  priceSlider: PriceData[];
  originalPrice: string;
  discountPrice: string;
}

export const productPrices: Record<string, ProductPrices> = {
  protein: {
    id: "protein",
    priceSlider: [
      { people: 1, price: 67200 },
      { people: 10, price: 54900 },
      { people: 30, price: 48600 },
      { people: 50, price: 44200 },
      { people: 100, price: 39800 },
    ],
    originalPrice: "$67.200",
    discountPrice: "$39.800"
  },
  creatine: {
    id: "creatine",
    priceSlider: [
      { people: 1, price: 56000 },
      { people: 10, price: 53400 },
      { people: 30, price: 48100 },
      { people: 50, price: 43600 },
      { people: 100, price: 36800 },
    ],
    originalPrice: "$56.000",
    discountPrice: "$36.800"
  },
  "whey-protein": {
    id: "whey-protein",
    priceSlider: [
      { people: 1, price: 47900 },
      { people: 10, price: 43100 },
      { people: 30, price: 39800 },
      { people: 50, price: 36400 },
      { people: 100, price: 34200 },
    ],
    originalPrice: "$47.900",
    discountPrice: "$34.200"
  },
  "pump-v8": {
    id: "pump-v8",
    priceSlider: [
      { people: 1, price: 36900 },
      { people: 10, price: 33250 },
      { people: 30, price: 30000 },
      { people: 50, price: 27800 },
      { people: 100, price: 25500 },
    ],
    originalPrice: "$36.900",
    discountPrice: "$25.500"
  },
  gainer: {
    id: "gainer",
    priceSlider: [
      { people: 1, price: 62200 },
      { people: 10, price: 56500 },
      { people: 30, price: 49700 },
      { people: 50, price: 45200 },
      { people: 100, price: 38500 },
    ],
    originalPrice: "$62.200",
    discountPrice: "$38.500"
  }
};
