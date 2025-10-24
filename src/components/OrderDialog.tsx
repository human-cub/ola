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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Copy, Instagram } from "lucide-react";

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
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (open && waitForDiscount) {
      fetchOrderNumber();
    }
  }, [open, productId, waitForDiscount]);

  const fetchOrderNumber = async () => {
    const { data: product } = await supabase
      .from("products")
      .select("waiting_for_discount_count, virtual_orders_count")
      .eq("name", productName)
      .single();

    if (product) {
      // Номер участника = waiting_for_discount_count + virtual_orders_count + 1
      const currentTotal = (product.waiting_for_discount_count || 0) + (product.virtual_orders_count || 0);
      setOrderNumber(currentTotal + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("=== Starting order submission ===");
      console.log("Product name:", productName);
      console.log("Wait for discount:", waitForDiscount);
      
      // Get product from database to get the ID
      const { data: dbProduct, error: productError } = await supabase
        .from("products")
        .select("id")
        .eq("name", productName)
        .single();

      console.log("Product from DB:", dbProduct);
      if (productError) console.error("Product fetch error:", productError);

      const orderData = {
        product_id: dbProduct?.id || null,
        product_name: productName,
        customer_name: customerName,
        phone: phone,
        comment: comment || null,
        waiting_for_discount: waitForDiscount,
      };

      console.log("Order data to insert:", orderData);

      const { data, error } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      console.log("Insert result - data:", data);
      console.log("Insert result - error:", error);

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

      // Reset form and close order dialog
      setCustomerName("");
      setPhone("");
      setComment("");
      onOpenChange(false);
      
      // Show success dialog
      setShowSuccess(true);
    } catch (error: any) {
      console.error("Error details:", error);
      toast.error(error.message || "Error al enviar el pedido");
    } finally {
      setLoading(false);
    }
  };

  const copyProductLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast.success("¡Enlace copiado!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {waitForDiscount ? "🕐 Esperar y pagar menos" : "🛒 Comprar ahora"}
          </DialogTitle>
          {waitForDiscount && (
            <DialogDescription>
              <div className="text-center py-2">
                <span className="text-2xl font-bold text-primary">
                  Sos participante #{orderNumber}
                </span>
              </div>
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
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

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl">
              ¡Listo! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base pt-2">
              Tus datos fueron enviados. Te contactaremos pronto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={copyProductLink}
              variant="outline"
              className="w-full gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar enlace del producto
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="w-full gap-2"
            >
              <a 
                href="https://www.instagram.com/ola.suplementos/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Instagram className="h-4 w-4" />
                Seguinos en Instagram
              </a>
            </Button>
            
            <Button
              onClick={() => setShowSuccess(false)}
              className="w-full mt-2"
            >
              Cerrar
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrderDialog;
