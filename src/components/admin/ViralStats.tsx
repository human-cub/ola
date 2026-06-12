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

interface WeekRow {
  week_start: string;
  clicks: number;
  signups: number;
  orders: number;
  revenue: number;
}

interface ShareRow {
  method: string;
  source: string;
  cnt: number;
}

const ViralStats = () => {
  const [s, setS] = useState<Stats | null>(null);
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [stats, weekly, sb] = await Promise.all([
        supabase.rpc("admin_viral_stats" as any),
        supabase.rpc("admin_referral_weekly" as any, { p_weeks: 8 }),
        supabase.rpc("admin_share_breakdown" as any, { p_days: 30 }),
      ]);
      const row = Array.isArray(stats.data) ? (stats.data as any)[0] : (stats.data as any);
      setS((row as Stats) ?? null);
      setWeeks(((weekly.data as any) ?? []) as WeekRow[]);
      setShares(((sb.data as any) ?? []) as ShareRow[]);
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

        {weeks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Por semana (últimas 8)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="py-1 pr-4 font-normal">Semana</th>
                    <th className="py-1 pr-4 font-normal text-right">Clics</th>
                    <th className="py-1 pr-4 font-normal text-right">Registros</th>
                    <th className="py-1 pr-4 font-normal text-right">Pedidos ref.</th>
                    <th className="py-1 font-normal text-right">Facturación ref.</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((w) => (
                    <tr key={w.week_start} className="border-t border-border">
                      <td className="py-1 pr-4">{new Date(w.week_start).toLocaleDateString("es-AR")}</td>
                      <td className="py-1 pr-4 text-right">{w.clicks}</td>
                      <td className="py-1 pr-4 text-right">{w.signups}</td>
                      <td className="py-1 pr-4 text-right">{w.orders}</td>
                      <td className="py-1 text-right">
                        {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(Number(w.revenue || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {shares.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Cómo comparten (30 días)</h4>
            <div className="flex flex-wrap gap-2">
              {shares.map((sh) => (
                <span key={`${sh.method}-${sh.source}`} className="text-xs rounded-full border border-border px-3 py-1">
                  {sh.method} · {sh.source} · <strong>{sh.cnt}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ViralStats;
