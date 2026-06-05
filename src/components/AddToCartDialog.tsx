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
  const { addToCart, addToWaitingList } = useCart();
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

  // Reset state when dialog opens
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
  }, [open, flavors, preselectedFlavor, variantOptions]);


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

      // Auth-gate: for guests, redirect to auth and perform add after login
      if (!session?.user) {
        if (isWaitingList) {
          setPendingAddAction({
            kind: "waiting_list",
            redirectTo: "/lista-espera",
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
        navigate(`/ingresar?redirect=${encodeURIComponent(isWaitingList ? "/lista-espera" : "/carrito")}`);
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

  const productUrl = `https://alaola.com.ar${location.pathname}`;
  const shareText = `Mirá este producto con descuento en Ola 🎉 ${productName} — comprá ahora o esperá y pagá menos 🤑 ${productUrl}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWaitingList ? (
              <>
                <GroupIcon className="w-5 h-5 text-primary" />
                Agregar el producto
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
              {effImage && (
                <img
                  src={effImage}
                  alt={productName}
                  className="w-20 h-20 object-cover rounded-lg"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-[1.15]">{productName}</h3>
                <p className="text-muted-foreground text-sm">
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
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isWaitingList ? "Precio Garantizado:" : "Precio unitario:"}</span>
                <span>{formatPrice(pricePerUnit)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>{isWaitingList ? "Súper-Precio:" : "Total:"}</span>
                <span className="text-primary">
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
