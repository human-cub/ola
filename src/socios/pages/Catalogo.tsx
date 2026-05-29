import { useMemo, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSociosProducts } from "../hooks/useSociosProducts";
import { useSociosCartCtx } from "../SociosCartProvider";
import { formatARS } from "../lib/format";
import { SociosHeader } from "../SociosHeader";
import { BrandBar } from "../BrandBar";

const Catalogo = () => {
  const { data: products = [], isLoading } = useSociosProducts();
  const { items, addItem, setQuantity, findLine } = useSociosCartCtx();
  const [search, setSearch] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [flavorByProduct, setFlavorByProduct] = useState<Record<string, string | null>>({});

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedBrandId && p.brand_id !== selectedBrandId) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [products, selectedBrandId, search]);

  void items; // ensure rerender on cart change

  return (
    <div className="min-h-screen bg-background pb-32">
      <SociosHeader search={search} onSearchChange={setSearch} />
      <main className="pt-[112px] px-3">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-baseline justify-between mb-3">
            <h1 className="text-xl font-bold">Catálogo Mayorista</h1>
            <span className="text-xs text-muted-foreground">{filtered.length} productos</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => {
                const selectedFlavor =
                  flavorByProduct[p.id] !== undefined
                    ? flavorByProduct[p.id]
                    : p.flavors[0]?.name ?? null;
                const line = findLine(p.id, selectedFlavor);
                const qty = line?.quantity ?? 0;
                const flavorImage =
                  selectedFlavor && p.flavors.find((f) => f.name === selectedFlavor)?.image;
                const displayImage = flavorImage || p.images[0] || "";

                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 bg-card border rounded-lg p-2 sm:p-3"
                  >
                    <div className="w-16 h-16 shrink-0 bg-muted/30 rounded-md overflow-hidden flex items-center justify-center">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={p.name}
                          width={64}
                          height={64}
                          loading="lazy"
                          className="w-full h-full object-contain"
                        />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight line-clamp-2">
                        {p.name}
                        {p.weight ? <span className="text-muted-foreground"> · {p.weight}</span> : null}
                      </div>
                      {p.flavors.length > 1 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.flavors.map((f) => (
                            <button
                              key={f.name}
                              type="button"
                              onClick={() =>
                                setFlavorByProduct((prev) => ({ ...prev, [p.id]: f.name }))
                              }
                              className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                selectedFlavor === f.name
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {qty === 0 ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            void addItem({
                              product_id: p.id,
                              product_name: p.name,
                              flavor: selectedFlavor,
                              price_per_unit: p.buy_price,
                              product_image: displayImage,
                              quantity: 1,
                            })
                          }
                        >
                          Agregar
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => line && void setQuantity(line.id, qty - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-7 text-center text-sm font-medium">{qty}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => line && void setQuantity(line.id, qty + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 w-24 sm:w-28">
                      <div className="text-xs text-muted-foreground line-through">
                        {formatARS(p.retail_price)}
                      </div>
                      <div className="text-base font-bold">{formatARS(p.buy_price)}</div>
                      {p.discount_pct > 0 && (
                        <div className="text-xs text-emerald-600 font-medium">
                          -{p.discount_pct}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No hay productos
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <BrandBar selectedBrandId={selectedBrandId} onSelect={setSelectedBrandId} />
    </div>
  );
};

export default Catalogo;