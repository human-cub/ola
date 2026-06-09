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
  purchasers: number;
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
  const totalPurchasers = rows.reduce((s, r) => s + (r.purchasers || 0), 0);

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
              <span><strong>{totalReferrals}</strong> registros</span>
              <span><strong>{totalPurchasers}</strong> compraron</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referidor</TableHead>
                  <TableHead className="text-right">Invitados</TableHead>
                  <TableHead className="text-right">Compraron</TableHead>
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
                    <TableCell className="text-right">{r.purchasers}</TableCell>
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
