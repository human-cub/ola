import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";

interface Order {
  id: string;
  product_name: string;
  customer_name: string;
  phone: string;
  comment: string | null;
  status: "new" | "processing" | "completed";
  admin_comment: string | null;
  created_at: string;
}

const statusColors = {
  new: "bg-blue-100 dark:bg-blue-900",
  processing: "bg-yellow-100 dark:bg-yellow-900",
  completed: "bg-green-100 dark:bg-green-900",
};

const statusLabels = {
  new: "Nuevo",
  processing: "En Proceso",
  completed: "Completado",
};

const OrdersTable = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string>("");

  const fetchOrders = async () => {
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all" && (filterStatus === "new" || filterStatus === "processing" || filterStatus === "completed")) {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Error al cargar órdenes");
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterStatus]);

  const handleStatusChange = async (id: string, newStatus: "new" | "processing" | "completed") => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast.error("Error al actualizar estado");
      return;
    }

    toast.success("Estado actualizado");
    fetchOrders();
  };

  const handleSaveComment = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ admin_comment: editingComment })
      .eq("id", id);

    if (error) {
      toast.error("Error al guardar comentario");
      return;
    }

    toast.success("Comentario guardado");
    setEditingId(null);
    fetchOrders();
  };

  const startEditingComment = (order: Order) => {
    setEditingId(order.id);
    setEditingComment(order.admin_comment || "");
  };

  if (loading) {
    return <p>Cargando órdenes...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Gestión de Órdenes</CardTitle>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new">Nuevos</SelectItem>
              <SelectItem value="processing">En Proceso</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Comentario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Nota Admin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className={statusColors[order.status]}>
                  <TableCell className="text-sm">
                    {new Date(order.created_at).toLocaleDateString("es-AR")}
                  </TableCell>
                  <TableCell className="font-medium">{order.product_name}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.phone}</TableCell>
                  <TableCell className="max-w-xs truncate">{order.comment}</TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value: "new" | "processing" | "completed") => handleStatusChange(order.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">{statusLabels.new}</SelectItem>
                        <SelectItem value="processing">{statusLabels.processing}</SelectItem>
                        <SelectItem value="completed">{statusLabels.completed}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {editingId === order.id ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={editingComment}
                          onChange={(e) => setEditingComment(e.target.value)}
                          placeholder="Nota admin"
                          className="w-40"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveComment(order.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <span className="text-sm">{order.admin_comment || "-"}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingComment(order)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
