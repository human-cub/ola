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
import { Copy, Instagram, Share2, MessageCircle, Send } from "lucide-react";
import { z } from "zod";

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
      // Номер участника = waiting_for_discount_count + virtual_orders_count
      const currentTotal = (product.waiting_for_discount_count || 0) + (product.virtual_orders_count || 0);
      setOrderNumber(currentTotal);
      
      // Calculate people until next discount (thresholds: 25, 50, 75, 100)
      const thresholds = [25, 50, 75, 100];
      const nextThreshold = thresholds.find(t => t > currentTotal) || 100;
      setPeopleUntilNextDiscount(nextThreshold - currentTotal);
      
      // Get max price at 100 people
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
      // Validate input
      const validated = orderSchema.parse({
        firstName,
        lastName: lastName || undefined,
        phone,
        comment: comment || undefined,
      });
      
      // Get product from database to get the ID
      const { data: dbProduct, error: productError } = await supabase
        .from("products")
        .select("id")
        .eq("name", productName)
        .maybeSingle();

      if (productError) throw productError;

      const orderData = {
        product_id: dbProduct?.id || null,
        product_name: productName,
        customer_name: [validated.firstName, validated.lastName].filter(Boolean).join(" "),
        phone: validated.phone,
        comment: validated.comment || null,
        waiting_for_discount: waitForDiscount,
      };

      // Insert without .select() because anon role doesn't have SELECT permission
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

      // Reset form and close order dialog
      setFirstName("");
      setLastName("");
      setPhone("");
      setComment("");
      onOpenChange(false);
      
      // Fetch order number if waiting for discount
      if (waitForDiscount) {
        await fetchOrderNumber();
      }
      
      // Show success dialog
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


  const copyProductLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast.success("¡Enlace copiado!");
  };

  const getShareText = () => {
    if (waitForDiscount) {
      const currentUrl = window.location.href;
      return `Che! Mirá esto - compra colectiva de ${productName} 🎉 Seamos más, pagamos menos. Elegí 'Esperar y pagar menos', sumate e invitá amigos!! ${currentUrl}`;
    } else {
      return `Che! Mirá esto - descuentos increíbles de suplementos 🎉 Podés comprar al precio actual o esperar y pagar menos 🤑 https://ola.lovable.app/`;
    }
  };

  const handleNativeShare = async () => {
    const text = getShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          text: text,
        });
        toast.success("¡Compartido exitosamente!");
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error("Error al compartir");
        }
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("¡Texto copiado al portapapeles!");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTelegramShare = () => {
    const url = waitForDiscount ? window.location.href : 'https://ola.lovable.app/';
    const text = waitForDiscount 
      ? `Che! Mirá esto - compra colectiva de ${productName} 🎉 Seamos más, pagamos menos. Elegí 'Esperar y pagar menos', sumate e invitá amigos!!`
      : `Che! Mirá esto - descuentos increíbles de suplementos 🎉 Podés comprar al precio actual o esperar y pagar menos 🤑`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyInvitation = () => {
    const text = getShareText();
    navigator.clipboard.writeText(text);
    toast.success("¡Invitación copiada!");
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
            <Label htmlFor="firstName">Имя *</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="placeholder:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Фамилия</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Фамилия (необязательно)"
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

      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl">
              ¡Listo! 🎉
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base pt-1">
              <div className="space-y-2">
                <div>
                  Tus datos fueron enviados. Te contactaremos pronto.
                </div>
                {waitForDiscount && (
                  <>
                    <div className="text-2xl font-bold text-primary">
                      Sos participante #{orderNumber}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">
                        👥 Faltan {peopleUntilNextDiscount} personas para siguiente descuento
                      </div>
                      <div className="text-muted-foreground">
                        Descuento máximo: {maxPrice} con 100 participantes
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex flex-col gap-2 pt-2">
            <div className="text-sm font-semibold text-center">
              Invitá a tus amigos
            </div>
            
            <Button
              onClick={handleNativeShare}
              variant="default"
              className="w-full gap-2"
            >
              <Share2 className="h-4 w-4" />
              Compartir con amigos
            </Button>
            
            <div className="grid grid-cols-[0.8fr_1.4fr_0.8fr] gap-2">
              <Button
                onClick={handleWhatsAppShare}
                variant="outline"
                className="gap-1 text-[10px] px-1.5"
              >
                <MessageCircle className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">WhatsApp</span>
              </Button>
              
              <Button
                onClick={copyInvitation}
                variant="outline"
                className="gap-1 text-[11px] px-2"
              >
                <Copy className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Copiar invitación</span>
              </Button>
              
              <Button
                onClick={copyProductLink}
                variant="outline"
                className="gap-1 text-[10px] px-1.5"
              >
                <Copy className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Copiar enlace</span>
              </Button>
            </div>
            
            <div className="border-t pt-2 mt-1" />
            
            <div className="relative w-full p-[2px] rounded-md bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]">
              <Button
                asChild
                variant="outline"
                className="w-full gap-2 bg-background border-0 hover:bg-accent"
              >
                <a 
                  href="https://www.instagram.com/ola.unity/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Instagram 
                    className="h-4 w-4" 
                    style={{
                      stroke: 'url(#instagram-gradient)',
                      fill: 'none'
                    }}
                  />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f09433" />
                        <stop offset="25%" stopColor="#e6683c" />
                        <stop offset="50%" stopColor="#dc2743" />
                        <stop offset="75%" stopColor="#cc2366" />
                        <stop offset="100%" stopColor="#bc1888" />
                      </linearGradient>
                    </defs>
                  </svg>
                  Seguinos en Instagram
                </a>
              </Button>
            </div>
            
            <div className="text-xs text-center text-muted-foreground -mt-1">
              para ofertas, descuentos y novedades
            </div>
            
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
