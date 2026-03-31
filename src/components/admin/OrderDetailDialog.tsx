import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type OrderStatus,
  type OrderType,
  type OrderItem,
  type DeliveryAddress,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_TYPE_LABELS,
} from "@/lib/types";
import { formatPrice, formatDateCompact } from "@/lib/formatting";

interface OrderProfile {
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface DialogOrder {
  id: string;
  order_number: string;
  order_type: OrderType;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  delivery_cost: number;
  delivery_address: DeliveryAddress | null;
  payment_method: string | null;
  status: OrderStatus;
  notes: string | null;
  admin_notes: string | null;
  participants_count: number | null;
  is_promo: boolean;
  created_at: string;
  profiles?: OrderProfile;
}

interface OrderDetailDialogProps {
  order: DialogOrder | null;
  onClose: () => void;
  onNotesUpdated: () => void;
}

const statusColors = ORDER_STATUS_COLORS;
const statusLabels = ORDER_STATUS_LABELS;
const orderTypeLabels = ORDER_TYPE_LABELS;

export const OrderDetailDialog = ({ order, onClose, onNotesUpdated }: OrderDetailDialogProps) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState("");
  const [productCounters, setProductCounters] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!order) return;
    setEditingNotes(false);
    const fetchCounters = async () => {
      const productIds = [...new Set(order.items.map(i => i.product_id))];
      if (productIds.length === 0) return;
      const { data } = await supabase
        .from("products")
        .select("id, total_orders_count")
        .in("id", productIds);
      if (data) {
        const map: Record<string, number> = {};
        data.forEach((p: any) => { map[p.id] = p.total_orders_count || 0; });
        setProductCounters(map);
      }
    };
    fetchCounters();
  }, [order?.id]);

  const handleSaveNotes = async () => {
    if (!order) return;
    const { error } = await supabase
      .from("user_orders")
      .update({ admin_notes: tempNotes })
      .eq("id", order.id);

    if (error) {
      toast.error("Error al guardar las notas");
    } else {
      toast.success("Notas guardadas");
      setEditingNotes(false);
      onNotesUpdated();
    }
  };


  return (
    <Dialog open={!!order} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Pedido {order?.order_number}
          </DialogTitle>
        </DialogHeader>

        {order && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {orderTypeLabels[order.order_type]}
                  {order.is_promo && <span className="text-green-600 ml-1">(PROMO)</span>}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className={statusColors[order.status]}>
                  {statusLabels[order.status]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatDateCompact(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Método de Pago</p>
                <p className="font-medium capitalize">
                  {order.payment_method || "No especificado"}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h4 className="font-semibold mb-2">Cliente</h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p>
                  {order.profiles?.first_name}{" "}
                  {order.profiles?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.profiles?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.profiles?.phone}
                </p>
              </div>
            </div>

            {/* Delivery Address */}
            {order.delivery_address && (
              <div>
                <h4 className="font-semibold mb-2">Dirección de Entrega</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p>
                    {order.delivery_address.street}{" "}
                    {order.delivery_address.number}
                    {order.delivery_address.floor &&
                      `, ${order.delivery_address.floor}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.delivery_address.city},{" "}
                    {order.delivery_address.province} (
                    {order.delivery_address.postalCode})
                  </p>
                  {order.delivery_address.references && (
                    <p className="text-sm text-muted-foreground">
                      Ref: {order.delivery_address.references}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Products */}
            <div>
              <h4 className="font-semibold mb-2">Productos</h4>
              <div className="space-y-2">
                {order.items.map((item, idx) => {
                  const isCollective = order.order_type === "collective";
                  const perItemCount = item.participants_count;
                  const orderLevelCount = order.participants_count;
                  const hasFrozenCount = isCollective && (
                    (perItemCount != null && perItemCount > 0) ||
                    (order.status !== 'pending' && orderLevelCount != null && orderLevelCount > 0)
                  );
                  const counter = hasFrozenCount
                    ? (perItemCount != null && perItemCount > 0 ? perItemCount : orderLevelCount)
                    : (isCollective ? productCounters[item.product_id] : undefined);

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 bg-muted/50 rounded-lg p-3"
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded"
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        {item.flavor && (
                          <p className="text-sm text-muted-foreground">
                            Sabor: {item.flavor}
                          </p>
                        )}
                        {counter !== undefined && counter !== null && (
                          <p className="text-xs text-muted-foreground">
                            👥 {hasFrozenCount ? `${counter} (al cierre)` : `${counter} en contador`}
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
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    {order.is_promo ? "Descuento (PROMO):" : "Descuento:"}
                  </span>
                  <span>-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>
                  {order.delivery_cost === 0
                    ? "Gratis"
                    : formatPrice(order.delivery_cost)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatPrice(order.subtotal + order.delivery_cost)}</span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <h4 className="font-semibold mb-2">Notas del Cliente</h4>
                <p className="text-sm bg-muted/50 rounded-lg p-3">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <h4 className="font-semibold mb-2">Notas del Admin</h4>
              {editingNotes ? (
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
                      onClick={handleSaveNotes}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNotes(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => {
                    setEditingNotes(true);
                    setTempNotes(order.admin_notes || "");
                  }}
                >
                  {order.admin_notes || "Click para agregar notas..."}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
