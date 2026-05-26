import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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

interface SortableBrandRowProps {
  brand: Brand;
  savingSlug: string | null;
  onToggleActive: (b: Brand, active: boolean) => void;
}

const SortableBrandRow = ({ brand: b, savingSlug, onToggleActive }: SortableBrandRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: b.slug });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const hasProducts = (b.products_count ?? 0) > 0;
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
      <TableCell className="font-mono text-xs text-muted-foreground">{b.slug}</TableCell>
      <TableCell className="text-xs max-w-[200px] truncate" title={b.seo_title ?? ""}>
        {b.seo_title ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-xs max-w-[280px] truncate" title={b.seo_description ?? ""}>
        {b.seo_description ?? <span className="text-muted-foreground">—</span>}
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

  useEffect(() => {
    setOrderedSlugs(brands.map((b) => b.slug));
  }, [brands]);

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
            Nombre, slug, logo y SEO se importan desde la base externa. Arrastrá
            para reordenar. Las marcas sin productos quedan inactivas automáticamente
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
              <TableHead>Slug</TableHead>
              <TableHead>SEO Title</TableHead>
              <TableHead>SEO Description</TableHead>
              <TableHead className="w-20 text-center">Productos</TableHead>
              <TableHead className="w-20">Activa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
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