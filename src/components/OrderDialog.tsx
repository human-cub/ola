import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [orderNumber, setOrderNumber] = useState(0);

  useEffect(() => {
    if (open && waitForDiscount) {
      fetchOrderNumber();
    }
  }, [open, productId, waitForDiscount]);

  const fetchOrderNumber = async () => {
    const { data: product } = await supabase
      .from("products")
      .select("waiting_for_discount_count")
      .eq("name", productName)
      .single();

    if (product) {
      // Номер участника = текущий счетчик + 1
      setOrderNumber(product.waiting_for_discount_count + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get product from database to get the ID
      const { data: dbProduct } = await supabase
        .from("products")
        .select("id")
        .eq("name", productName)
        .single();

      const orderData = {
        product_id: dbProduct?.id || null,
        product_name: productName,
        customer_name: customerName,
        phone: phone,
        comment: comment || null,
        waiting_for_discount: waitForDiscount,
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (error) throw error;

      // Send Telegram notification
      try {
        await supabase.functions.invoke("notify-telegram", {
          body: {
            product_name: orderData.product_name,
            customer_name: orderData.customer_name,
            phone: orderData.phone,
            comment: orderData.comment,
            waiting_for_discount: orderData.waiting_for_discount,
            created_at: data.created_at,
          },
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
      }

      toast.success("¡Pedido enviado exitosamente!");

      // Reset form and close
      setCustomerName("");
      setPhone("");
      setComment("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {waitForDiscount ? "🕐 Подождать скидку" : "🛒 Купить сейчас"}
          </DialogTitle>
          {waitForDiscount && (
            <DialogDescription>
              <div className="text-center py-2">
                <span className="text-2xl font-bold text-primary">
                  Вы участник #{orderNumber}
                </span>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Ваше имя"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+54 9 11 1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              placeholder="Введите количество, вкус и иные пожелания к заказу"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none placeholder:text-muted-foreground/50"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Отменить
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Отправка..." : "Отправить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDialog;
