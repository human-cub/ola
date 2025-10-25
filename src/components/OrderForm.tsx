import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { products } from "@/data/products";
import { z } from "zod";

const orderSchema = z.object({
  customerName: z.string().trim().min(1, "El nombre es requerido").max(100, "El nombre es demasiado largo"),
  phone: z.string().trim().regex(/^[\+]?[0-9\s\-()]{7,20}$/, "Formato de teléfono inválido"),
  comment: z.string().max(500, "El comentario es demasiado largo").optional(),
});

const OrderForm = () => {
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [waitForDiscount, setWaitForDiscount] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validated = orderSchema.parse({
        customerName,
        phone,
        comment: comment || undefined,
      });

      const productData = products[selectedProduct];
      if (!productData) {
        throw new Error("Producto no encontrado");
      }

      // Get product from database to get the ID
      const { data: dbProduct } = await supabase
        .from("products")
        .select("id")
        .eq("name", productData.name)
        .single();

      const orderData = {
        product_id: dbProduct?.id || null,
        product_name: productData.name,
        customer_name: validated.customerName,
        phone: validated.phone,
        comment: validated.comment || null,
        waiting_for_discount: waitForDiscount,
      };

      const { error } = await supabase
        .from("orders")
        .insert(orderData);

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
            created_at: new Date().toISOString(),
          },
        });
      } catch (notifyError) {
        // Notification failed but order was saved
      }

      toast.success("¡Orden enviada exitosamente!");
      
      // Reset form
      setSelectedProduct("");
      setCustomerName("");
      setPhone("");
      setComment("");
      setWaitForDiscount(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Error al enviar la orden");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Hacer tu Pedido</CardTitle>
        <CardDescription>
          Completa el formulario y te contactaremos pronto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Producto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
              <SelectTrigger id="product">
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(products).map(([key, product]) => (
                  <SelectItem key={key} value={key}>
                    {product.name} - {product.weight}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
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
            <Label htmlFor="comment">Comentarios</Label>
            <Textarea
              id="comment"
              placeholder="Sabor, cantidad, etc. (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 p-4 border rounded-lg bg-primary/5">
            <Checkbox
              id="waitForDiscount"
              checked={waitForDiscount}
              onCheckedChange={(checked) => setWaitForDiscount(checked as boolean)}
            />
            <Label
              htmlFor="waitForDiscount"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              🕐 Хочу подождать до воскресенья и получить максимальную скидку
            </Label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
