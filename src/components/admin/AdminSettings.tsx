import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import WholesaleLeadsTable from "@/components/admin/WholesaleLeadsTable";

const MAYORISTA_MIN_KEY = "mayorista_min_order";

export const AdminSettings = () => {
  const [minOrder, setMinOrder] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", MAYORISTA_MIN_KEY)
        .maybeSingle();
      const val = (data as any)?.value;
      setMinOrder(val !== undefined && val !== null ? String(val) : "300000");
      setLoading(false);
    };
    void load();
  }, []);

  const handleSave = async () => {
    const parsed = Number(minOrder);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Ingresá un número válido");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("app_settings" as any)
        .upsert({ key: MAYORISTA_MIN_KEY, value: parsed as any }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Configuración guardada");
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración Mayorista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="min-order">Monto mínimo de pedido mayorista (ARS)</Label>
            <Input
              id="min-order"
              type="number"
              min={0}
              step={1000}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Los usuarios con rol Mayorista necesitan alcanzar este monto para poder finalizar el pedido.
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Catálogo</CardTitle>
        </CardHeader>
        <CardContent>
          <WholesaleLeadsTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;