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
import { Loader2, RefreshCw, GripVertical, Sparkles } from "lucide-react";
import { useCategories, type Category } from "@/hooks/useCategories";
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

const SUGGESTED_EMOJIS: Record<string, string> = {
  creatinas: "💪",
  aminoacidos: "🧬",
  proteinas: "🥛",
  "ganadores-de-masa": "🏋️",
  "barras-y-snacks": "🍫",
  "vitaminas-y-minerales": "💊",
  colageno: "✨",
  "pre-entrenos": "⚡",
  "recuperadores-musculares": "🧘",
  quemadores: "🔥",
  electrolitos: "💧",
  almacen: "🛒",
  superfoods: "🥬",
  accesorios: "🎒",
  salsas: "🥫",
  "frutos-secos": "🥜",
  semillas: "🌾",
  energy: "🚀",
};

interface SortableRowProps {
  category: Category;
  draftEmoji: string;
  onEmojiChange: (slug: string, value: string) => void;
  onSaveEmoji: (c: Category) => void;
  onToggleActive: (c: Category, active: boolean) => void;
  onApplySuggestion: (c: Category) => void;
  savingSlug: string | null;
  emojiDirty: boolean;
}

const SortableRow = ({
  category: c,
  draftEmoji,
  onEmojiChange,
  onSaveEmoji,
  onToggleActive,
  onApplySuggestion,
  savingSlug,
  emojiDirty,
}: SortableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: c.slug });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  const suggested = SUGGESTED_EMOJIS[c.slug];
  const showSuggestion = suggested && !draftEmoji.trim();

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
      <TableCell className="w-24">
        <div className="flex items-center gap-1">
          <Input
            value={draftEmoji}
            onChange={(e) => onEmojiChange(c.slug, e.target.value)}
            placeholder={suggested ?? "💪"}
            className="w-14 h-8 text-center"
          />
          {showSuggestion ? (
            <button
              type="button"
              onClick={() => onApplySuggestion(c)}
              className="text-base hover:scale-125 transition-transform"
              title="Usar sugerencia"
            >
              {suggested}
            </button>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="font-medium">{c.name}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
      <TableCell className="w-20">
        <Switch
          checked={c.is_active}
          onCheckedChange={(checked) => onToggleActive(c, checked)}
          disabled={savingSlug === c.slug}
        />
      </TableCell>
      <TableCell className="text-right w-28">
        <Button
          size="sm"
          variant={emojiDirty ? "default" : "ghost"}
          onClick={() => onSaveEmoji(c)}
          disabled={!emojiDirty || savingSlug === c.slug}
        >
          {savingSlug === c.slug ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Guardar"
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
};

const CategoriesTable = () => {
  const qc = useQueryClient();
  const { data: categories = [], isLoading, refetch, isFetching, error } =
    useCategories({ includeInactive: true });
  const [emojiDrafts, setEmojiDrafts] = useState<Record<string, string>>({});
  const [orderedSlugs, setOrderedSlugs] = useState<string[]>([]);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [applyingSuggestions, setApplyingSuggestions] = useState(false);

  // Sync ordered list when categories change
  useEffect(() => {
    setOrderedSlugs(categories.map((c) => c.slug));
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const orderedCategories = orderedSlugs
    .map((s) => categories.find((c) => c.slug === s))
    .filter((c): c is Category => !!c);

  const upsertOverride = async (
    c: Category,
    patch: { emoji?: string | null; sort_order?: number; is_active?: boolean },
  ) => {
    const payload = {
      slug: c.slug,
      emoji: patch.emoji !== undefined ? patch.emoji : c.emoji,
      sort_order: patch.sort_order !== undefined ? patch.sort_order : c.sort_order,
      is_active: patch.is_active !== undefined ? patch.is_active : c.is_active,
    };
    const { error: upErr } = await supabase
      .from("category_overrides")
      .upsert(payload, { onConflict: "slug" });
    if (upErr) throw upErr;
  };

  const handleSaveEmoji = async (c: Category) => {
    const draft = emojiDrafts[c.slug] ?? "";
    setSavingSlug(c.slug);
    try {
      await upsertOverride(c, { emoji: draft.trim() || null });
      toast.success("Guardado");
      setEmojiDrafts((prev) => {
        const next = { ...prev };
        delete next[c.slug];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      toast.error(msg);
    } finally {
      setSavingSlug(null);
    }
  };

  const handleToggleActive = async (c: Category, isActive: boolean) => {
    setSavingSlug(c.slug);
    try {
      await upsertOverride(c, { is_active: isActive });
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      toast.error(msg);
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
        const c = categories.find((x) => x.slug === slug)!;
        return {
          slug,
          emoji: c.emoji,
          sort_order: idx,
          is_active: c.is_active,
        };
      });
      const { error: upErr } = await supabase
        .from("category_overrides")
        .upsert(rows, { onConflict: "slug" });
      if (upErr) throw upErr;
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al reordenar";
      toast.error(msg);
      // Revert
      setOrderedSlugs(categories.map((c) => c.slug));
    } finally {
      setSavingOrder(false);
    }
  };

  const handleApplySuggestion = async (c: Category) => {
    const sug = SUGGESTED_EMOJIS[c.slug];
    if (!sug) return;
    setEmojiDrafts((prev) => ({ ...prev, [c.slug]: sug }));
    setSavingSlug(c.slug);
    try {
      await upsertOverride(c, { emoji: sug });
      setEmojiDrafts((prev) => {
        const next = { ...prev };
        delete next[c.slug];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      toast.error(msg);
    } finally {
      setSavingSlug(null);
    }
  };

  const handleApplyAllSuggestions = async () => {
    const pending = categories.filter(
      (c) => !c.emoji && SUGGESTED_EMOJIS[c.slug],
    );
    if (pending.length === 0) {
      toast.info("Todas las categorías ya tienen emoji");
      return;
    }
    setApplyingSuggestions(true);
    try {
      const rows = pending.map((c) => ({
        slug: c.slug,
        emoji: SUGGESTED_EMOJIS[c.slug],
        sort_order: c.sort_order,
        is_active: c.is_active,
      }));
      const { error: upErr } = await supabase
        .from("category_overrides")
        .upsert(rows, { onConflict: "slug" });
      if (upErr) throw upErr;
      toast.success(`${pending.length} emojis aplicados`);
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      toast.error(msg);
    } finally {
      setApplyingSuggestions(false);
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
          <h2 className="text-xl font-semibold">Categorías</h2>
          <p className="text-xs text-muted-foreground">
            Nombre y slug se importan desde la base externa. Arrastrá para
            reordenar, editá emoji y visibilidad
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleApplyAllSuggestions}
            size="sm"
            variant="outline"
            disabled={applyingSuggestions}
          >
            {applyingSuggestions ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            Aplicar emojis sugeridos
          </Button>
          <Button
            onClick={() => refetch()}
            size="sm"
            variant="outline"
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${isFetching ? "animate-spin" : ""}`}
            />
            Sincronizar
          </Button>
        </div>
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
              <TableHead className="w-24">Emoji</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-20">Activa</TableHead>
              <TableHead className="text-right w-28">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No se encontraron categorías en la base externa
                </TableCell>
              </TableRow>
            ) : (
              <SortableContext
                items={orderedSlugs}
                strategy={verticalListSortingStrategy}
              >
                {orderedCategories.map((c) => {
                  const draftEmoji = emojiDrafts[c.slug] ?? (c.emoji ?? "");
                  const emojiDirty = draftEmoji !== (c.emoji ?? "");
                  return (
                    <SortableRow
                      key={c.slug}
                      category={c}
                      draftEmoji={draftEmoji}
                      onEmojiChange={(slug, value) =>
                        setEmojiDrafts((prev) => ({ ...prev, [slug]: value }))
                      }
                      onSaveEmoji={handleSaveEmoji}
                      onToggleActive={handleToggleActive}
                      onApplySuggestion={handleApplySuggestion}
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

export default CategoriesTable;