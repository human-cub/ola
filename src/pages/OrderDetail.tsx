import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { ShareBlock } from "@/components/ShareBlock";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useOrderDetail } from "@/hooks/useOrderDetail";
import { formatDateNatural } from "@/lib/formatting";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { OrderItemsCard } from "@/components/order/OrderItemsCard";
import { OrderDeliveryCard } from "@/components/order/OrderDeliveryCard";

const statusConfig = {
  pending: { label: 'Pendiente', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle },
  processing: { label: 'En proceso', color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: Package },
  shipped: { label: 'Enviado', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Truck },
  delivered: { label: 'Entregado', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

const WHATSAPP_NUMBER = '5491166650878';

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const headerVisible = useScrollHeader();
  const { order, setOrder, loading } = useOrderDetail(orderId);

  const handleCancelOrder = async () => {
    if (!order || order.status !== 'pending') return;

    const { error } = await supabase
      .from("user_orders")
      .update({ status: 'cancelled' })
      .eq("id", order.id);

    if (error) {
      toast.error("Error al cancelar el pedido");
    } else {
      toast.success("Pedido cancelado");
      setOrder({ ...order, status: 'cancelled' });
    }
  };

  const handleReportProblem = () => {
    const message = `Hola! Tengo un problema con mi pedido ${order?.order_number}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isVisible={true} />
        <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <p className="text-muted-foreground">Cargando pedido...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!order) return null;

  const StatusIcon = statusConfig[order.status]?.icon || Package;

  return (
    <div className="min-h-screen bg-background">
      <Header isVisible={headerVisible} />

      <main className="pt-[120px] sm:pt-[104px] pb-8">
        <div className="container mx-auto max-w-2xl">
          <Link
            to="/mi-cuenta"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mis pedidos
          </Link>

          {/* Header */}
          <div className="flex flex-col items-start justify-between mb-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[order.status]?.bgColor} ${statusConfig[order.status]?.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-medium">{statusConfig[order.status]?.label}</span>
            </div>
            <div className="">
              <h1 className="mt-4 text-2xl font-bold leading-[1.15]">Pedido {order.order_number}</h1>
              <p className="text-muted-foreground mt-3">{formatDateNatural(order.created_at)}</p>
            </div>
          </div>

          <OrderTimeline status={order.status} />

          <OrderItemsCard
            items={order.items}
            subtotal={order.subtotal}
            discountAmount={order.discount_amount}
            deliveryCost={order.delivery_cost}
            totalAmount={order.total_amount}
            isPromo={order.is_promo}
          />

          <OrderDeliveryCard
            deliveryAddress={order.delivery_address}
            paymentMethod={order.payment_method}
            orderType={order.order_type}
            discountPercentage={order.discount_percentage}
            collectiveCloseDate={order.collective_close_date}
          />

          {/* Actions */}
          <div className="space-y-3 flex flex-col">
            {order.status === 'pending' && (
              <Button
                variant="destructive"
                className="w-full mx-auto"
                onClick={handleCancelOrder}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar pedido
              </Button>
            )}

            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Button
                variant="outline"
                className="w-full mx-auto"
                onClick={handleReportProblem}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Reportar problema
              </Button>
            )}
          </div>

          <Separator className="my-6" />

          <ShareBlock />
        </div>
      </main>

      <FloatingWhatsApp />
    </div>
  );
};

export default OrderDetail;
