import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VirtualOrdersPopoverProps {
  productId: string;
  productName: string;
  currentVirtualCount: number;
  currentBaseProbability: number | null;
  isManual: boolean | null;
  onUpdate: () => void;
}

type VirtualMode = "active_always" | "active_24h" | "inactive";

const speedMarks = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const VirtualOrdersPopover = ({
  productId,
  productName,
  currentVirtualCount,
  currentBaseProbability,
  isManual,
  onUpdate,
}: VirtualOrdersPopoverProps) => {
  const [open, setOpen] = useState(false);
  const [virtualCount, setVirtualCount] = useState(currentVirtualCount);
  const [speed, setSpeed] = useState(currentBaseProbability ? currentBaseProbability / 0.005 : 1.0);
  const [saving, setSaving] = useState(false);

  // Determine current mode based on is_manual field
  const getCurrentMode = (): VirtualMode => {
    if (isManual === true) return "inactive";
    // For now, we don't have a separate 24h tracking, so default to active_always
    return "active_always";
  };

  const [mode, setMode] = useState<VirtualMode>(getCurrentMode());

  const handleApplyVirtualCount = async () => {
    const { error } = await supabase
      .from("products")
      .update({ virtual_orders_count: virtualCount })
      .eq("id", productId);

    if (error) {
      toast.error("Error al actualizar órdenes virtuales");
      return;
    }

    toast.success("Órdenes virtuales actualizadas");
    onUpdate();
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);

    // Calculate base_probability from speed multiplier
    const baseProbability = 0.005 * speed;
    
    // Determine is_manual based on mode
    const isManualValue = mode === "inactive";

    const updateData: {
      base_probability: number;
      is_manual: boolean;
      week_start_date?: string;
    } = {
      base_probability: baseProbability,
      is_manual: isManualValue,
    };

    // If switching to 24h mode, reset the week_start_date to now
    if (mode === "active_24h") {
      updateData.week_start_date = new Date().toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId);

    setSaving(false);

    if (error) {
      toast.error("Error al guardar configuración");
      return;
    }

    toast.success("Configuración guardada");
    setOpen(false);
    onUpdate();
  };

  const getSpeedIndex = (value: number): number => {
    const closest = speedMarks.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    return speedMarks.indexOf(closest);
  };

  const handleSliderChange = (values: number[]) => {
    const index = values[0];
    setSpeed(speedMarks[index]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-white p-4 shadow-lg" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-gray-900 truncate" title={productName}>
            {productName}
          </h4>

          {/* Mode Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">Modo:</Label>
            <Select value={mode} onValueChange={(value: VirtualMode) => setMode(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active_always">Activa Siempre</SelectItem>
                <SelectItem value="active_24h" className="text-[#00AEEF]">
                  Activa 24h
                </SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Speed Slider */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-700">Velocidad:</Label>
            <div className="px-1">
              <Slider
                value={[getSpeedIndex(speed)]}
                onValueChange={handleSliderChange}
                min={0}
                max={speedMarks.length - 1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-1">
                {speedMarks.map((mark, index) => (
                  <span
                    key={mark}
                    className={`text-[10px] ${
                      speedMarks[getSpeedIndex(speed)] === mark
                        ? "text-[#00AEEF] font-medium"
                        : "text-gray-400"
                    }`}
                  >
                    {mark}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Manual Virtual Orders Input */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">Ajustar Órdenes Virtuales:</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={virtualCount}
                onChange={(e) => setVirtualCount(parseInt(e.target.value) || 0)}
                className="flex-1"
                min={0}
              />
              <Button
                size="sm"
                onClick={handleApplyVirtualCount}
                className="bg-[#00AEEF] hover:bg-[#00AEEF]/90 text-white"
              >
                Aplicar
              </Button>
            </div>
          </div>

          {/* Save Configuration Button */}
          <Button
            className="w-full bg-[#00AEEF] hover:bg-[#00AEEF]/90 text-white"
            onClick={handleSaveConfiguration}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VirtualOrdersPopover;
