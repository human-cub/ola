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
      { people: 10, price: 55700 },
      { people: 30, price: 49600 },
      { people: 50, price: 45200 },
      { people: 100, price: 38800 },
    ],
    originalPrice: "$67.200",
    discountPrice: "$38.800"
  },
  creatine: {
    id: "creatine",
    priceSlider: [
      { people: 1, price: 53400 },
      { people: 10, price: 50700 },
      { people: 30, price: 47100 },
      { people: 50, price: 43600 },
      { people: 100, price: 36800 },
    ],
    originalPrice: "$53.400",
    discountPrice: "$36.800"
  },
  "whey-protein": {
    id: "whey-protein",
    priceSlider: [
      { people: 1, price: 53000 },
      { people: 10, price: 51200 },
      { people: 30, price: 46800 },
      { people: 50, price: 39400 },
      { people: 100, price: 34200 },
    ],
    originalPrice: "$53.000",
    discountPrice: "$34.200"
  },
  "pump-v8": {
    id: "pump-v8",
    priceSlider: [
      { people: 1, price: 37600 },
      { people: 10, price: 35000 },
      { people: 30, price: 31000 },
      { people: 50, price: 27800 },
      { people: 100, price: 25500 },
    ],
    originalPrice: "$37.600",
    discountPrice: "$25.500"
  },
  gainer: {
    id: "gainer",
    priceSlider: [
      { people: 1, price: 57900 },
      { people: 10, price: 53200 },
      { people: 30, price: 49700 },
      { people: 50, price: 44200 },
      { people: 100, price: 38500 },
    ],
    originalPrice: "$57.900",
    discountPrice: "$38.500"
  }
};
