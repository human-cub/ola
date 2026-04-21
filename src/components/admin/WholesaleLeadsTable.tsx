import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WholesaleLead {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Nueva" },
  { value: "contacted", label: "Contactada" },
  { value: "converted", label: "Convertida" },
  { value: "rejected", label: "Rechazada" },
];

const statusVariant = (s: string): "default" | "secondary" | "outline" | "destructive" => {
  if (s === "new") return "default";
  if (s === "contacted") return "secondary";
  if (s === "converted") return "outline";
  return "destructive";
};

export const WholesaleLeadsTable = () => {
  const [leads, setLeads] = useState<WholesaleLead[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wholesale_leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Error al cargar las solicitudes");
    } else {
      setLeads((data ?? []) as WholesaleLead[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("wholesale_leads")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Error al actualizar");
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    toast.success("Estado actualizado");
  };

  const deleteLead = async (id: string) => {
    if (!confirm("¿Eliminar esta solicitud?")) return;
    const { error } = await supabase.from("wholesale_leads").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Solicitud eliminada");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          Solicitudes mayoristas{" "}
          <span className="text-muted-foreground text-sm font-normal">({leads.length})</span>
        </h3>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Actualizar
        </Button>
      </div>

      {leads.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Todavía no hay solicitudes.
        </p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="font-medium">{lead.full_name}</TableCell>
                  <TableCell>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {lead.phone}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(lead.status)}>
                        {STATUS_OPTIONS.find((s) => s.value === lead.status)?.label ?? lead.status}
                      </Badge>
                      <Select value={lead.status} onValueChange={(v) => void updateStatus(lead.id, v)}>
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void deleteLead(lead.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default WholesaleLeadsTable;