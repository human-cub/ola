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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Trash2, Eye, ShoppingCart, Clock, Tag } from "lucide-react";
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
import {
  shouldUseDynamicCollectivePricing,
} from "@/lib/collectivePricing";
import { recalculateOrderItems, type ProductPricingData } from "@/lib/orderPricingSync";
import {
  type OrderStatus,
  type OrderType,
  type OrderItem,
  type DeliveryAddress,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_TYPE_LABELS,
} from "@/lib/types";
import { formatPrice } from "@/lib/formatting";
import { applyPromoTier } from "@/services/orderService";
import { fetchServerTime } from "@/lib/serverClock";
import { OrderFilters } from "./OrderFilters";
import { OrderStats } from "./OrderStats";
import { OrderDetailDialog, type DialogOrder } from "./OrderDetailDialog";

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
  is_promo: boolean;
  promo_tier: number | null;
  promo_code: string | null;
  profiles?: {
    email: string | null;
    phone: string | null;
    first_name: string | null;
    last_name: string | null;
  };
}

const statusColors = ORDER_STATUS_COLORS;
const statusLabels = ORDER_STATUS_LABELS;
const orderTypeLabels = ORDER_TYPE_LABELS;

const UserOrdersTable = () => {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);

    let query = supabase
      .from("user_orders")
      .select("*")
      .order("created_at", { ascending: false });

    const archivedStatuses: OrderStatus[] = ['delivered', 'cancelled'];
    if (showArchive) {
      query = query.in("status", archivedStatuses);
    } else {
      query = query.not("status", "in", `(delivered,cancelled)`);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as OrderStatus);
    }

    if (typeFilter !== "all") {
      query = query.eq("order_type", typeFilter as OrderType);
    }

    const { data: ordersData, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar los pedidos");
      setLoading(false);
      return;
    }

    const userIds = [...new Set((ordersData || []).map((o: any) => o.user_id))];

    let profilesMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, phone, first_name, last_name")
        .in("user_id", userIds);

      if (profilesData) {
        profilesData.forEach((p: any) => {
          profilesMap[p.user_id] = p;
        });
      }
    }

    const parsedOrders = (ordersData || []).map((order: any) => ({
      ...order,
      items: Array.isArray(order.items) ? order.items : [],
      delivery_address: order.delivery_address as DeliveryAddress | null,
      profiles: profilesMap[order.user_id] || null,
    })) as UserOrder[];

    const serverNow = await fetchServerTime().catch(() => new Date());

    const shouldSyncOrder = (order: UserOrder) =>
      shouldUseDynamicCollectivePricing({
        orderType: order.order_type,
        status: order.status,
        createdAt: order.created_at,
        collectiveCloseDate: order.collective_close_date,
        isPromo: order.is_promo,
        items: order.items,
        now: serverNow,
      });

    const dynamicOrders = parsedOrders.filter(shouldSyncOrder);
    const dynamicProductIds = [
      ...new Set(dynamicOrders.flatMap((order) => order.items.map((item) => item.product_id))),
    ];

    const productPricingMap = new Map<string, ProductPricingData>();

    if (dynamicProductIds.length > 0) {
      const { data: productsData } = await supabase
        .from("products")
        .select("id, prices, total_orders_count")
        .in("id", dynamicProductIds);

      productsData?.forEach((product: any) => {
        productPricingMap.set(product.id, {
          prices: product.prices,
          totalOrdersCount: Number(product.total_orders_count || 0),
        });
      });
    }

    const syncUpdates: PromiseLike<unknown>[] = [];

    const normalizedOrders = parsedOrders.map((order) => {
      if (!shouldSyncOrder(order)) {
        return order;
      }

      const result = recalculateOrderItems(
        order.items,
        productPricingMap,
        Number(order.delivery_cost || 0),
      );

      if (!result.hasChanges) {
        return order;
      }

      syncUpdates.push(
        supabase
          .from("user_orders")
          .update({
            items: result.items as any,
            subtotal: result.subtotal,
            discount_amount: result.discountAmount,
            total_amount: result.totalAmount,
          })
          .eq("id", order.id)
      );

      return {
        ...order,
        items: result.items,
        subtotal: result.subtotal,
        discount_amount: result.discountAmount,
        total_amount: result.totalAmount,
      };
    });

    if (syncUpdates.length > 0) {
      await Promise.all(syncUpdates);
    }

    const filtered = searchQuery
      ? normalizedOrders.filter(
          (o) =>
            o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.profiles?.phone?.includes(searchQuery)
        )
      : normalizedOrders;

    setOrders(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

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
  }, [statusFilter, typeFilter, searchQuery, showArchive]);

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

  const handleApplyPromo = async (orderId: string, tier: number | null) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      await applyPromoTier(order, tier);
      toast.success(tier === null ? "Promoción cancelada - precios restaurados" : `Promoción tier ${tier} aplicada`);
      fetchOrders();
    } catch {
      toast.error(tier === null ? "Error al cancelar promoción" : "Error al aplicar promoción");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OrderFilters
        showArchive={showArchive}
        onToggleArchive={() => {
          setShowArchive(!showArchive);
          setStatusFilter("all");
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <OrderStats orders={orders} />

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
                    <Badge variant="outline" className={`gap-1 ${order.is_promo ? 'bg-green-50 border-green-300' : ''}`}>
                      {order.order_type === "immediate" ? (
                        <ShoppingCart className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {orderTypeLabels[order.order_type]}
                      {order.is_promo && (
                        <span className="text-green-600 font-semibold">
                          (PROMO{order.promo_code ? `: ${order.promo_code}` : ""})
                        </span>
                      )}
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
                      <Select
                        value={order.promo_tier?.toString() || "-"}
                        onValueChange={(value) => handleApplyPromo(order.id, value === "-" ? null : parseInt(value))}
                      >
                        <SelectTrigger className="w-[70px]">
                          <Tag className="w-3 h-3 mr-1" />
                          {order.promo_tier || "-"}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-">-</SelectItem>
                          {[1, 2, 3, 4].map((tier) => (
                            <SelectItem key={tier} value={tier.toString()}>
                              Tier {tier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

      <OrderDetailDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onNotesUpdated={fetchOrders}
      />
    </div>
  );
};

export default UserOrdersTable;
