import { useEffect, useState, type CSSProperties } from "react";
import * as amplitude from "@amplitude/analytics-browser";
import { ShoppingCart, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAppSetting } from "@/hooks/useAppSetting";
import { formatPrice } from "@/lib/formatting";

const formatShortPrice = (n: number): string => {
  if (n === 0) return "$0";
  if (n >= 1000) {
    const k = n / 1000;
    const str = Number.isInteger(k) ? k.toString() : k.toFixed(1).replace(".", ",");
    return `$${str}k`;
  }
  return `$${n}`;
};

interface PriceData {
  people: number;
  price: number;
}

interface MayoristaPriceBlockProps {
  productName: string;
  productId: string;
  productImage?: string | null;
  flavors?: string[];
  priceData: PriceData[];
}

const DEFAULT_MIN_ORDER = 300000;

export const MayoristaPriceBlock = ({
  productName,
  productId,
  productImage = null,
  flavors = [],
  priceData = [],
}: MayoristaPriceBlockProps) => {
  const { cartItems, addToCart } = useCart();
  const { value: minOrderRaw } = useAppSetting<number>("mayorista_min_order", DEFAULT_MIN_ORDER);
  const minOrder = Number(minOrderRaw) || DEFAULT_MIN_ORDER;

  const retailPrice = priceData.length > 0 ? priceData[0].price : 0;
  const superPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : 0;

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price_per_unit * item.quantity, 0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (dialogOpen) {
      setSelectedFlavor(flavors.length === 1 ? flavors[0] : "");
      setQuantity(1);
      setSuccess(false);
      setError("");
    }
  }, [dialogOpen, flavors]);

  const totalForButton = superPrice * quantity;

  const groupBuyAccentStyle = { color: "hsl(var(--group-buy-accent))" } satisfies CSSProperties;
  const mayoristaBgStyle = { backgroundColor: "hsl(var(--mayorista))", color: "hsl(var(--mayorista-foreground))" } satisfies CSSProperties;

  // Progress: 0, minOrder/3, 2*minOrder/3, minOrder
  const progressMarkers = [0, Math.round(minOrder / 3), Math.round((minOrder * 2) / 3), minOrder];
  const visualProgress = Math.min(100, (cartTotal / minOrder) * 100);
  const remainingToMin = Math.max(0, minOrder - cartTotal);
  const reachedMin = cartTotal >= minOrder;

  const handleAdd = async () => {
    setError("");
    if (flavors.length > 0 && !selectedFlavor) {
      setError("Por favor seleccioná un sabor");
      return;
    }
    setSubmitting(true);
    try {
      await addToCart({
        product_id: productId,
        product_name: productName,
        flavor: selectedFlavor || null,
        quantity,
        price_per_unit: superPrice,
        product_image: productImage,
      });
      amplitude.track("CTA Clicked", {
        button_label: "Agregar al pedido",
        source: "mayorista_block",
        product_id: productId,
        product_name: productName,
        quantity,
        price_per_unit: superPrice,
      });
      setSuccess(true);
      setTimeout(() => setDialogOpen(false), 1200);
    } catch (err) {
      setError("Error al agregar el producto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="w-full">
        <div className="mx-auto max-w-[390px]">
          <div className="bg-card rounded-3xl shadow-floating overflow-hidden border-[3px] animate-border-pulse">
            {/* Header: Total pedido */}
            <div className="px-4 py-4 relative overflow-hidden bg-gradient-primary">
              <div className="flex items-center justify-center relative">
                <span className="text-white font-bold text-base whitespace-nowrap">
                  Total pedido: {formatPrice(cartTotal)}
                </span>
              </div>
            </div>

            {/* Price Comparison: Retail / Súper-Precio */}
            <div className="px-6 py-6 bg-card border-b border-border">
              <div className="grid grid-cols-2 gap-2 text-center items-start">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[13px] font-bold text-muted-foreground">Retail</div>
                  <div className="text-[20px] sm:text-[24px] font-bold leading-none text-muted-foreground line-through">
                    {formatPrice(retailPrice)}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[13px] font-bold" style={groupBuyAccentStyle}>
                    Súper-Precio
                  </div>
                  <div className="text-[20px] sm:text-[24px] font-bold leading-none" style={groupBuyAccentStyle}>
                    {formatPrice(superPrice)}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar Section */}
            <div className="px-6 py-8 bg-card">
              <div className="relative">
                <div className="relative h-5 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 z-10"
                    style={{
                      width: `${visualProgress}%`,
                      background:
                        "linear-gradient(90deg, hsl(36 100% 50%), hsl(var(--group-buy-accent)), hsl(48 100% 60%))",
                    }}
                  />
                  <div className="absolute top-0 left-0 w-full h-full z-20">
                    <div className="absolute top-0 w-0.5 h-full bg-white opacity-70" style={{ left: "33.33%" }} />
                    <div className="absolute top-0 w-0.5 h-full bg-white opacity-70" style={{ left: "66.67%" }} />
                  </div>
                </div>

                {/* Bottom markers: 0, min/3, 2*min/3, min — symmetric layout */}
                <div className="flex mt-3 text-[13px] font-bold text-muted-foreground">
                  {progressMarkers.map((m, i) => (
                    <span
                      key={i}
                      className={
                        "flex-1 " +
                        (i === 0
                          ? "text-left"
                          : i === progressMarkers.length - 1
                          ? "text-right"
                          : "text-center")
                      }
                    >
                      {formatShortPrice(m)}
                    </span>
                  ))}
                </div>
              </div>

              {!reachedMin && (
                <div className="mt-8 text-center">
                  <p className="text-[15px] font-semibold text-foreground">
                    Faltan{" "}
                    <span className="font-bold" style={groupBuyAccentStyle}>
                      {formatPrice(remainingToMin)}
                    </span>{" "}
                    para el pedido mínimo
                  </p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 bg-card">
              <button
                onClick={() => {
                  amplitude.track("CTA Clicked", {
                    button_label: "Agregar al pedido",
                    source: "mayorista_block_open",
                    product_id: productId,
                  });
                  setDialogOpen(true);
                }}
                className="w-full py-4 rounded-2xl font-bold text-[17px] flex items-center justify-center gap-2 shadow-lg transform transition active:scale-95 hover:opacity-90"
                style={mayoristaBgStyle}
              >
                <ShoppingCart className="w-6 h-6" />
                Agregar al pedido {formatPrice(superPrice)}
              </button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Agregar al pedido
            </DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="text-lg font-medium text-center">¡Producto agregado!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                {productImage && (
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-20 h-20 object-cover rounded-lg"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg leading-[1.15]">{productName}</h3>
                  <p className="text-muted-foreground text-sm">{formatPrice(superPrice)} c/u</p>
                </div>
              </div>

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
                      {flavors.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Cantidad</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    disabled={quantity >= 99}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Precio unitario:</span>
                  <span>{formatPrice(superPrice)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(totalForButton)}</span>
                </div>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 hover:opacity-90"
                  style={mayoristaBgStyle}
                  disabled={submitting}
                >
                  {submitting ? "Agregando..." : "Agregar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MayoristaPriceBlock;