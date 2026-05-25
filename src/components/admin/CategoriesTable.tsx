import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  sort_order: number;
  is_active: boolean;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const CategoriesTable = () => {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formEmoji, setFormEmoji] = useState("");
  const [formOrder, setFormOrder] = useState("0");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRows = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      toast.error("Error al cargar las categorías");
      return;
    }
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormSlug("");
    setFormEmoji("");
    setFormOrder(String((rows[rows.length - 1]?.sort_order ?? 0) + 10));
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEdit = (row: Category) => {
    setEditing(row);
    setFormName(row.name);
    setFormSlug(row.slug);
    setFormEmoji(row.emoji || "");
    setFormOrder(String(row.sort_order));
    setFormActive(row.is_active);
    setDialogOpen(true);
  };

  const handleNameChange = (v: string) => {
    setFormName(v);
    if (!editing) setFormSlug(slugify(v));
  };

  const handleSave = async () => {
    const name = formName.trim();
    const slug = slugify(formSlug.trim());
    if (!name || !slug) {
      toast.error("Nombre y slug son requeridos");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast.error("Slug solo puede contener letras, números y guiones");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        emoji: formEmoji.trim() || null,
        sort_order: parseInt(formOrder) || 0,
        is_active: formActive,
      };
      if (editing) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Categoría actualizada");
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) {
          if (error.code === "23505") {
            toast.error("Ya existe una categoría con ese slug");
            return;
          }
          throw error;
        }
        toast.success("Categoría creada");
      }
      setDialogOpen(false);
      fetchRows();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los productos quedarán sin categoría")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Categoría eliminada");
    fetchRows();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("categories").update({ is_active: isActive }).eq("id", id);
    if (error) {
      toast.error("Error al actualizar");
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r)));
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Categorías</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Emoji</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No hay categorías
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.sort_order}</TableCell>
                <TableCell className="text-xl">{row.emoji || "—"}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                <TableCell>
                  <Switch
                    checked={row.is_active}
                    onCheckedChange={(checked) => handleToggle(row.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input value={formName} onChange={(e) => handleNameChange(e.target.value)} placeholder="Proteínas" />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="proteinas"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">URL: /categoria/{formSlug || "..."}</p>
            </div>
            <div>
              <Label>Emoji</Label>
              <Input value={formEmoji} onChange={(e) => setFormEmoji(e.target.value)} placeholder="💪" />
            </div>
            <div>
              <Label>Orden</Label>
              <Input type="number" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Menor número = más arriba en el menú</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>{formActive ? "Activa" : "Inactiva"}</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editing ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesTable;