import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Clock, Truck, CheckCircle, XCircle, ChevronRight, FileText } from "lucide-react";

interface OrderItem {
  product_id: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  price_per_unit: number;
  product_image: string | null;
}

interface Order {
  id: string;
  order_number: string;
  order_type: 'immediate' | 'collective';
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  delivery_address: any;
  payment_method: string;
  is_promo: boolean;
  promo_tier: number | null;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'text-amber-600 bg-amber-100', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'text-blue-600 bg-blue-100', icon: CheckCircle },
  processing: { label: 'En proceso', color: 'text-cyan-600 bg-cyan-100', icon: Package },
  shipped: { label: 'Enviado', color: 'text-purple-600 bg-purple-100', icon: Truck },
  delivered: { label: 'Entregado', color: 'text-green-600 bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-600 bg-red-100', icon: XCircle },
};

const OrdersTab = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("recent");

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase
        .from("user_orders")
        .select("*")
        .eq("user_id", session.user.id);

      if (filterType !== "all") {
        query = query.eq("order_type", filterType as 'immediate' | 'collective');
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus as Order['status']);
      }

      query = query.order("created_at", { ascending: sortOrder === "oldest" });

      const { data, error } = await query;

      if (!error && data) {
        setOrders(data as unknown as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [filterType, filterStatus, sortOrder]);

  const formatPrice = (price: number) => {
    return `$${Math.round(price).toLocaleString('es-AR')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Cargando pedidos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los pedidos</SelectItem>
            <SelectItem value="immediate">Compra inmediata</SelectItem>
            <SelectItem value="collective">Compra colectiva</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="processing">En proceso</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Más recientes</SelectItem>
            <SelectItem value="oldest">Más antiguos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {orders.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No hay pedidos</h2>
          <p className="text-muted-foreground mb-4">
            Aún no realizaste ningún pedido
          </p>
          <Button asChild>
            <Link to="/">Ir a comprar</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || Package;
            // Pending collective orders should redirect to waiting list
            const isPendingCollective = order.order_type === 'collective' && order.status === 'pending';
            const linkTo = isPendingCollective ? '/lista-espera' : `/mi-cuenta/pedidos/${order.id}`;
            
            return (
              <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">Pedido {order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusConfig[order.status]?.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {isPendingCollective ? 'En espera' : statusConfig[order.status]?.label}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-1">
                      <p className="text-sm">
                        Tipo: <span className="font-medium">
                          {order.order_type === 'immediate' ? 'Compra inmediata' : 'Compra colectiva'}
                          {order.is_promo && <span className="text-green-600 ml-1">(PROMO)</span>}
                        </span>
                      </p>
                      {isPendingCollective ? (
                        <p className="text-sm text-amber-600 font-medium">Esperando cierre del domingo</p>
                      ) : (
                        <p className="text-lg font-bold">{formatPrice(order.total_amount)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to={linkTo}>
                        <FileText className="w-4 h-4 mr-1" />
                        {isPendingCollective ? 'Ver lista' : 'Ver comprobante'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
