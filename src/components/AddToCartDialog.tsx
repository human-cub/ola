import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { GroupIcon } from "@/components/icons/GroupIcon";
import { CartAddSuccess, GroupAddSuccess } from "@/components/AddToCartSuccess";
import { QuantityStepper } from "@/components/QuantityStepper";
import { useCart } from "@/contexts/CartContext";
import { useBrandCollection } from "@/hooks/useBrandCollection";
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
  /** Tamaño/presentación (peso, volumen, unidades) — se muestra bajo el nombre */
  productSize?: string | null;
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
  productSize = null,
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
  // selectedFlavor хранит КЛЮЧ опции: имя вкуса или FLAVORLESS_KEY («Sin sabor»)
  const [selectedFlavor, setSelectedFlavor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // Recaudación de la marca ANTES de agregar — la barra del éxito se llena
  // desde este nivel con el aporte del pedido
  const [groupSnapshot, setGroupSnapshot] = useState<{ collected: number; target: number } | null>(null);
  const { collectedRaw: brandCollected, target: brandTarget } = useBrandCollection(brandSlug);

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
        setGroupSnapshot({ collected: brandCollected, target: brandTarget });
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
    } catch (err) {
      setError("Error al agregar el producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-4 gap-3">
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
          isWaitingList ? (
            <GroupAddSuccess
              productName={productName}
              prevCollected={groupSnapshot?.collected ?? 0}
              target={groupSnapshot?.target ?? 0}
              addedAmount={pricePerUnit * quantity}
            />
          ) : (
            <CartAddSuccess
              productName={productName}
              productImage={effImage}
              flavor={selectedFlavor === FLAVORLESS_KEY ? null : selectedFlavor || null}
              size={productSize}
              quantity={quantity}
              unitPrice={pricePerUnit}
              onGoToCart={() => {
                onOpenChange(false);
                navigate("/carrito");
              }}
              onClose={() => onOpenChange(false)}
            />
          )
        ) : (
          <div className="space-y-2.5">
            {/* Product Info */}
            <div className="flex gap-3 items-center">
              {effImage && (
                <div className="w-24 h-24 bg-white rounded-md overflow-hidden shrink-0">
                  <img
                    src={effImage}
                    alt={productName}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-[1.2]">{productName}</h3>
                {productSize && (
                  <p className="text-sm text-muted-foreground mt-0.5">{productSize}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-lg font-bold leading-none ${isWaitingList ? "text-primary" : "text-foreground"}`}
                >
                  {formatPrice(pricePerUnit)}{" "}
                  <span className="text-[11px] font-normal text-muted-foreground">c/u</span>
                </p>
                {(effPrices[0]?.price ?? 0) > pricePerUnit && (
                  <p className="text-xs text-muted-foreground/70 line-through mt-1">
                    {formatPrice(effPrices[0].price)}
                  </p>
                )}
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
              <div>
                <QuantityStepper
                  quantity={quantity}
                  onMinus={() => handleQuantityChange(-1)}
                  onPlus={() => handleQuantityChange(1)}
                />
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-muted/60 rounded-xl border border-border p-2.5 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Cantidad:</span>
                <span className="font-semibold">
                  {quantity} × {formatPrice(pricePerUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Envío:</span>
                <span>{deliveryEstimate === 0 ? "Gratis" : formatPrice(deliveryEstimate)}</span>
              </div>
              <div
                className={`flex justify-between ${isWaitingList ? "text-sm font-semibold text-primary" : "font-bold text-lg"}`}
              >
                <span>{isWaitingList ? "Precio Garantizado:" : "Total:"}</span>
                <span className={isWaitingList ? undefined : "text-primary"}>
                  {formatPrice(totalPrice)}
                </span>
              </div>
              {isWaitingList && (
                <div
                  className="flex justify-between font-bold text-lg"
                  style={{ color: "hsl(var(--group-buy-accent))" }}
                >
                  <span>Súper-Precio:</span>
                  <span>
                    {formatPrice((effPrices[effPrices.length - 1]?.price ?? pricePerUnit) * quantity)}
                  </span>
                </div>
              )}
              {isWaitingList && (
                <p className="text-[11px] leading-snug text-muted-foreground">
                  * El Precio Garantizado está asegurado en todos los casos. Para alcanzar el Súper-Precio, compartí en redes sociales e invitá a tus amigos
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-0">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 rounded-2xl font-bold text-white text-[16px] flex items-center justify-center gap-2 shadow-lg bg-gradient-primary transform transition active:scale-95 disabled:opacity-60"
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
                className="w-full py-2.5 rounded-2xl font-semibold text-muted-foreground border-2 border-border bg-card hover:bg-muted transform transition active:scale-95"
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
