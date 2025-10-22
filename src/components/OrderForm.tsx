import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { products } from "@/data/products";

const OrderForm = () => {
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
        customer_name: customerName,
        phone: phone,
        comment: comment || null,
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
            ...orderData,
            created_at: data.created_at,
          },
        });
      } catch (notifyError) {
        console.error("Error sending notification:", notifyError);
      }

      toast.success("¡Orden enviada exitosamente!");
      
      // Reset form
      setSelectedProduct("");
      setCustomerName("");
      setPhone("");
      setComment("");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar la orden");
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
