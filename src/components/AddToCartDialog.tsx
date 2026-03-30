import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Copy } from "lucide-react";
import { formatPrice } from "@/lib/formatting";
import * as amplitude from "@amplitude/analytics-browser";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Plus, Minus, ShoppingCart, Timer, Check } from "lucide-react";
import { ShareIcon } from "./icons/ShareIcon";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { setPendingAddAction } from "@/lib/postAuthAction";

interface PriceData {
  people: number;
  price: number;
}

interface AddToCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productImage: string | null;
  flavors: string[];
  prices: PriceData[];
  isWaitingList: boolean;
  currentParticipants?: number;
  onWaitingListAdded?: () => Promise<void> | void;
}

export const AddToCartDialog = ({
  open,
  onOpenChange,
  productId,
  productName,
  productImage,
  flavors,
  prices,
  isWaitingList,
  currentParticipants = 0,
  onWaitingListAdded,
}: AddToCartDialogProps) => {
  const { addToCart, addToWaitingList } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFlavor(flavors.length === 1 ? flavors[0] : "");
      setQuantity(1);
      setError("");
      setSuccess(false);
    }
  }, [open, flavors]);

  // Calculate price based on quantity for waiting list
  const calculatePrice = (qty: number) => {
    if (prices.length === 0) return 0;
    
    const buyNowPrice = prices.length > 1 ? prices[1].price : prices[0].price;
    const secondTierThreshold = prices.length > 1 ? prices[1].people : 0;
    
    if (isWaitingList) {
      // For waiting list, price changes based on participants + user's quantity
      const totalParticipants = currentParticipants + qty;
      
      // Before reaching 2nd tier threshold, use 2nd tier price (buy now price)
      if (totalParticipants < secondTierThreshold) {
        return buyNowPrice;
      }
      
      // After 2nd tier, calculate based on tiers but never exceed buyNowPrice
      for (let i = prices.length - 1; i >= 0; i--) {
        if (totalParticipants >= prices[i].people) {
          return Math.min(prices[i].price, buyNowPrice);
        }
      }
      return buyNowPrice;
    } else {
      // For immediate purchase, always use second tier price
      return buyNowPrice;
    }
  };

  const pricePerUnit = calculatePrice(quantity);
  const totalPrice = pricePerUnit * quantity;

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 99) {
      setQuantity(newQty);
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    // Validate flavor selection
    if (flavors.length > 0 && !selectedFlavor) {
      setError("Por favor seleccioná un sabor");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Auth-gate: for guests, redirect to auth and perform add after login
      if (!session?.user) {
        if (isWaitingList) {
          setPendingAddAction({
            kind: "waiting_list",
            redirectTo: "/lista-espera",
            item: {
              product_id: productId,
              product_name: productName,
              flavor: selectedFlavor || null,
              quantity,
              current_price_per_unit: pricePerUnit,
              product_image: productImage,
            },
          });
        } else {
          setPendingAddAction({
            kind: "cart",
            redirectTo: "/carrito",
            item: {
              product_id: productId,
              product_name: productName,
              flavor: selectedFlavor || null,
              quantity,
              price_per_unit: pricePerUnit,
              product_image: productImage,
            },
          });
        }

        onOpenChange(false);
        navigate(`/ingresar?redirect=${encodeURIComponent(isWaitingList ? "/lista-espera" : "/carrito")}`);
        return;
      }

      if (isWaitingList) {
        await addToWaitingList({
          product_id: productId,
          product_name: productName,
          flavor: selectedFlavor || null,
          quantity,
          current_price_per_unit: pricePerUnit,
          product_image: productImage,
        });
        await onWaitingListAdded?.();
      } else {
        await addToCart({
          product_id: productId,
          product_name: productName,
          flavor: selectedFlavor || null,
          quantity,
          price_per_unit: pricePerUnit,
          product_image: productImage,
        });
      }

      amplitude.track('CTA Clicked', {
        button_label: isWaitingList ? 'Agregar a Lista de Espera' : 'Agregar al Carrito',
        product_id: productId,
        product_name: productName,
        flavor: selectedFlavor || "",
        quantity,
        price_per_unit: pricePerUnit,
        total_price: totalPrice,
      });

      setSuccess(true);
      if (!isWaitingList) {
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    } catch (err) {
      setError("Error al agregar el producto");
    } finally {
      setLoading(false);
    }
  };

  const productUrl = `https://alaola.com.ar${location.pathname}`;
  const shareText = `Mirá este producto con descuento en Ola 🎉 ${productName} — comprá ahora o esperá y pagá menos 🤑 ${productUrl}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWaitingList ? (
              <>
                <Timer className="w-5 h-5 text-primary" />
                Agregar a Lista de Espera
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 text-primary" />
                Agregar al Carrito
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-center">¡Producto agregado!</p>

            {isWaitingList && (
              <div className="w-full flex flex-col gap-2 mt-2">
                <Button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ text: shareText }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(shareText);
                      toast.success("¡Texto copiado!");
                    }
                  }}
                  className="w-full py-2.5"
                >
                  <ShareIcon className="h-4 w-4" />
                  <span>Compartir con amigos</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    amplitude.track('Whatsapp Opened', { source: 'add_to_cart_success', product_name: productName });
                    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                  }}
                  className="w-full py-2.5"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>Compartir por WhatsApp</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(shareText);
                    toast.success("¡Invitación copiada!");
                  }}
                  className="w-full py-2.5"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copiar invitación</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(productUrl);
                    toast.success("¡Enlace copiado!");
                  }}
                  className="w-full py-2.5"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copiar enlace</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Product Info */}
            <div className="flex gap-4 items-start">
              {productImage && (
                <img
                  src={productImage}
                  alt={productName}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-[1.15]">{productName}</h3>
                <p className="text-muted-foreground text-sm">
                  {formatPrice(pricePerUnit)} c/u
                </p>
              </div>
            </div>

            {/* Flavor Selection */}
            {flavors.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="flavor">
                  Sabor <span className="text-destructive">*</span>
                </Label>
                <Select value={selectedFlavor} onValueChange={setSelectedFlavor}>
                  <SelectTrigger
                    id="flavor"
                    className={error && !selectedFlavor ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Seleccioná un sabor" />
                  </SelectTrigger>
                  <SelectContent>
                    {flavors.map((flavor) => (
                      <SelectItem key={flavor} value={flavor}>
                        {flavor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 99}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isWaitingList ? "Precio unitario ahora:" : "Precio unitario:"}</span>
                <span>{formatPrice(pricePerUnit)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>{isWaitingList ? "Precio estimado:" : "Total:"}</span>
                <span className="text-primary">
                  {isWaitingList
                    ? formatPrice((prices[prices.length - 1]?.price ?? pricePerUnit) * quantity)
                    : formatPrice(totalPrice)}
                </span>
              </div>
              {isWaitingList && (
                <p className="text-xs text-muted-foreground">
                  * El precio puede variar según la cantidad de participantes al cierre
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 ml-auto mr-0"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex-1"
                disabled={loading}
              >
                {loading ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToCartDialog;
