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
import { Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { GroupIcon } from "@/components/icons/GroupIcon";
import { ShareIcon } from "./icons/ShareIcon";
import { WhatsAppIcon } from "./icons/WhatsAppIcon";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useDeliveryEstimate } from "@/hooks/useDeliveryEstimate";
import { supabase } from "@/integrations/supabase/client";
import { setPendingAddAction } from "@/lib/postAuthAction";

interface PriceData {
  people: number;
  price: number;
}

// Вариант (вкус) товара v2: смена вкуса в попапе подменяет productId/фото/цены
export interface DialogVariantOption {
  productId: string;
  flavor: string | null;
  image: string | null;
  prices: PriceData[];
}

// Ключ-сентинел для варианта без вкуса (рендерится как «Sin sabor»)
const FLAVORLESS_KEY = "__sin_sabor__";

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
  preselectedFlavor?: string | null;
  brandSlug?: string | null;
  productLink?: string | null;
  isBrandGoalReached?: boolean;
  /** Варианты по вкусам (v2): позволяет менять вкус прямо в попапе */
  variantOptions?: DialogVariantOption[];
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
  preselectedFlavor = null,
  brandSlug = null,
  productLink = null,
  isBrandGoalReached = false,
  variantOptions,
}: AddToCartDialogProps) => {
  const { addToCart, addToWaitingList, cartItems, waitingListItems } = useCart();
  const { costFor } = useDeliveryEstimate();
  const navigate = useNavigate();
  const location = useLocation();
  // selectedFlavor хранит КЛЮЧ опции: имя вкуса или FLAVORLESS_KEY («Sin sabor»)
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const flavorOptions = variantOptions
    ? variantOptions.map((v) => ({
        key: v.flavor ?? FLAVORLESS_KEY,
        label: v.flavor ?? "Sin sabor",
      }))
    : flavors.map((f) => ({ key: f, label: f }));
  // В v2 (variantOptions) предвыбор есть всегда — null значит «Sin sabor»
  const hasPreselect = variantOptions ? true : preselectedFlavor != null;

  // Reset state ONLY on open transition. Depending on flavors/variantOptions
  // references here caused a nasty bug: any parent re-render that recreated
  // those arrays (e.g. the optimistic collecta-delta right after adding to a
  // group) reset the dialog mid-flight and wiped the success/share screen.
  useEffect(() => {
    if (open) {
      if (variantOptions) {
        setSelectedFlavor(preselectedFlavor ?? FLAVORLESS_KEY);
      } else {
        setSelectedFlavor(
          preselectedFlavor ?? (flavors.length === 1 ? flavors[0] : ""),
        );
      }
      setQuantity(1);
      setError("");
      setSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);


  // Calculate price based on quantity for waiting list
  const calculatePrice = (qty: number) => {
    void qty;
    const list = (variantOptions?.find((v) => (v.flavor ?? FLAVORLESS_KEY) === selectedFlavor)?.prices) ?? prices;
    if (list.length === 0) return 0;

    const buyNowPrice = list.length > 1 ? list[1].price : list[0].price;

    if (isWaitingList) {
      return isBrandGoalReached
        ? (list[3]?.price ?? list[list.length - 1]?.price ?? buyNowPrice)
        : (list[2]?.price ?? buyNowPrice);
    } else {
      return buyNowPrice;
    }
  };

  // Активный вариант по выбранному вкусу (v2): подменяет id/фото/цены
  const activeVariant =
    variantOptions?.find((v) => (v.flavor ?? FLAVORLESS_KEY) === selectedFlavor) ?? null;
  const effProductId = activeVariant?.productId ?? productId;
  const effImage = activeVariant?.image ?? productImage;
  const effPrices = activeVariant?.prices ?? prices;

  const pricePerUnit = calculatePrice(quantity);
  const totalPrice = pricePerUnit * quantity;

  // Оценка доставки: Gratis по умолчанию; адрес платной зоны в кабинете —
  // её тариф (порог бесплатной доставки считается от суммы списка + этого товара)
  const baseSubtotal = isWaitingList
    ? waitingListItems.reduce((s, i) => s + i.current_price_per_unit * i.quantity, 0)
    : cartItems.reduce((s, i) => s + i.price_per_unit * i.quantity, 0);
  const deliveryEstimate = costFor(baseSubtotal + totalPrice);

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 99) {
      setQuantity(newQty);
    }
  };

  const handleSubmit = async () => {
    setError("");

    // Validate flavor selection
    if (flavorOptions.length > 0 && !selectedFlavor) {
      setError("Por favor seleccioná un sabor");
      return;
    }
    const flavorValue = selectedFlavor === FLAVORLESS_KEY ? null : (selectedFlavor || null);

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Auth-gate: only group/waiting-list joins require auth up front.
      // Retail "Comprar ahora" lets guests add to the session cart and check out later.
      if (!session?.user && isWaitingList) {
        if (isWaitingList) {
          setPendingAddAction({
            kind: "waiting_list",
            redirectTo: "/mis-grupos",
            item: {
              product_id: effProductId,
              product_name: productName,
              flavor: flavorValue,
              quantity,
              current_price_per_unit: pricePerUnit,
              product_image: effImage,
              brand_slug: brandSlug,
              retail_price_per_unit: effPrices[0]?.price ?? null,
              guaranteed_price_per_unit: effPrices[2]?.price ?? pricePerUnit,
              super_price_per_unit: effPrices[3]?.price ?? effPrices[effPrices.length - 1]?.price ?? null,
              product_link: productLink,
            },
          });
        } else {
          setPendingAddAction({
            kind: "cart",
            redirectTo: "/carrito",
            item: {
              product_id: effProductId,
              product_name: productName,
              flavor: flavorValue,
              quantity,
              price_per_unit: pricePerUnit,
              product_image: effImage,
              product_link: productLink,
            },
          });
        }

        onOpenChange(false);
        navigate(`/ingresar?redirect=${encodeURIComponent(isWaitingList ? "/mis-grupos" : "/carrito")}`);
        return;
      }

      if (isWaitingList) {
        await addToWaitingList({
          product_id: effProductId,
          product_name: productName,
          flavor: flavorValue,
          quantity,
          current_price_per_unit: pricePerUnit,
          product_image: effImage,
          brand_slug: brandSlug,
          retail_price_per_unit: effPrices[0]?.price ?? null,
          guaranteed_price_per_unit: effPrices[2]?.price ?? pricePerUnit,
          super_price_per_unit: effPrices[3]?.price ?? effPrices[effPrices.length - 1]?.price ?? null,
          product_link: productLink,
        });
        await onWaitingListAdded?.();
      } else {
        await addToCart({
          product_id: effProductId,
          product_name: productName,
          flavor: flavorValue,
          quantity,
          price_per_unit: pricePerUnit,
          product_image: effImage,
          product_link: productLink,
        });
      }

      amplitude.track('CTA Clicked', {
        button_label: isWaitingList ? 'Agregar el producto' : 'Agregar al Carrito',
        product_id: effProductId,
        product_name: productName,
        flavor: flavorValue ?? "",
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

  const productUrl = productLink ?? `https://alaola.com.ar${location.pathname}`;
  const shareText = `Mirá este producto con descuento en Ola 🎉 ${productName} — comprá ahora o esperá y pagá menos 🤑 ${productUrl}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            {isWaitingList ? (
              <>
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: "hsl(var(--group-buy-accent))" }}
                >
                  <GroupIcon className="w-6 h-6" />
                </span>
                Compra Grupal
              </>
            ) : (
              <>
                <span className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </span>
                Compra Inmediata
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-4 gap-3">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-bold text-center">
              {isWaitingList ? "¡Ya estás en el grupo!" : "¡Producto agregado!"}
            </p>
            {isWaitingList && (
              <p className="text-sm text-muted-foreground text-center -mt-1">
                Tu Precio Garantizado quedó asegurado.
              </p>
            )}

            {isWaitingList && (
              <div className="w-full bg-gradient-primary/10 rounded-xl p-4 border border-primary/20 mt-1">
                <p className="text-sm font-semibold text-primary text-center mb-1">
                  ¡Seamos más pagamos menos!
                </p>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Compartí con tus amigos para llegar al Súper-Precio.
                </p>
                <div className="flex flex-col gap-2">
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
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Product Info */}
            <div className="flex gap-4 items-center">
              {effImage && (
                <div className="w-20 h-20 bg-slate-50 rounded-xl border border-border overflow-hidden shrink-0">
                  <img
                    src={effImage}
                    alt={productName}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-base leading-[1.2]">{productName}</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {formatPrice(pricePerUnit)} c/u
                </p>
              </div>
            </div>

            {/* Flavor Selection: предвыбран вкус со страницы, но можно поменять */}
            {flavorOptions.length > 0 && (flavorOptions.length > 1 || !hasPreselect) && (
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
                    {flavorOptions.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key}>
                        {opt.label}
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
            <div className="bg-muted/60 rounded-xl border border-border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isWaitingList ? "font-semibold text-primary" : ""}>
                  {isWaitingList ? "Precio Garantizado:" : "Precio unitario:"}
                </span>
                <span className={isWaitingList ? "font-semibold text-primary" : ""}>
                  {formatPrice(pricePerUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envío:</span>
                <span>{deliveryEstimate === 0 ? "Gratis" : formatPrice(deliveryEstimate)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span style={isWaitingList ? { color: "hsl(var(--group-buy-accent))" } : undefined}>
                  {isWaitingList ? "Súper-Precio:" : "Total:"}
                </span>
                <span
                  className={isWaitingList ? undefined : "text-primary"}
                  style={isWaitingList ? { color: "hsl(var(--group-buy-accent))" } : undefined}
                >
                  {isWaitingList
                    ? formatPrice((effPrices[effPrices.length - 1]?.price ?? pricePerUnit) * quantity)
                    : formatPrice(totalPrice)}
                </span>
              </div>
              {isWaitingList && (
                <p className="text-xs text-muted-foreground">
                  * El Precio Garantizado está asegurado en todos los casos. Para alcanzar el Súper-Precio, compartí en redes sociales e invitá a tus amigos
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-[16px] flex items-center justify-center gap-2 shadow-lg bg-gradient-primary transform transition active:scale-95 disabled:opacity-60"
              >
                {isWaitingList ? <GroupIcon className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                {loading
                  ? "Agregando..."
                  : isWaitingList
                    ? "Sumate al grupo"
                    : "Agregar al carrito"}
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full py-3 rounded-2xl font-semibold text-muted-foreground border-2 border-border bg-card hover:bg-muted transform transition active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToCartDialog;
