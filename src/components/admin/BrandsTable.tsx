import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, RefreshCw, GripVertical } from "lucide-react";
import { useBrands, type Brand } from "@/hooks/useBrands";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type BoosterMode = 'off' | 'active' | 'first_24h';

interface BrandScore {
  mayorista: number;
  virtual: number;
  score: number;
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);

interface SortableBrandRowProps {
  brand: Brand;
  savingSlug: string | null;
  onToggleActive: (b: Brand, active: boolean) => void;
  scoreData: BrandScore | undefined;
  onSaveTarget: (slug: string, amount: number) => Promise<void>;
  onChangeBooster: (slug: string, mode: BoosterMode) => Promise<void>;
}

const SortableBrandRow = ({ brand: b, savingSlug, onToggleActive, scoreData, onSaveTarget, onChangeBooster }: SortableBrandRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: b.slug });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const hasProducts = (b.products_count ?? 0) > 0;
  const target = Number(b.target_amount ?? 0);
  const [targetInput, setTargetInput] = useState<string>(target ? String(target) : "");
  useEffect(() => {
    setTargetInput(target ? String(target) : "");
  }, [target]);
  const mayorista = scoreData?.mayorista ?? 0;
  const virtual = scoreData?.virtual ?? Number(b.virtual_score ?? 0);
  const score = mayorista + virtual;
  const pct = target > 0 ? Math.min(100, Math.round((score / target) * 100)) : 0;
  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          aria-label="Reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </TableCell>
      <TableCell className="w-16">
        {b.logo_url ? (
          <img
            src={b.logo_url}
            alt={b.name}
            className="h-8 w-auto max-w-[60px] object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="font-medium">{b.name}</TableCell>
      <TableCell className="w-36">
        <Input
          type="number"
          min={0}
          step={1000}
          value={targetInput}
          onChange={(e) => setTargetInput(e.target.value)}
          onBlur={() => {
            const n = Number(targetInput) || 0;
            if (n !== target) onSaveTarget(b.slug, n);
          }}
          placeholder="0"
          className="h-8 text-xs"
        />
      </TableCell>
      <TableCell className="w-40 text-xs">
        <div className="font-medium">{fmtMoney(score)}</div>
        <div className="text-muted-foreground">
          {target > 0 ? `${pct}% de ${fmtMoney(target)}` : "—"}
        </div>
      </TableCell>
      <TableCell className="w-32 text-xs">{fmtMoney(mayorista)}</TableCell>
      <TableCell className="w-44">
        <Select
          value={(b.booster_mode ?? "off") as BoosterMode}
          onValueChange={(v) => onChangeBooster(b.slug, v as BoosterMode)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Inactivo</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="first_24h">Activo 24h</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="w-20 text-center">
        <span className={hasProducts ? "text-foreground" : "text-muted-foreground"}>
          {b.products_count ?? 0}
        </span>
      </TableCell>
      <TableCell className="w-20">
        <Switch
          checked={b.is_active}
          onCheckedChange={(checked) => onToggleActive(b, checked)}
          disabled={savingSlug === b.slug || !hasProducts}
          title={!hasProducts ? "Marca sin productos — inactiva" : undefined}
        />
      </TableCell>
    </TableRow>
  );
};

const BrandsTable = () => {
  const qc = useQueryClient();
  const { data: brands = [], isLoading, refetch, isFetching, error } =
    useBrands({ includeInactive: true });
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [orderedSlugs, setOrderedSlugs] = useState<string[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [scores, setScores] = useState<Map<string, BrandScore>>(new Map());

  useEffect(() => {
    setOrderedSlugs(brands.map((b) => b.slug));
  }, [brands]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error: e } = await supabase.functions.invoke("brand-scores", { body: {} });
        if (e) throw e;
        if (cancelled) return;
        const map = new Map<string, BrandScore>();
        for (const s of (data as { scores?: BrandScore[] & { slug: string }[] })?.scores ?? []) {
          map.set((s as { slug: string }).slug, {
            mayorista: (s as BrandScore).mayorista,
            virtual: (s as BrandScore).virtual,
            score: (s as BrandScore).score,
          });
        }
        setScores(map);
      } catch (err) {
        console.warn("brand-scores load failed", err);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [brands.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const orderedBrands = orderedSlugs
    .map((s) => brands.find((b) => b.slug === s))
    .filter((b): b is Brand => !!b);

  const handleToggleActive = async (b: Brand, isActive: boolean) => {
    setSavingSlug(b.slug);
    try {
      const { error: upErr } = await supabase
        .from("brand_overrides")
        .upsert(
          { slug: b.slug, is_active: isActive, sort_order: b.sort_order ?? 0 },
          { onConflict: "slug" },
        );
      if (upErr) throw upErr;
      qc.invalidateQueries({ queryKey: ["brands"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSavingSlug(null);
    }
  };

  const handleSaveTarget = async (slug: string, amount: number) => {
    try {
      const b = brands.find((x) => x.slug === slug);
      const { error: upErr } = await supabase
        .from("brand_overrides")
        .upsert(
          { slug, target_amount: amount, sort_order: b?.sort_order ?? 0, is_active: b?.is_active ?? true },
          { onConflict: "slug" },
        );
      if (upErr) throw upErr;
      qc.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Target guardado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const handleChangeBooster = async (slug: string, mode: BoosterMode) => {
    try {
      const b = brands.find((x) => x.slug === slug);
      const patch: Record<string, unknown> = {
        slug,
        booster_mode: mode,
        sort_order: b?.sort_order ?? 0,
        is_active: b?.is_active ?? true,
      };
      if (mode !== "off") {
        patch.booster_started_at = new Date().toISOString();
      }
      const { error: upErr } = await supabase
        .from("brand_overrides")
        .upsert(patch, { onConflict: "slug" });
      if (upErr) throw upErr;
      qc.invalidateQueries({ queryKey: ["brands"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedSlugs.indexOf(String(active.id));
    const newIndex = orderedSlugs.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(orderedSlugs, oldIndex, newIndex);
    setOrderedSlugs(next);
    setSavingOrder(true);
    try {
      const rows = next.map((slug, idx) => {
        const b = brands.find((x) => x.slug === slug)!;
        return { slug, sort_order: idx, is_active: b.is_active };
      });
      const { error: upErr } = await supabase
        .from("brand_overrides")
        .upsert(rows, { onConflict: "slug" });
      if (upErr) throw upErr;
      qc.invalidateQueries({ queryKey: ["brands"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al reordenar");
      setOrderedSlugs(brands.map((b) => b.slug));
    } finally {
      setSavingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Marcas</h2>
          <p className="text-xs text-muted-foreground">
            Definí un Target por marca y activá el booster para acumular Score (real + virtual). Arrastrá para reordenar
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          size="sm"
          variant="outline"
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Sincronizar
        </Button>
      </div>

      {error ? (
        <div className="text-sm text-destructive border border-destructive/30 rounded p-3">
          {(error as Error).message}
        </div>
      ) : null}

      {savingOrder ? (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Guardando orden…
        </div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-36">Target</TableHead>
              <TableHead className="w-40">Score</TableHead>
              <TableHead className="w-32">Mayorista</TableHead>
              <TableHead className="w-44">Booster</TableHead>
              <TableHead className="w-20 text-center">Productos</TableHead>
              <TableHead className="w-20">Activa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No se encontraron marcas en la base externa
                </TableCell>
              </TableRow>
            ) : (
              <SortableContext items={orderedSlugs} strategy={verticalListSortingStrategy}>
                {orderedBrands.map((b) => (
                  <SortableBrandRow
                    key={b.slug}
                    brand={b}
                    savingSlug={savingSlug}
                    onToggleActive={handleToggleActive}
                    scoreData={scores.get(b.slug)}
                    onSaveTarget={handleSaveTarget}
                    onChangeBooster={handleChangeBooster}
                  />
                ))}
              </SortableContext>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
};

export default BrandsTable;