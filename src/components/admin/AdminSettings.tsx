import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import WholesaleLeadsTable from "@/components/admin/WholesaleLeadsTable";

const MAYORISTA_MIN_KEY = "mayorista_min_order";

export const AdminSettings = () => {
  const [minOrder, setMinOrder] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [curtain, setCurtain] = useState(false);
  const [curtainSaving, setCurtainSaving] = useState(false);

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

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", "price_curtain_enabled")
        .maybeSingle();
      setCurtain((data as any)?.value === true);
    })();
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

  const toggleCurtain = async (next: boolean) => {
    setCurtain(next);
    setCurtainSaving(true);
    const { error } = await supabase
      .from("app_settings" as any)
      .upsert({ key: "price_curtain_enabled", value: next as any }, { onConflict: "key" });
    if (error) {
      toast.error("Error al guardar");
      setCurtain(!next);
    } else {
      toast.success(next ? "Cortina activada" : "Cortina desactivada");
    }
    setCurtainSaving(false);
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
          <CardTitle>Cortina de precios de grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="curtain-toggle">Ocultar precios de grupo a visitantes</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Con la cortina activada, quien no inició sesión ve solo «Comprar ahora». El Precio
                Garantizado y el Súper-Precio quedan ocultos; al intentar sumarse al grupo se le
                muestra cómo pedir acceso (WhatsApp / Instagram o link de un miembro).
              </p>
            </div>
            <Switch
              id="curtain-toggle"
              checked={curtain}
              disabled={curtainSaving}
              onCheckedChange={toggleCurtain}
            />
          </div>
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