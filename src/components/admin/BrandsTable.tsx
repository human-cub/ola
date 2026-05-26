import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface SortableRowProps {
  brand: Brand;
  draftEmoji: string;
  onEmojiChange: (slug: string, value: string) => void;
  onSaveEmoji: (b: Brand) => void;
  onToggleActive: (b: Brand, active: boolean) => void;
  savingSlug: string | null;
  emojiDirty: boolean;
}

const SortableRow = ({
  brand: b,
  draftEmoji,
  onEmojiChange,
  onSaveEmoji,
  onToggleActive,
  savingSlug,
  emojiDirty,
}: SortableRowProps) => {
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
        ) : b.emoji ? (
          <span className="text-xl">{b.emoji}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      <TableCell className="w-20">
        <Input
          value={draftEmoji}
          onChange={(e) => onEmojiChange(b.slug, e.target.value)}
          placeholder="🏷️"
          className="w-14 h-8 text-center"
        />
      </TableCell>
      <TableCell className="font-medium">{b.name}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{b.slug}</TableCell>
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
      <TableCell className="text-right w-28">
        <Button
          size="sm"
          variant={emojiDirty ? "default" : "ghost"}
          onClick={() => onSaveEmoji(b)}
          disabled={!emojiDirty || savingSlug === b.slug}
        >
          {savingSlug === b.slug ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Guardar"
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
};

const BrandsTable = () => {
  const qc = useQueryClient();
  const { data: brands = [], isLoading, refetch, isFetching, error } =
    useBrands({ includeInactive: true });
  const [emojiDrafts, setEmojiDrafts] = useState<Record<string, string>>({});
  const [orderedSlugs, setOrderedSlugs] = useState<string[]>([]);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
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

  const upsertOverride = async (
    b: Brand,
    patch: { emoji?: string | null; sort_order?: number; is_active?: boolean },
  ) => {
    const payload = {
      slug: b.slug,
      emoji: patch.emoji !== undefined ? patch.emoji : b.emoji,
      sort_order: patch.sort_order !== undefined ? patch.sort_order : b.sort_order,
      is_active: patch.is_active !== undefined ? patch.is_active : b.is_active,
    };
    const { error: upErr } = await supabase
      .from("brand_overrides")
      .upsert(payload, { onConflict: "slug" });
    if (upErr) throw upErr;
  };

  const handleSaveEmoji = async (b: Brand) => {
    const draft = emojiDrafts[b.slug] ?? "";
    setSavingSlug(b.slug);
    try {
      await upsertOverride(b, { emoji: draft.trim() || null });
      toast.success("Guardado");
      setEmojiDrafts((prev) => {
        const next = { ...prev };
        delete next[b.slug];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["brands"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingSlug(null);
    }
  };

  const handleToggleActive = async (b: Brand, isActive: boolean) => {
    setSavingSlug(b.slug);
    try {
      await upsertOverride(b, { is_active: isActive });
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
        return {
          slug,
          emoji: b.emoji,
          sort_order: idx,
          is_active: b.is_active,
        };
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
            Nombre, slug, logo y SEO se importan desde la base externa. Las
            marcas sin productos quedan inactivas automáticamente
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead className="w-20">Emoji</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-20 text-center">Productos</TableHead>
              <TableHead className="w-20">Activa</TableHead>
              <TableHead className="text-right w-28">Acción</TableHead>
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
              <SortableContext
                items={orderedSlugs}
                strategy={verticalListSortingStrategy}
              >
                {orderedBrands.map((b) => {
                  const draftEmoji = emojiDrafts[b.slug] ?? (b.emoji ?? "");
                  const emojiDirty = draftEmoji !== (b.emoji ?? "");
                  return (
                    <SortableRow
                      key={b.slug}
                      brand={b}
                      draftEmoji={draftEmoji}
                      onEmojiChange={(slug, value) =>
                        setEmojiDrafts((prev) => ({ ...prev, [slug]: value }))
                      }
                      onSaveEmoji={handleSaveEmoji}
                      onToggleActive={handleToggleActive}
                      savingSlug={savingSlug}
                      emojiDirty={emojiDirty}
                    />
                  );
                })}
              </SortableContext>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
};

export default BrandsTable;