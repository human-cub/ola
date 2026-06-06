import { describe, it, expect } from "vitest";
import { searchProducts, normalize } from "./productSearch";
import type { CatalogProduct } from "@/hooks/useCatalogProducts";

const mk = (
  name: string,
  brandName: string,
  categorySlug: string,
  flavors: string[] = [],
  tags: string[] = [],
  sortOrder = 1,
): CatalogProduct => ({
  urlSlug: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  nameShort: null,
  size: "1 kg",
  description: null,
  images: [],
  galleryImages: [],
  brandId: null,
  brandName,
  brandSlug: null,
  categorySlug,
  seoTitle: null,
  seoDescription: null,
  tags,
  sortOrder,
  priceT1: 0,
  priceT2: 0,
  priceT3: 0,
  priceT4: 1000,
  priceRetailDisplay: 1500,
  variants: (flavors.length ? flavors : [null]).map((f, i) => ({
    sku: `SKU-${i}`,
    productId: `${i}`,
    flavor: f,
    images: [],
    priceT1: 0,
    priceT2: 0,
    priceT3: 0,
    priceT4: 0,
    priceRetailDisplay: 0,
  })),
});

const catMap = new Map([
  ["proteinas", "Proteínas"],
  ["creatinas", "Creatinas"],
  ["aminoacidos", "Aminoácidos"],
]);

const products = [
  mk("100% Whey Protein", "ENA Sport", "proteinas", ["Vainilla", "Chocolate"]),
  mk("Creatina Monohidrato", "Star Nutrition", "creatinas"),
  mk("BCAA 2000", "Star Nutrition", "aminoacidos"),
  mk("Barrita Proteica", "Mole", "proteinas", ["Frutilla"]),
];

const top = (q: string) => searchProducts(products, q, catMap, 3)[0]?.product.name;

describe("searchProducts", () => {
  it("normaliza acentos y mayúsculas", () => {
    expect(normalize("Proteína")).toBe("proteina");
  });
  it("sinónimo: proteina -> whey", () => expect(top("proteina")).toBe("100% Whey Protein"));
  it("sinónimo: aminos -> BCAA", () => expect(top("aminos")).toBe("BCAA 2000"));
  it("tolera tipeo: creatna -> Creatina", () => expect(top("creatna")).toBe("Creatina Monohidrato"));
  it("match directo: whey", () => expect(top("whey")).toBe("100% Whey Protein"));
  it("por sabor: vainilla", () => expect(top("vainilla")).toBe("100% Whey Protein"));
  it("por marca: ena", () => expect(top("ena")).toBe("100% Whey Protein"));
  it("sin resultados para texto sin sentido", () =>
    expect(searchProducts(products, "xyzzy", catMap).length).toBe(0));
});
