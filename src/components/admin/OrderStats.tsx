import type { OrderStatus, OrderType } from "@/lib/types";

interface OrderSummary {
  status: OrderStatus;
  order_type: OrderType;
}

interface OrderStatsProps {
  orders: OrderSummary[];
}

export const OrderStats = ({ orders }: OrderStatsProps) => {
  return (
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
  );
};
