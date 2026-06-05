import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Forzar la actualización de los precios "congelados" de la semana:
 * sync-sku-prices (trae los precios actuales del distribuidor) y luego
 * freeze-weekly-prices (regenera el snapshot semanal que usa la vidriera).
 */
export const WeeklyPricesCard = () => {
  const [forcingPrices, setForcingPrices] = useState(false);

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

  return (
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
  );
};

export default WeeklyPricesCard;
