import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Tag } from "lucide-react";

interface AppliedPromo {
  code: string;
  tier_bonus: number;
}

interface PromoCodeInputProps {
  appliedPromo: AppliedPromo | null;
  onApply: (promo: AppliedPromo) => void;
  onRemove: () => void;
}

export const PromoCodeInput = ({ appliedPromo, onApply, onRemove }: PromoCodeInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("promo_codes")
        .select("code, tier_bonus, is_active")
        .eq("code", trimmed)
        .eq("is_active", true)
        .single();

      if (fetchError || !data) {
        setError("Código inválido o inactivo");
        return;
      }

      onApply({ code: data.code, tier_bonus: data.tier_bonus });
      setCode("");
      setError("");
    } catch {
      setError("Error al verificar el código");
    } finally {
      setLoading(false);
    }
  };

  if (appliedPromo) {
    return (
      <div className="mb-6">
      <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
          <Tag className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground flex-1">
            Promoción aplicada: <strong>{appliedPromo.code}</strong> — +{appliedPromo.tier_bonus} nivel{appliedPromo.tier_bonus > 1 ? "es" : ""} de precio
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="text-sm font-medium mb-2 block">Código promocional</label>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          placeholder="Código promocional"
          className="font-mono flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aplicar"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
};
