import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface PromoCode {
  id: string;
  code: string;
  tier_bonus: number;
  is_active: boolean;
  created_at: string;
}

const PromoCodesTable = () => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formTierBonus, setFormTierBonus] = useState("1");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCodes = async () => {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar los códigos");
      return;
    }
    setCodes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormCode("");
    setFormTierBonus("1");
    setFormActive(true);
    setDialogOpen(true);
  };

  const openEdit = (code: PromoCode) => {
    setEditing(code);
    setFormCode(code.code);
    setFormTierBonus(String(code.tier_bonus));
    setFormActive(code.is_active);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmedCode = formCode.trim().toUpperCase();
    if (!trimmedCode) {
      toast.error("El código es requerido");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("promo_codes")
          .update({
            code: trimmedCode,
            tier_bonus: parseInt(formTierBonus),
            is_active: formActive,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Código actualizado");
      } else {
        const { error } = await supabase
          .from("promo_codes")
          .insert({
            code: trimmedCode,
            tier_bonus: parseInt(formTierBonus),
            is_active: formActive,
          });
        if (error) {
          if (error.code === "23505") {
            toast.error("Ya existe un código con ese nombre");
            return;
          }
          throw error;
        }
        toast.success("Código creado");
      }
      setDialogOpen(false);
      fetchCodes();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Código eliminado");
    fetchCodes();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("promo_codes")
      .update({ is_active: isActive })
      .eq("id", id);
    if (error) {
      toast.error("Error al actualizar");
      return;
    }
    setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c));
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Códigos Promocionales</h2>
        <Button onClick={openAdd} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Bonus</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No hay códigos promocionales
              </TableCell>
            </TableRow>
          ) : (
            codes.map((code) => (
              <TableRow key={code.id}>
                <TableCell className="font-mono font-bold">{code.code}</TableCell>
                <TableCell>+{code.tier_bonus} tier{code.tier_bonus > 1 ? "s" : ""}</TableCell>
                <TableCell>
                  <Switch
                    checked={code.is_active}
                    onCheckedChange={(checked) => handleToggle(code.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(code)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(code.id)}>
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
            <DialogTitle>{editing ? "Editar Código" : "Nuevo Código"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Código</Label>
              <Input
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="SUMMER2026"
                className="font-mono"
              />
            </div>
            <div>
              <Label>Bonus de tiers</Label>
              <Select value={formTierBonus} onValueChange={setFormTierBonus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">+1 tier</SelectItem>
                  <SelectItem value="2">+2 tiers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>{formActive ? "Activo" : "Inactivo"}</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editing ? "Guardar cambios" : "Crear código"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodesTable;
