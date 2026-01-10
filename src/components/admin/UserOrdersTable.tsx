import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, Save, Trash2, Eye, Package, ShoppingCart, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
type OrderType = "immediate" | "collective";

interface OrderItem {
  product_id: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  price_per_unit: number;
  product_image: string | null;
}

interface DeliveryAddress {
  street: string;
  number: string;
  floor: string | null;
  postalCode: string;
  city: string;
  province: string;
  references: string | null;
}

interface UserOrder {
  id: string;
  order_number: string;
  user_id: string;
  order_type: OrderType;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  discount_percentage: number | null;
  participants_count: number | null;
  total_amount: number;
  delivery_cost: number;
  delivery_address: DeliveryAddress | null;
  payment_method: string | null;
  status: OrderStatus;
  notes: string | null;
  admin_notes: string | null;
  collective_close_date: string | null;
  created_at: string;
  updated_at: string;
  // Profile data
  profiles?: {
    email: string | null;
    phone: string | null;
    first_name: string | null;
    last_name: string | null;
  };
}

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const orderTypeLabels: Record<OrderType, string> = {
  immediate: "Inmediato",
  collective: "Colectivo",
};

const UserOrdersTable = () => {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    
    let query = supabase
      .from("user_orders")
      .select(`
        *,
        profiles!user_orders_user_id_fkey (
          email,
          phone,
          first_name,
          last_name
        )
      `)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as OrderStatus);
    }

    if (typeFilter !== "all") {
      query = query.eq("order_type", typeFilter as OrderType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar los pedidos");
    } else {
      // Parse JSON fields properly
      const parsedOrders = (data || []).map((order: any) => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : [],
        delivery_address: order.delivery_address as DeliveryAddress | null,
        profiles: order.profiles,
      })) as UserOrder[];
      
      // Apply search filter
      const filtered = searchQuery
        ? parsedOrders.filter(
            (o) =>
              o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              o.profiles?.phone?.includes(searchQuery)
          )
        : parsedOrders;
      
      setOrders(filtered);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("user-orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, typeFilter, searchQuery]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("user_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Error al actualizar el estado");
    } else {
      toast.success("Estado actualizado");
      fetchOrders();
    }
  };

  const handleSaveNotes = async (orderId: string) => {
    const { error } = await supabase
      .from("user_orders")
      .update({ admin_notes: tempNotes })
      .eq("id", orderId);

    if (error) {
      toast.error("Error al guardar las notas");
    } else {
      toast.success("Notas guardadas");
      setEditingNotes(null);
      fetchOrders();
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("user_orders")
      .delete()
      .eq("id", orderId);

    if (error) {
      toast.error("Error al eliminar el pedido");
    } else {
      toast.success("Pedido eliminado");
      fetchOrders();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString("es-AR")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="immediate">Inmediato</SelectItem>
            <SelectItem value="collective">Colectivo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="processing">Procesando</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Pedidos</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-700">
            {orders.filter((o) => o.status === "pending").length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-700">Inmediatos</p>
          <p className="text-2xl font-bold text-blue-700">
            {orders.filter((o) => o.order_type === "immediate").length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-700">Colectivos</p>
          <p className="text-2xl font-bold text-purple-700">
            {orders.filter((o) => o.order_type === "collective").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay pedidos
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.order_number}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">
                        {order.profiles?.first_name} {order.profiles?.last_name}
                      </p>
                      <p className="text-muted-foreground">{order.profiles?.email}</p>
                      <p className="text-muted-foreground">{order.profiles?.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {order.order_type === "immediate" ? (
                        <ShoppingCart className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {orderTypeLabels[order.order_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="truncate max-w-[200px]">
                          {item.quantity}x {item.product_name}
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-muted-foreground">
                          +{order.items.length - 2} más
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(order.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        handleStatusChange(order.id, value as OrderStatus)
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pedido {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {orderTypeLabels[selectedOrder.order_type]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge className={statusColors[selectedOrder.status]}>
                    {statusLabels[selectedOrder.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <p className="font-medium capitalize">
                    {selectedOrder.payment_method || "No especificado"}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-semibold mb-2">Cliente</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p>
                    {selectedOrder.profiles?.first_name}{" "}
                    {selectedOrder.profiles?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.profiles?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.profiles?.phone}
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.delivery_address && (
                <div>
                  <h4 className="font-semibold mb-2">Dirección de Entrega</h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                    <p>
                      {selectedOrder.delivery_address.street}{" "}
                      {selectedOrder.delivery_address.number}
                      {selectedOrder.delivery_address.floor &&
                        `, ${selectedOrder.delivery_address.floor}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.delivery_address.city},{" "}
                      {selectedOrder.delivery_address.province} (
                      {selectedOrder.delivery_address.postalCode})
                    </p>
                    {selectedOrder.delivery_address.references && (
                      <p className="text-sm text-muted-foreground">
                        Ref: {selectedOrder.delivery_address.references}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Products */}
              <div>
                <h4 className="font-semibold mb-2">Productos</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 bg-muted/50 rounded-lg p-3"
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        {item.flavor && (
                          <p className="text-sm text-muted-foreground">
                            Sabor: {item.flavor}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {item.quantity} x {formatPrice(item.price_per_unit)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(item.quantity * item.price_per_unit)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento:</span>
                    <span>-{formatPrice(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span>
                    {selectedOrder.delivery_cost === 0
                      ? "Gratis"
                      : formatPrice(selectedOrder.delivery_cost)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notas del Cliente</h4>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h4 className="font-semibold mb-2">Notas del Admin</h4>
                {editingNotes === selectedOrder.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="Agregar notas..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveNotes(selectedOrder.id)}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNotes(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-sm bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => {
                      setEditingNotes(selectedOrder.id);
                      setTempNotes(selectedOrder.admin_notes || "");
                    }}
                  >
                    {selectedOrder.admin_notes || "Click para agregar notas..."}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserOrdersTable;