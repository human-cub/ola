import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogPricing } from "@/hooks/useCatalogPricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Package, MessageSquare, Copy, Mail, Tag, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { applyPromoTier } from "@/services/orderService";

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
  promo_tier?: number | null;
  promo_code?: string | null;
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
  const [messageOpen, setMessageOpen] = useState(false);
  const [promoCodes, setPromoCodes] = useState<Array<{ id: string; code: string; tier_bonus: number }>>([]);
  const [selectedPromoId, setSelectedPromoId] = useState<string>("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  // Каталог: бренд и ссылка на страницу товара для позиций заказа
  const { priceMap } = useCatalogPricing();

  useEffect(() => {
    if (!order) return;
    setEditingNotes(false);
    setSelectedPromoId("");
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

  useEffect(() => {
    const fetchPromos = async () => {
      const { data } = await supabase
        .from("promo_codes")
        .select("id, code, tier_bonus")
        .eq("is_active", true)
        .order("code");
      if (data) setPromoCodes(data);
    };
    fetchPromos();
  }, []);

  const handleApplyPromo = async () => {
    if (!order || !selectedPromoId) return;
    const promo = promoCodes.find(p => p.id === selectedPromoId);
    if (!promo) return;

    setApplyingPromo(true);
    try {
      // Enforce one promo code per user
      const { data: existing } = await supabase
        .from("user_orders")
        .select("id, order_number")
        .eq("promo_code", promo.code)
        .neq("id", order.id)
        .neq("status", "cancelled");
      // Need user_id of current order
      const { data: thisOrder } = await supabase
        .from("user_orders")
        .select("user_id")
        .eq("id", order.id)
        .single();
      if (thisOrder && existing && existing.length > 0) {
        const { data: dup } = await supabase
          .from("user_orders")
          .select("order_number")
          .eq("user_id", thisOrder.user_id)
          .eq("promo_code", promo.code)
          .neq("id", order.id)
          .neq("status", "cancelled")
          .limit(1)
          .maybeSingle();
        if (dup) {
          toast.error(`El cliente ya usó ${promo.code} en ${dup.order_number}`);
          setApplyingPromo(false);
          return;
        }
      }

      // Apply tier bonus per-item: each product shifts from its own current tier.
      await applyPromoTier(order, promo.tier_bonus, { bonus: promo.tier_bonus, code: promo.code });
      toast.success(`Promo ${promo.code} aplicada`);
      onNotesUpdated();
    } catch (error: any) {
      toast.error(error?.message || "Error al aplicar promo");
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = async () => {
    if (!order) return;
    setApplyingPromo(true);
    try {
      await applyPromoTier(order, null);
      toast.success("Promo quitada");
      onNotesUpdated();
    } catch (error: any) {
      toast.error(error?.message || "Error al quitar promo");
    } finally {
      setApplyingPromo(false);
    }
  };

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

  const buildMessage = (o: DialogOrder): string => {
    const rawFirstName = o.profiles?.first_name?.trim();
    const firstName = rawFirstName
      ? rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1)
      : "";
    const greeting = firstName
      ? `Buenos Días, ${firstName}!`
      : `Buenos Días!`;

    const itemsText = o.items
      .map((item, idx) => {
        const lines = [`${idx + 1}. ${item.product_name}`];
        if (item.flavor) lines.push(`Sabor: ${item.flavor}`);
        lines.push(`${item.quantity} x ${formatPrice(item.price_per_unit)}`);
        return lines.join("\n");
      })
      .join("\n\n");

    const discountLine =
      o.discount_amount > 0
        ? `Descuento: -${formatPrice(o.discount_amount)}`
        : "";

    const shippingLine = `Envío: ${
      o.delivery_cost === 0 ? "Gratis" : formatPrice(o.delivery_cost)
    }`;

    const total = o.subtotal + o.delivery_cost;

    let addressText = "https://alaola.com.ar/completar-datos-grupo";
    if (o.delivery_address) {
      const a = o.delivery_address;
      const line1 = [a.street, a.number, a.floor].filter(Boolean).join(" ");
      const line2 = [a.city, a.province].filter(Boolean).join(", ");
      const postal = a.postalCode ? ` (${a.postalCode})` : "";
      addressText = [line1, `${line2}${postal}`].filter(Boolean).join("\n");
      if (a.references) addressText += `\nRef: ${a.references}`;
    }

    return [
      greeting,
      "",
      "Soy Angelina de Ola! 🌊",
      "",
      "Ya tenemos los resultados de la colecta de la semana pasada.",
      "",
      "Esperaste:",
      itemsText,
      "",
      discountLine,
      shippingLine,
      "",
      `Precio final de la compra es: ${formatPrice(total)}`,
      "",
      "Confirmá tus datos de entrega para que te llevemos tu pedido hoy:",
      "",
      addressText,
      "",
      "Pago al recibir y revisar el producto en transferencia o efectivo",
      "",
      "Si tenés alguna duda, avisame☺️",
    ]
      .filter((line) => line !== null && line !== undefined)
      .join("\n");
  };

  const message = order ? buildMessage(order) : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensaje copiado");
    } catch {
      toast.error("Error al copiar");
    }
  };

  const getWhatsAppPhone = (phoneValue?: string | null) => {
    const digits = (phoneValue || "").replace(/\D/g, "");
    if (!digits) return "";

    let localPhone = digits;
    if (localPhone.startsWith("549")) {
      localPhone = localPhone.slice(3);
    } else if (localPhone.startsWith("54")) {
      localPhone = localPhone.slice(2);
      if (localPhone.startsWith("9")) localPhone = localPhone.slice(1);
    }

    while (localPhone.startsWith("0")) {
      localPhone = localPhone.slice(1);
    }

    return localPhone.startsWith("11") && localPhone.length >= 9
      ? `549${localPhone}`
      : "";
  };

  const handleWhatsApp = () => {
    const phone = getWhatsAppPhone(order?.profiles?.phone);
    if (order?.profiles?.phone && !phone) {
      toast.error("El teléfono no tiene formato válido para WhatsApp");
    }
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const email = order?.profiles?.email || "";
    const subject = `Pedido ${order?.order_number || ""} - Ola!`;
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.location.href = url;
  };


  return (
    <Dialog open={!!order} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Pedido {order?.order_number}
            </DialogTitle>
            {order?.order_type === "collective" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessageOpen(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Mensaje
              </Button>
            )}
          </div>
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

                  const catalogInfo = priceMap.get(item.product_id);
                  const productHref = catalogInfo?.urlSlug
                    ? `/productos/${catalogInfo.urlSlug}${item.flavor ? `?flavor=${encodeURIComponent(item.flavor)}` : ""}`
                    : ((item as any).product_link ?? null);
                  const brandLabel = catalogInfo?.brandName ?? (item as any).brand_slug ?? null;

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
                        {brandLabel && (
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {brandLabel}
                          </p>
                        )}
                        {productHref ? (
                          <a
                            href={productHref}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary hover:underline"
                            title="Abrir la página del producto con el sabor elegido"
                          >
                            {item.product_name}
                          </a>
                        ) : (
                          <p className="font-medium">{item.product_name}</p>
                        )}
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

            {/* Promo code */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Código promocional
              </h4>
              {order.is_promo ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
                  <span className="text-sm text-green-700 dark:text-green-400">
                    PROMO <strong>{order.promo_code ?? "—"}</strong> aplicada (+{order.promo_tier ?? "—"} tier)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemovePromo}
                    disabled={applyingPromo}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Quitar
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={selectedPromoId} onValueChange={setSelectedPromoId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Elegí un código activo" />
                    </SelectTrigger>
                    <SelectContent>
                      {promoCodes.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No hay códigos activos
                        </div>
                      ) : (
                        promoCodes.map(pc => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.code} (+{pc.tier_bonus} tier{pc.tier_bonus > 1 ? "s" : ""})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleApplyPromo}
                    disabled={!selectedPromoId || applyingPromo}
                  >
                    Aplicar
                  </Button>
                </div>
              )}
            </div>

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

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Mensaje para el cliente</DialogTitle>
          </DialogHeader>
          <Textarea
            value={message}
            readOnly
            rows={18}
            className="font-mono text-xs resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopy} variant="outline" className="flex-1 min-w-[120px]">
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            <Button onClick={handleWhatsApp} variant="outline" className="flex-1 min-w-[120px]">
              <WhatsAppIcon className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={handleEmail} variant="outline" className="flex-1 min-w-[120px]">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
