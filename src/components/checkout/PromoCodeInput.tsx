import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Gift } from "lucide-react";

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
      const { data: rows, error: fetchError } = await supabase
        .rpc("validate_promo_code", { _code: trimmed });

      const data = Array.isArray(rows) ? rows[0] : rows;

      if (fetchError || !data) {
        setError("Código inválido o inactivo");
        return;
      }

      // Enforce one-time use per user
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: existing } = await supabase
          .from("user_orders")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("promo_code", data.code)
          .neq("status", "cancelled")
          .limit(1)
          .maybeSingle();
        if (existing) {
          setError("Ya usaste este código en otro pedido");
          return;
        }
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
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            backgroundColor: "hsl(var(--group-buy-accent) / 0.1)",
            border: "1px solid hsl(var(--group-buy-accent) / 0.4)",
          }}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "hsl(var(--group-buy-accent) / 0.18)" }}
          >
            <Gift className="w-4 h-4" style={{ color: "hsl(var(--group-buy-accent))" }} />
          </span>
          <div className="flex-1 leading-tight">
            <p
              className="text-sm font-semibold"
              style={{ color: "hsl(var(--group-buy-accent-foreground))" }}
            >
              ¡{appliedPromo.code} aplicado!
            </p>
            <p
              className="text-xs"
              style={{ color: "hsl(var(--group-buy-accent-foreground))", opacity: 0.85 }}
            >
              +{appliedPromo.tier_bonus} nivel{appliedPromo.tier_bonus > 1 ? "es" : ""} de descuento
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onRemove}
            aria-label="Quitar promoción"
          >
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
          placeholder=""
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
