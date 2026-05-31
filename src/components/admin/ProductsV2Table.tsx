import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, RefreshCw, Snowflake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSociosProducts, type SociosProduct } from "@/socios/hooks/useSociosProducts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type SortMode = "brand" | "category";

// Fetch all candidate products (active in external DB, excludes "No producido")
// Bypasses the socios override filter so admins can see/manage them.
const fetchAllProducts = async (): Promise<SociosProduct[]> => {
  const { data, error } = await supabase.functions.invoke("fetch-external-products");
  if (error) throw error;
  return ((data as any)?.products ?? []) as SociosProduct[];
};

const fetchOverrides = async (): Promise<Record<string, boolean>> => {
  const { data, error } = await supabase
    .from("socios_product_overrides")
    .select("sku,is_active");
  if (error) throw error;
  const map: Record<string, boolean> = {};
  for (const r of (data ?? []) as { sku: string; is_active: boolean }[]) {
    map[r.sku] = r.is_active;
  }
  return map;
};

interface WeeklyPriceSet {
  retail: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
}

interface SnapshotRow {
  sku: string;
  current_prices: WeeklyPriceSet | null;
  this_week_prices: WeeklyPriceSet | null;
  last_week_prices: WeeklyPriceSet | null;
  current_updated_at: string | null;
  snapshotted_at: string | null;
}

const fetchSnapshots = async (): Promise<Record<string, SnapshotRow>> => {
  const { data, error } = await supabase
    .from("sku_price_snapshots")
    .select("sku, current_prices, this_week_prices, last_week_prices, current_updated_at, snapshotted_at");
  if (error) throw error;
  const map: Record<string, SnapshotRow> = {};
  for (const r of (data ?? []) as SnapshotRow[]) map[r.sku] = r;
  return map;
};

const fmt = (n: number | undefined) =>
  typeof n === "number" && n > 0 ? `$${Math.round(n).toLocaleString("es-AR")}` : "—";

