import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { BarChart3, Copy, Download, Loader2 } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Report = Record<string, any>;

const PRESETS = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
];

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n ?? 0);

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 1000) / 10}%` : "—");

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** Informe Markdown para descargar / pegar en Claude. */
function buildMarkdown(r: Report): string {
  const f = r.funnel ?? {};
  const t = r.traffic ?? {};
  const o = r.orders ?? {};
  const c = r.carts ?? {};
  const ref = r.referral ?? {};
  const lines: string[] = [];
  lines.push(`# Informe analítico alaola`);
  lines.push(`Período: ${String(r.period?.from).slice(0, 10)} → ${String(r.period?.to).slice(0, 10)}`);
  lines.push(``);
  lines.push(`## Tráfico`);
  lines.push(`Visitantes: ${t.visitors} (nuevos: ${t.new_visitors}) · Sesiones: ${t.sessions} · Page views: ${t.page_views} · PV/sesión: ${t.avg_pageviews_per_session} · Sesiones/visitante: ${t.sessions_per_visitor}`);
  lines.push(``);
  lines.push(`## Embudo`);
  lines.push(`| Paso | Cant. | Conv. del paso anterior |`);
  lines.push(`|---|---|---|`);
  const steps: [string, number][] = [
    ["Visitantes", f.visitors],
    ["Vieron producto", f.product_viewers],
    ["Agregaron (carrito/grupo)", f.cart_adders],
    ["Registros", f.signups],
    ["Checkout", f.checkouts],
    ["Pedidos", f.orders],
  ];
  steps.forEach(([name, v], i) => {
    const prev = i > 0 ? steps[i - 1][1] : 0;
    lines.push(`| ${name} | ${v ?? 0} | ${i > 0 ? pct(v ?? 0, prev) : "—"} |`);
  });
  lines.push(``);
  lines.push(`## Canales`);
  lines.push(`| Canal | Sesiones | Visitantes | Registros | Pedidos | Facturación |`);
  lines.push(`|---|---|---|---|---|---|`);
  (r.channels ?? []).forEach((ch: any) =>
    lines.push(`| ${ch.channel} | ${ch.sessions} | ${ch.visitors} | ${ch.signups} | ${ch.orders} | ${fmtMoney(ch.revenue)} |`));
  if ((r.campaigns ?? []).length) {
    lines.push(``);
    lines.push(`### Campañas (UTM)`);
    (r.campaigns ?? []).forEach((cm: any) =>
      lines.push(`- ${cm.source} / ${cm.medium ?? "—"} / ${cm.campaign ?? "—"}: ${cm.sessions} sesiones`));
  }
  lines.push(``);
  lines.push(`## Pedidos`);
  lines.push(`Cantidad: ${o.count} · Facturación: ${fmtMoney(o.revenue)} · Ticket medio: ${fmtMoney(o.aov)} · Por tipo: ${JSON.stringify(o.by_type ?? {})}`);
  lines.push(``);
  lines.push(`## Carritos`);
  lines.push(`Visitantes que agregaron: ${c.visitors_with_add} · Convirtieron: ${c.visitors_converted} · Abandonaron: ${c.abandoned_visitors} (${pct(c.abandoned_visitors, c.visitors_with_add)})`);
  lines.push(``);
  lines.push(`## Top productos (vistas / agregados)`);
  (r.top_products ?? []).slice(0, 15).forEach((p: any) =>
    lines.push(`- ${p.name}: ${p.views} vistas, ${p.adds} agregados${p.views > 0 ? ` (${pct(p.adds, p.views)})` : ""}`));
  lines.push(``);
  lines.push(`## Búsquedas`);
  (r.searches?.top ?? []).slice(0, 10).forEach((s: any) =>
    lines.push(`- "${s.query}": ${s.count}× (${s.results} resultados)`));
  const zero = r.searches?.zero_results ?? [];
  if (zero.length) {
    lines.push(``);
    lines.push(`### Sin resultados (demanda insatisfecha → candidatos a catálogo)`);
    zero.forEach((s: any) => lines.push(`- "${s.query}": ${s.count}×`));
  }
  lines.push(``);
  lines.push(`## Páginas de salida`);
  (r.exit_pages ?? []).slice(0, 10).forEach((e: any) => lines.push(`- ${e.path}: ${e.exits}`));
  lines.push(``);
  lines.push(`## Compartidos (referidos)`);
  lines.push(`Shares: ${ref.shares} · Clics únicos: ${ref.clicks} · Registros por referido: ${ref.referred_signups}`);
  (r.shares ?? []).forEach((s: any) => lines.push(`- ${s.method} (desde ${s.source}): ${s.count}`));
  const gate = r.contact_gate ?? [];
  if (gate.length) {
    lines.push(``);
    lines.push(`## Cortina de precios (contactos)`);
    gate.forEach((g: any) => lines.push(`- ${g.method}: ${g.count}`));
  }
  return lines.join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const AdminAnalytics = () => {
  const today = new Date();
  const [from, setFrom] = useState(isoDay(new Date(today.getTime() - 30 * 86400000)));
  const [to, setTo] = useState(isoDay(today));
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (days: number) => {
    const now = new Date();
    setFrom(isoDay(new Date(now.getTime() - days * 86400000)));
    setTo(isoDay(now));
  };

  const generate = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_analytics_report" as never, {
      p_from: `${from}T00:00:00Z`,
      p_to: `${to}T23:59:59Z`,
    } as never);
    setLoading(false);
    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }
    setReport(data as Report);
  };

  const stamp = `${from}_${to}`;

  const copyForClaude = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(buildMarkdown(report));
    toast.success("Informe copiado — pegalo en el chat con Claude");
  };

  const f = report?.funnel ?? {};
  const t = report?.traffic ?? {};
  const o = report?.orders ?? {};

  const funnelSteps: [string, number][] = report
    ? [
        ["Visitantes", f.visitors ?? 0],
        ["Vieron producto", f.product_viewers ?? 0],
        ["Agregaron", f.cart_adders ?? 0],
        ["Registros", f.signups ?? 0],
        ["Checkout", f.checkouts ?? 0],
        ["Pedidos", f.orders ?? 0],
      ]
    : [];

  const Cell = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Analítica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          {PRESETS.map((p) => (
            <Button key={p.days} variant="outline" size="sm" onClick={() => applyPreset(p.days)}>
              {p.label}
            </Button>
          ))}
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-border rounded-md px-2 py-1.5 bg-background" />
            <span className="text-muted-foreground">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-border rounded-md px-2 py-1.5 bg-background" />
          </div>
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Generar informe
          </Button>
        </div>

        {report && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyForClaude}>
                <Copy className="w-4 h-4 mr-2" /> Copiar para Claude
              </Button>
              <Button variant="outline" size="sm"
                onClick={() => download(`informe-${stamp}.md`, buildMarkdown(report), "text/markdown")}>
                <Download className="w-4 h-4 mr-2" /> .md
              </Button>
              <Button variant="outline" size="sm"
                onClick={() => download(`informe-${stamp}.json`, JSON.stringify(report, null, 2), "application/json")}>
                <Download className="w-4 h-4 mr-2" /> .json
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Cell label="Visitantes" value={t.visitors ?? 0} />
              <Cell label="Nuevos" value={t.new_visitors ?? 0} />
              <Cell label="Sesiones" value={t.sessions ?? 0} />
              <Cell label="Page views" value={t.page_views ?? 0} />
              <Cell label="Pedidos" value={o.count ?? 0} />
              <Cell label="Facturación" value={fmtMoney(o.revenue ?? 0)} />
            </div>

            <div>
              <h3 className="font-semibold mb-2">Embudo</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paso</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Conversión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funnelSteps.map(([name, v], i) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell className="text-right">{v}</TableCell>
                      <TableCell className="text-right">
                        {i > 0 ? pct(v, funnelSteps[i - 1][1]) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Canales</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead className="text-right">Sesiones</TableHead>
                    <TableHead className="text-right">Visitantes</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                    <TableHead className="text-right">Facturación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(report.channels ?? []).map((ch: any) => (
                    <TableRow key={ch.channel}>
                      <TableCell>{ch.channel}</TableCell>
                      <TableCell className="text-right">{ch.sessions}</TableCell>
                      <TableCell className="text-right">{ch.visitors}</TableCell>
                      <TableCell className="text-right">{ch.signups}</TableCell>
                      <TableCell className="text-right">{ch.orders}</TableCell>
                      <TableCell className="text-right">{fmtMoney(ch.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {(report.searches?.zero_results ?? []).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Búsquedas sin resultados (demanda insatisfecha)</h3>
                <div className="flex flex-wrap gap-2">
                  {(report.searches.zero_results as any[]).map((s) => (
                    <span key={s.query} className="text-sm rounded-full border border-border px-3 py-1">
                      {s.query} · {s.count}×
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!report && !loading && (
          <p className="text-sm text-muted-foreground">
            Elegí el período y generá el informe. Después: «Copiar para Claude» y pegalo en el chat
            para análisis y plan de acción.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAnalytics;
