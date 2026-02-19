import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import { ShareBlock } from "@/components/ShareBlock";

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
  discount_percentage: number;
  participants_count: number;
  total_amount: number;
  delivery_cost: number;
  delivery_address: any;
  payment_method: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes: string | null;
  collective_close_date: string | null;
  created_at: string;
  is_promo: boolean;
  promo_tier: number | null;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle },
  processing: { label: 'En proceso', color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: Package },
  shipped: { label: 'Enviado', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Truck },
  delivered: { label: 'Entregado', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

const timelineSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const WHATSAPP_NUMBER = '5491166650878';

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Debés iniciar sesión para ver este pedido");
        navigate("/ingresar?redirect=/mi-cuenta/pedidos/" + orderId);
        return;
      }

      // Fetch order - RLS will only return if user owns it or is admin
      const { data, error } = await supabase
        .from("user_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error || !data) {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (!roleData) {
          toast.error("No tenés permiso para ver este pedido");
          navigate("/mi-cuenta");
          return;
        }
        
        // Admin but order not found
        toast.error("Pedido no encontrado");
        navigate("/admin");
        return;
      }

      // Verify ownership (extra client-side check)
      if (data.user_id !== session.user.id) {
        // Check if admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (!roleData) {
          toast.error("No tenés permiso para ver este pedido");
          navigate("/mi-cuenta");
          return;
        }
      }

      setOrder(data as unknown as Order);
      setLoading(false);
    };

    fetchOrder();
  }, [orderId, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
  const currentStepIndex = timelineSteps.indexOf(order.status);

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

            {/* Order Status chip */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[order.status]?.bgColor} ${statusConfig[order.status]?.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-medium">{statusConfig[order.status]?.label}</span>
            </div>

            {/* Product title */}
            <div className="">
              <h1 className="mt-4 text-2xl font-bold leading-[1.1]">Pedido {order.order_number}</h1>
              <p className="text-muted-foreground mt-3">{formatDate(order.created_at)}</p>
            </div>
          </div>

          {/* Timeline for active orders */}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <div className="mb-6 -mx-4 overflow-auto touch-pan-x">
              <div className="flex items-center justify-between gap-2 px-4">
                {timelineSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                      </div>

                      <span className={`whitespace-nowrap text-xs mt-1 ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                        {statusConfig[step as keyof typeof statusConfig]?.label}
                      </span>
                    </div>
                  );
                })}
              </div>              
            </div>
          )}

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    {item.flavor && <p className="text-sm text-muted-foreground">{item.flavor}</p>}
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.price_per_unit * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4 space-y-2">
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precio sin descuento:</span>
                    <span className="line-through text-muted-foreground">{formatPrice(order.subtotal + order.discount_amount)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{order.is_promo ? 'Descuento (PROMO):' : 'Descuento:'}</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío:</span>
                  <span>{order.delivery_cost === 0 ? 'Gratis' : formatPrice(order.delivery_cost)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Información de entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {order.delivery_address && (
                <div>
                  <span className="text-muted-foreground">Dirección: </span>
                  <span>
                    {[
                      order.delivery_address.street,
                      order.delivery_address.number,
                      order.delivery_address.floor,
                      order.delivery_address.postalCode,
                      order.delivery_address.city,
                      order.delivery_address.province !== order.delivery_address.city ? order.delivery_address.province : null,
                      order.delivery_address.references
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Forma de pago: </span>
                <span className="capitalize">{order.payment_method}</span>
              </div>
              {order.order_type === 'collective' && order.discount_percentage > 0 && (
                <div>
                  <span className="text-muted-foreground">Descuento obtenido: </span>
                  <span className="text-green-600 font-medium">{order.discount_percentage}%</span>
                </div>
              )}
              {order.collective_close_date && (
                <div>
                  <span className="text-muted-foreground">Fecha de cierre: </span>
                  <span>{formatDate(order.collective_close_date)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {order.status === 'pending' && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancelOrder}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar pedido
              </Button>
            )}

            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Button 
                variant="outline" 
                className="w-full"
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