const ProductsV2Table = () => {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin", "external-products", "all"],
    queryFn: fetchAllProducts,
  });
  const { data: overrides = {} } = useQuery({
    queryKey: ["admin", "socios-overrides"],
    queryFn: fetchOverrides,
  });
  const { data: snapshots = {} } = useQuery({
    queryKey: ["admin", "sku-price-snapshots"],
    queryFn: fetchSnapshots,
  });
  const { data: brands = [] } = useBrands({ includeInactive: true });
  const { data: categories = [] } = useCategories({ includeInactive: true });

  const [sortMode, setSortMode] = useState<SortMode>("brand");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [syncing, setSyncing] = useState(false);
  const [freezing, setFreezing] = useState(false);

  const runSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-sku-prices");
      if (error) throw error;
      toast.success(`Precios actuales actualizados (${(data as any)?.upserted ?? 0} SKUs)`);
      qc.invalidateQueries({ queryKey: ["admin", "sku-price-snapshots"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  const runFreeze = async () => {
    if (!confirm("¿Fijar precios actuales como precios de esta semana? Los precios de esta semana pasarán a la semana anterior.")) return;
    setFreezing(true);
    try {
      const { data, error } = await supabase.functions.invoke("freeze-weekly-prices");
      if (error) throw error;
      toast.success(`Precios fijados para la nueva semana (${(data as any)?.frozen ?? 0} SKUs)`);
      qc.invalidateQueries({ queryKey: ["admin", "sku-price-snapshots"] });
      qc.invalidateQueries({ queryKey: ["catalog-products"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setFreezing(false);
    }
  };

  const isActive = (sku: string) => overrides[sku] !== false; // default true

  const toggleActive = async (sku: string, next: boolean) => {
    const { error } = await supabase
      .from("socios_product_overrides")
      .upsert({ sku, is_active: next }, { onConflict: "sku" });
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.setQueryData<Record<string, boolean>>(
      ["admin", "socios-overrides"],
      (prev) => ({ ...(prev ?? {}), [sku]: next }),
    );
    qc.invalidateQueries({ queryKey: ["socios", "products"] });
  };

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: SociosProduct[] }>();
    for (const p of products) {
      const key = sortMode === "brand"
        ? p.brand_id ?? "__none__"
        : p.category_slug ?? "__none__";
      const label = sortMode === "brand"
        ? p.brand_name ?? "Sin marca"
        : p.category_slug ?? "Sin categoría";
      if (!map.has(key)) map.set(key, { key, label, items: [] });
      map.get(key)!.items.push(p);
    }
    const arr = Array.from(map.values());
    if (sortMode === "brand") {
      const order = new Map<string, number>();
      brands.forEach((b, i) => order.set(b.id, i));
      arr.sort((a, b) => {
        const ai = order.has(a.key) ? order.get(a.key)! : Number.MAX_SAFE_INTEGER;
        const bi = order.has(b.key) ? order.get(b.key)! : Number.MAX_SAFE_INTEGER;
        if (ai !== bi) return ai - bi;
        return a.label.localeCompare(b.label);
      });
    } else {
      arr.sort((a, b) => a.label.localeCompare(b.label));
    }
    const catOrder = new Map<string, number>();
    categories.forEach((c, i) => {
      if (c.id) catOrder.set(c.id.toLowerCase().trim(), i);
      if (c.slug) catOrder.set(c.slug.toLowerCase().trim(), i);
      if (c.name) catOrder.set(c.name.toLowerCase().trim(), i);
    });
    const catKey = (s: string | null | undefined) =>
      s ? s.toLowerCase().trim() : "";
    for (const g of arr) {
      if (sortMode === "brand") {
        g.items.sort((a, b) => {
          const ak = catKey(a.category_slug);
          const bk = catKey(b.category_slug);
          const ai = catOrder.has(ak) ? catOrder.get(ak)! : Number.MAX_SAFE_INTEGER;
          const bi = catOrder.has(bk) ? catOrder.get(bk)! : Number.MAX_SAFE_INTEGER;
          if (ai !== bi) return ai - bi;
          if (ak !== bk) return ak.localeCompare(bk);
          return a.name.localeCompare(b.name);
        });
      } else {
        g.items.sort((a, b) => a.name.localeCompare(b.name));
      }
    }
    return arr;
  }, [products, sortMode, brands, categories]);

  useEffect(() => {
    // Collapsed by default when sort mode changes
    setExpanded({});
  }, [sortMode, products.length]);

  const toggleGroup = (key: string) =>
    setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const totalActive = products.filter((p) => isActive(p.sku)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Productos V2 (Mayorista)</h2>
          <p className="text-sm text-muted-foreground">
            {totalActive} activos · {products.length} candidatos · los inactivos se ocultan en{" "}
            <a
              href="https://alaola.com.ar/socios"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              alaola.com.ar/socios
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={runSync}
            disabled={syncing}
          >
            {syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
            Sync precios actuales
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={runFreeze}
            disabled={freezing}
          >
            {freezing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Snowflake className="w-4 h-4 mr-1" />}
            Fijar semana
          </Button>
          <span className="text-sm text-muted-foreground">Agrupar por:</span>
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brand">Marca</SelectItem>
              <SelectItem value="category">Categoría</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const open = expanded[g.key] ?? false;
            const activeCount = g.items.filter((p) => isActive(p.sku)).length;
            return (
              <div key={g.key} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(g.key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {open ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-medium">{g.label}</span>
                    <span className="text-xs text-muted-foreground">
                      ({activeCount}/{g.items.length})
                    </span>
                  </div>
                </button>
                {open && (
                  <div className="divide-y">
                    {g.items.map((p) => {
                      const active = isActive(p.sku);
                      const rawFirst = p.images?.[0] || "";
                      const img = rawFirst.includes("|")
                        ? rawFirst.split("|")[0]
                        : rawFirst;
                      const snap = snapshots[p.sku];
                      const last = snap?.last_week_prices;
                      const thisW = snap?.this_week_prices;
                      const current = snap?.current_prices;
                      return (
                        <div
                          key={p.sku}
                          className="flex items-center gap-3 px-4 py-2"
                        >
                          <div className="w-10 h-10 shrink-0 bg-muted/30 rounded overflow-hidden flex items-center justify-center">
                            {img && (
                              <img
                                src={img}
                                alt={p.name}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{p.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              SKU: {p.sku}
                              {p.category_slug ? ` · ${p.category_slug}` : ""}
                              {p.flavor ? ` · ${p.flavor}` : ""}
                            </div>
                          </div>
                          <div className="hidden md:grid grid-cols-3 gap-3 text-xs text-right shrink-0">
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">Anterior</div>
                              <div>{fmt(last?.retail)} → {fmt(last?.t4)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">Esta semana</div>
                              <div>{fmt(thisW?.retail)} → {fmt(thisW?.t4)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground">Actual</div>
                              <div>{fmt(current?.retail)} → {fmt(current?.t4)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {active ? "Activo" : "Inactivo"}
                            </span>
                            <Switch
                              checked={active}
                              onCheckedChange={(v) => void toggleActive(p.sku, v)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No hay productos
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductsV2Table;