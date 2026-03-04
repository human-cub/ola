import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { z } from "zod";
import { formatFullName } from "@/lib/formatting";
import { OrderSuccessDialog } from "@/components/OrderSuccessDialog";

const orderSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre es demasiado largo"),
  lastName: z.string().trim().max(100, "El apellido es demasiado largo").optional(),
  phone: z.string().trim().regex(/^[\+]?[0-9\s\-()]{7,20}$/, "Formato de teléfono inválido"),
  comment: z.string().max(500, "El comentario es demasiado largo").optional(),
});

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  waitForDiscount: boolean;
}

const OrderDialog = ({
  open,
  onOpenChange,
  productId,
  productName,
  waitForDiscount,
}: OrderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [orderNumber, setOrderNumber] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [peopleUntilNextDiscount, setPeopleUntilNextDiscount] = useState(0);
  const [maxPrice, setMaxPrice] = useState("");

  const fetchOrderNumber = async () => {
    const { data: product } = await supabase
      .from("products")
      .select("waiting_for_discount_count, virtual_orders_count, prices")
      .eq("name", productName)
      .single();

    if (product) {
      const currentTotal = (product.waiting_for_discount_count || 0) + (product.virtual_orders_count || 0);
      setOrderNumber(currentTotal);

      const thresholds = [25, 50, 75, 100];
      const nextThreshold = thresholds.find(t => t > currentTotal) || 100;
      setPeopleUntilNextDiscount(nextThreshold - currentTotal);

      if (product.prices && Array.isArray(product.prices)) {
        const priceAt100 = product.prices.find((p: any) => p.people === 100) as { people: number; price: number } | undefined;
        if (priceAt100) {
          setMaxPrice(`$${(priceAt100.price / 1000).toFixed(3).replace('.', ',')}`);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = orderSchema.parse({
        firstName,
        lastName: lastName || undefined,
        phone,
        comment: comment || undefined,
      });

      const customerName = formatFullName(validated.firstName, validated.lastName);

      const { data: dbProduct, error: productError } = await supabase
        .from("products")
        .select("id")
        .eq("name", productName)
        .maybeSingle();

      if (productError) throw productError;

      const orderData = {
        product_id: dbProduct?.id || null,
        product_name: productName,
        customer_name: customerName,
        phone: validated.phone,
        comment: validated.comment || null,
        waiting_for_discount: waitForDiscount,
      };

      const { error } = await supabase
        .from("orders")
        .insert(orderData);

      if (error) throw error;

      try {
        await supabase.functions.invoke("notify-telegram", {
          body: {
            product_name: orderData.product_name,
            customer_name: orderData.customer_name,
            phone: orderData.phone,
            comment: orderData.comment,
            waiting_for_discount: orderData.waiting_for_discount,
            created_at: new Date().toISOString(),
          },
        });
      } catch {
        // Notification failed but order was saved
      }

      setFirstName("");
      setLastName("");
      setPhone("");
      setComment("");
      onOpenChange(false);

      if (waitForDiscount) {
        await fetchOrderNumber();
      }

      setShowSuccess(true);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error al enviar el pedido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {waitForDiscount ? "🕐 Esperar y pagar menos" : "🛒 Comprar ahora"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Tu nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="placeholder:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Tu apellido (opcional)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="placeholder:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="placeholder:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comentario</Label>
              <Textarea
                id="comment"
                placeholder="Cantidad, sabor y otras preferencias"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none placeholder:opacity-50"
              />
            </div>

            {waitForDiscount && (
              <p className="text-xs text-center text-muted-foreground">
                Tranqui, agregarte no te obliga a nada
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <OrderSuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        productName={productName}
        waitForDiscount={waitForDiscount}
        orderNumber={orderNumber}
        peopleUntilNextDiscount={peopleUntilNextDiscount}
        maxPrice={maxPrice}
      />
    </>
  );
};

export default OrderDialog;
