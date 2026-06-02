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
  const [forcingPrices, setForcingPrices] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", MAYORISTA_MIN_KEY)
        .maybeSingle();
      const val = (data as any)?.value;
      setMinOrder(val !== undefined && val !== null ? String(val) : "200000");
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

  const handleForceUpdatePrices = async () => {
    if (!confirm("¿Forzar actualización de precios de esta semana a los actuales? Esto afecta a todos los clientes inmediatamente.")) {
      return;
    }
    setForcingPrices(true);
    try {
      const { error: syncErr } = await supabase.functions.invoke("sync-sku-prices");
      if (syncErr) throw syncErr;
      const { error: freezeErr } = await supabase.functions.invoke("freeze-weekly-prices");
      if (freezeErr) throw freezeErr;
      toast.success("Precios de la semana actualizados");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar precios");
    } finally {
      setForcingPrices(false);
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
          <CardTitle>Precios de la semana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-w-md">
          <p className="text-sm text-muted-foreground">
            Normalmente los precios de la semana actual se congelan el domingo a las 23:59 (ART) y no se actualizan hasta el próximo ciclo. Usá este botón para forzar la actualización a los precios actuales del distribuidor ahora mismo.
          </p>
          <Button onClick={handleForceUpdatePrices} disabled={forcingPrices} variant="destructive">
            {forcingPrices ? "Actualizando..." : "Forzar actualización de precios"}
          </Button>
        </CardContent>
      </Card>

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