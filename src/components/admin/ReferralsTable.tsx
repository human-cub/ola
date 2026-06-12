import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";

interface Row {
  referrer_id: string;
  referrer_name: string | null;
  referrer_email: string | null;
  referrals: number;
  registered: number;
  purchasers: number;
  clicks: number;
  rewarded: number;
  referred_revenue: number;
  last_activity: string | null;
}

const ReferralsTable = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("admin_referral_overview" as any);
      setRows(((data as any) ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const totalReferrals = rows.reduce((s, r) => s + (r.referrals || 0), 0);
  const totalRegistered = rows.reduce((s, r) => s + (r.registered || 0), 0);
  const totalPurchasers = rows.reduce((s, r) => s + (r.purchasers || 0), 0);
  const totalClicks = rows.reduce((s, r) => s + (r.clicks || 0), 0);
  const totalRewarded = rows.reduce((s, r) => s + (r.rewarded || 0), 0);
  const totalRevenue = rows.reduce((s, r) => s + Number(r.referred_revenue || 0), 0);
  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
  const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("es-AR") : "—");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" /> Referidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Todavía no hay referidos.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-6 text-sm">
              <span><strong>{rows.length}</strong> referidores</span>
              <span><strong>{totalReferrals}</strong> invitados</span>
              <span><strong>{totalRegistered}</strong> registrados</span>
              <span><strong>{totalClicks}</strong> clics</span>
              <span><strong>{totalPurchasers}</strong> compraron</span>
              <span><strong>{totalRewarded}</strong> premios</span>
              <span><strong>{fmtMoney(totalRevenue)}</strong> facturación referida</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referidor</TableHead>
                  <TableHead className="text-right">Invitados</TableHead>
                  <TableHead className="text-right">Registrados</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                  <TableHead className="text-right">Compraron</TableHead>
                  <TableHead className="text-right">Premios</TableHead>
                  <TableHead className="text-right">Facturación</TableHead>
                  <TableHead className="text-right">Últ. actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.referrer_id}>
                    <TableCell>
                      <div className="font-medium">{r.referrer_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.referrer_email}</div>
                    </TableCell>
                    <TableCell className="text-right">{r.referrals}</TableCell>
                    <TableCell className="text-right">{r.registered}</TableCell>
                    <TableCell className="text-right">{r.clicks}</TableCell>
                    <TableCell className="text-right">{r.purchasers}</TableCell>
                    <TableCell className="text-right font-medium">{r.rewarded}</TableCell>
                    <TableCell className="text-right font-medium">{fmtMoney(Number(r.referred_revenue || 0))}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtDate(r.last_activity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralsTable;
