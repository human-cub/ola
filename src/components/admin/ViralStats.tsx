import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";

interface Stats {
  total_users: number;
  referrers: number;
  referred_signups: number;
  unique_clicks: number;
  purchasers: number;
  rewarded: number;
  k_factor: number | string;
}

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 1000) / 10}%` : "—");

const ViralStats = () => {
  const [s, setS] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("admin_viral_stats" as any);
      const row = Array.isArray(data) ? (data as any)[0] : (data as any);
      setS((row as Stats) ?? null);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }
  if (!s) return null;

  const k = Number(s.k_factor ?? 0);
  const invitesPerUser = s.total_users > 0 ? s.unique_clicks / s.total_users : 0;

  const Cell = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground/80 mt-0.5">{sub}</div>}
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Analítica viral (K-factor)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span
            className="text-4xl font-bold"
            style={{ color: k >= 1 ? "hsl(var(--group-buy-accent))" : undefined }}
          >
            {k.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">
            K-factor · usuarios nuevos traídos por usuario (vía referido). Mayor a 1 = crecimiento viral.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Cell label="Usuarios totales" value={s.total_users} />
          <Cell label="Clics únicos (IP)" value={s.unique_clicks} sub={`${invitesPerUser.toFixed(2)} por usuario`} />
          <Cell label="Registros por referido" value={s.referred_signups} sub={`${s.referrers} referidores`} />
          <Cell label="Compraron" value={s.purchasers} />
          <Cell label="Premios otorgados" value={s.rewarded} />
        </div>

        <div className="text-sm text-muted-foreground">
          Embudo: <strong>{s.unique_clicks}</strong> clics →{" "}
          <strong>{s.referred_signups}</strong> registros ({pct(s.referred_signups, s.unique_clicks)}) →{" "}
          <strong>{s.purchasers}</strong> compraron ({pct(s.purchasers, s.referred_signups)}) ·{" "}
          <strong>{s.rewarded}</strong> premios otorgados.
        </div>
      </CardContent>
    </Card>
  );
};

export default ViralStats;
