import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
const DEFAULT_SPEED = 1.0;
const DEFAULT_BASE_PROBABILITY = 0.005; // speed 1.0 = 0.005

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
  const [saving, setSaving] = useState(false);

  // Calculate speed from base_probability
  const getSpeedFromProbability = (prob: number | null): number => {
    // If probability is null or in the "reset" range (0.12-0.25), return default
    if (prob === null || prob >= 0.1) return DEFAULT_SPEED;
    
    // Calculate speed: prob = 0.005 * speed, so speed = prob / 0.005
    const calculated = prob / DEFAULT_BASE_PROBABILITY;
    
    // Find closest speed mark
    const closest = speedMarks.reduce((prev, curr) =>
      Math.abs(curr - calculated) < Math.abs(prev - calculated) ? curr : prev
    );
    return closest;
  };

  const [speed, setSpeed] = useState(() => getSpeedFromProbability(currentBaseProbability));

  // Determine current mode - default is active (is_manual = false or null)
  const getCurrentMode = (): VirtualMode => {
    // Default: active_always (is_manual = null or false)
    if (isManual === true) return "inactive";
    return "active_always";
  };

  const [mode, setMode] = useState<VirtualMode>(() => getCurrentMode());

  // Update local state when props change (e.g., after weekly reset)
  useEffect(() => {
    setVirtualCount(currentVirtualCount);
    setSpeed(getSpeedFromProbability(currentBaseProbability));
    setMode(getCurrentMode());
  }, [currentVirtualCount, currentBaseProbability, isManual]);

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
    const baseProbability = DEFAULT_BASE_PROBABILITY * speed;
    
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

  // Get slider position (0-100) from speed
  const getSliderPosition = (spd: number): number => {
    const index = speedMarks.indexOf(spd);
    if (index === -1) {
      // Find closest
      const closest = speedMarks.reduce((prev, curr) =>
        Math.abs(curr - spd) < Math.abs(prev - spd) ? curr : prev
      );
      return (speedMarks.indexOf(closest) / (speedMarks.length - 1)) * 100;
    }
    return (index / (speedMarks.length - 1)) * 100;
  };

  // Get speed from slider position
  const getSpeedFromPosition = (position: number): number => {
    const index = Math.round((position / 100) * (speedMarks.length - 1));
    return speedMarks[Math.max(0, Math.min(index, speedMarks.length - 1))];
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const position = parseFloat(e.target.value);
    setSpeed(getSpeedFromPosition(position));
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
        className="w-80 bg-white p-4 shadow-lg z-50" 
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
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="active_always">Activa Siempre</SelectItem>
                <SelectItem value="active_24h" className="text-[#00AEEF]">
                  Activa 24h
                </SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Speed Slider with tick marks */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-700">Velocidad:</Label>
            <div className="pt-2 pb-6 relative">
              {/* Custom range slider */}
              <input
                type="range"
                min="0"
                max="100"
                step={100 / (speedMarks.length - 1)}
                value={getSliderPosition(speed)}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #00AEEF 0%, #00AEEF ${getSliderPosition(speed)}%, #e5e7eb ${getSliderPosition(speed)}%, #e5e7eb 100%)`
                }}
              />
              
              {/* Tick marks */}
              <div className="absolute top-0 left-0 right-0 flex justify-between pointer-events-none" style={{ paddingTop: '2px' }}>
                {speedMarks.map((_, index) => (
                  <div 
                    key={index} 
                    className="w-0.5 h-2 bg-gray-400"
                  />
                ))}
              </div>
              
              {/* Labels */}
              <div className="absolute top-6 left-0 right-0 flex justify-between">
                {speedMarks.map((mark, index) => (
                  <span
                    key={mark}
                    className={`text-[10px] ${
                      speed === mark ? "text-[#00AEEF] font-semibold" : "text-gray-400"
                    }`}
                    style={{
                      width: index === 0 || index === speedMarks.length - 1 ? 'auto' : '0',
                      textAlign: index === 0 ? 'left' : index === speedMarks.length - 1 ? 'right' : 'center',
                      transform: index === 0 || index === speedMarks.length - 1 ? 'none' : 'translateX(-50%)',
                    }}
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
