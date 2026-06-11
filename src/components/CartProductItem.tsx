import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/QuantityStepper";
import { formatPrice } from "@/lib/formatting";

interface CartProductItemProps {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  productSize?: string | null;
  pricePerUnit: number;
  /** Precio retail (tachado) por unidad; se muestra sólo si es mayor al actual. */
  retailPerUnit?: number;
  quantity: number;
  flavor?: string | null;
  flavors: string[];
  productLink: string;
  onQuantityChange: (id: string, delta: number, currentQty: number) => void;
  onFlavorChange: (id: string, flavor: string) => void;
  onDelete: (id: string) => void;
}

export const CartProductItem = ({
  id,
  productId,
  productName,
  productImage,
  productSize = null,
  pricePerUnit,
  retailPerUnit = 0,
  quantity,
  flavor,
  flavors,
  productLink,
  onQuantityChange,
  onFlavorChange,
  onDelete,
}: CartProductItemProps) => {
  const showRetail = retailPerUnit > pricePerUnit;
  return (
    <div className="py-4">
      {/* Fila superior: imagen + nombre/tamaño + eliminar */}
      <div className="flex items-center gap-3">
        <Link to={productLink} className="flex-shrink-0">
          <div className="w-24 h-24 rounded-md overflow-hidden bg-muted">
            {productImage && (
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-contain"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        </Link>

        <Link to={productLink} className="hover:underline flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-snug line-clamp-2">
            {productName}
          </h3>
          {productSize && (
            <p className="text-sm text-muted-foreground mt-0.5">{productSize}</p>
          )}
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 h-8 w-8 rounded-md self-start"
          onClick={() => onDelete(id)}
          aria-label="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Selector de sabor (si aplica) */}
      {flavors.length > 0 && (
        <div className="mt-3">
          <Select value={flavor || ""} onValueChange={(value) => onFlavorChange(id, value)}>
            <SelectTrigger className="h-8 text-sm w-full max-w-[220px]">
              <SelectValue placeholder="Seleccionar sabor" />
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

      {/* Pie: contador (izq) + precio (c/u arriba si qty>1; retail tachado + total) */}
      <div className="mt-3 pt-3 border-t">
        {quantity > 1 && (
          <div className="text-right text-xs text-muted-foreground mb-0.5">
            {formatPrice(pricePerUnit)} c/u
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <QuantityStepper
            quantity={quantity}
            onMinus={() => onQuantityChange(id, -1, quantity)}
            onPlus={() => onQuantityChange(id, 1, quantity)}
          />
          <div className="text-right">
            {showRetail && (
              <span className="line-through text-muted-foreground text-sm mr-2">
                {formatPrice(retailPerUnit * quantity)}
              </span>
            )}
            <span className="font-bold text-base">
              {formatPrice(pricePerUnit * quantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
