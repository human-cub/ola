import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Clock, Truck, CheckCircle, XCircle, MessageCircle, Copy } from "lucide-react";
import { toast } from "sonner";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Separator } from "@/components/ui/separator";
import instagramIcon from '@/assets/instagram-icon-new.png';

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

const SHARE_TEXT = 'Mirá - descuentos increíbles de suplementos 🎉 Podés comprar ahora con 20% de descuento o esperar y pagar aún menos 🤑 https://ola.lovable.app/';
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: SHARE_TEXT });
      } catch (error) {
        navigator.clipboard.writeText(SHARE_TEXT);
        toast.success("¡Texto copiado!");
      }
    } else {
      navigator.clipboard.writeText(SHARE_TEXT);
      toast.success("¡Texto copiado!");
    }
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

      <main className="pt-[120px] sm:pt-[104px] pb-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Link
            to="/mi-cuenta"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mis pedidos
          </Link>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Pedido {order.order_number}</h1>
              <p className="text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[order.status]?.bgColor} ${statusConfig[order.status]?.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="font-medium">{statusConfig[order.status]?.label}</span>
            </div>
          </div>

          {/* Timeline for active orders */}
          {order.status !== 'cancelled' && order.status !== 'delivered' && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
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
                        <span className={`text-xs mt-1 ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>
                          {statusConfig[step as keyof typeof statusConfig]?.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{order.is_promo ? 'Descuento (PROMO):' : 'Descuento:'}</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Envío:</span>
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

          {/* Share Block - Same as ServiceDescription */}
          <div className="bg-gradient-primary/10 rounded-lg p-4 border border-primary/20">
            <p className="text-sm font-semibold text-primary text-center mb-1">
              ¡Seamos más pagamos menos!
            </p>
            <p className="text-sm text-center text-muted-foreground mb-4">
              Vamos a conseguir el mejor descuento — compartilo con tus amigos.
            </p>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={handleShare}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Compartir con amigos</span>
              </button>
              
              <button
                onClick={() => {
                  const text = encodeURIComponent(SHARE_TEXT);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.463 3.488"/>
                </svg>
                <span>Compartir por WhatsApp</span>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(SHARE_TEXT);
                  toast.success("¡Invitación copiada!");
                }}
                className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Copy className="h-4 w-4 flex-shrink-0" />
                <span>Copiar invitación</span>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText('https://ola.lovable.app/');
                  toast.success("¡Enlace copiado!");
                }}
                className="w-full border border-border hover:bg-accent rounded-md py-2.5 px-4 flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Copy className="h-4 w-4 flex-shrink-0" />
                <span>Copiar enlace</span>
              </button>
              
              <div className="border-t border-border/50 pt-2 mt-2" />
              
              <div className="relative w-full p-[2px] rounded-md bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
                <a
                  href="https://www.instagram.com/ola.unity/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-background hover:bg-accent rounded-md py-2.5 px-4 transition-colors text-sm"
                >
                  <img 
                    src={instagramIcon}
                    alt="Instagram"
                    className="h-5 w-5 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap">Seguinos en Instagram</span>
                </a>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                para ofertas, descuentos y novedades
              </p>
            </div>
          </div>
        </div>
      </main>

      <FloatingWhatsApp />
    </div>
  );
};

export default OrderDetail;