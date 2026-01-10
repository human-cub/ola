import { useState, useEffect } from "react";
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
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

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
}: AddToCartDialogProps) => {
  const { addToCart, addToWaitingList } = useCart();
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
    
    if (isWaitingList) {
      // For waiting list, price changes based on participants + user's quantity
      const totalParticipants = currentParticipants + qty;
      for (let i = prices.length - 1; i >= 0; i--) {
        if (totalParticipants >= prices[i].people) {
          return prices[i].price;
        }
      }
      return prices[0].price;
    } else {
      // For immediate purchase, use current price
      for (let i = prices.length - 1; i >= 0; i--) {
        if (currentParticipants >= prices[i].people) {
          return prices[i].price;
        }
      }
      return prices[0].price;
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
      if (isWaitingList) {
        await addToWaitingList({
          product_id: productId,
          product_name: productName,
          flavor: selectedFlavor || null,
          quantity,
          current_price_per_unit: pricePerUnit,
          product_image: productImage,
        });
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

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError("Error al agregar el producto");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-AR')}`;
  };

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
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-center">¡Producto agregado!</p>
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
                <h3 className="font-semibold text-lg">{productName}</h3>
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
                <span>Precio unitario:</span>
                <span>{formatPrice(pricePerUnit)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatPrice(totalPrice)}</span>
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
                className="flex-1"
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
