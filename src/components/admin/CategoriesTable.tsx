import { useState } from "react";
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
import { Loader2, RefreshCw } from "lucide-react";
import { useCategories, type Category } from "@/hooks/useCategories";
import { useQueryClient } from "@tanstack/react-query";

const CategoriesTable = () => {
  const qc = useQueryClient();
  const { data: categories = [], isLoading, refetch, isFetching, error } =
    useCategories({ includeInactive: true });
  const [drafts, setDrafts] = useState<
    Record<string, { emoji: string; sort_order: string }>
  >({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const getDraft = (c: Category) =>
    drafts[c.slug] ?? {
      emoji: c.emoji ?? "",
      sort_order: String(c.sort_order ?? 0),
    };

  const setDraft = (slug: string, patch: Partial<{ emoji: string; sort_order: string }>) => {
    setDrafts((prev) => ({
      ...prev,
      [slug]: { ...(prev[slug] ?? { emoji: "", sort_order: "0" }), ...patch },
    }));
  };

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

  const handleSaveRow = async (c: Category) => {
    const d = getDraft(c);
    setSavingSlug(c.slug);
    try {
      await upsertOverride(c, {
        emoji: d.emoji.trim() || null,
        sort_order: parseInt(d.sort_order) || 0,
      });
      toast.success("Guardado");
      setDrafts((prev) => {
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
            Nombre y slug se importan desde la base externa. Acá editás emoji,
            orden y visibilidad
          </p>
        </div>
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

      {error ? (
        <div className="text-sm text-destructive border border-destructive/30 rounded p-3">
          {(error as Error).message}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Orden</TableHead>
            <TableHead className="w-20">Emoji</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="w-20">Activa</TableHead>
            <TableHead className="text-right w-28">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No se encontraron categorías en la base externa
              </TableCell>
            </TableRow>
          ) : (
            categories.map((c) => {
              const d = getDraft(c);
              const dirty =
                d.emoji !== (c.emoji ?? "") ||
                d.sort_order !== String(c.sort_order ?? 0);
              return (
                <TableRow key={c.slug}>
                  <TableCell>
                    <Input
                      type="number"
                      value={d.sort_order}
                      onChange={(e) => setDraft(c.slug, { sort_order: e.target.value })}
                      className="w-16 h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={d.emoji}
                      onChange={(e) => setDraft(c.slug, { emoji: e.target.value })}
                      placeholder="💪"
                      className="w-16 h-8 text-center"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs">{c.slug}</TableCell>
                  <TableCell>
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={(checked) => handleToggleActive(c, checked)}
                      disabled={savingSlug === c.slug}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => handleSaveRow(c)}
                      disabled={!dirty || savingSlug === c.slug}
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
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CategoriesTable;