import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { QuantityStepper } from "@/components/QuantityStepper";
import { formatPrice } from "@/lib/formatting";

interface FlavorEntry {
  id: string;
  flavor: string | null;
  quantity: number;
}

interface ProductLineItemProps {
  id: string;
  productName: string;
  productImage: string | null;
  productSize?: string | null;
  pricePerUnit: number;
  /** Precio retail (tachado) por unidad; se muestra sólo si es mayor al actual. */
  retailPerUnit?: number;
  totalQuantity: number;
  flavorEntries: FlavorEntry[];
  productLink: string;
  isCollectionEnded?: boolean;
  onQuantityChange: (id: string, delta: number, currentQty: number) => void;
  onDelete: (id: string) => void;
}

export const ProductLineItem = ({
  id,
  productName,
  productImage,
  productSize = null,
  pricePerUnit,
  retailPerUnit = 0,
  totalQuantity,
  flavorEntries,
  productLink,
  isCollectionEnded = false,
  onQuantityChange,
  onDelete,
}: ProductLineItemProps) => {
  const showRetail = retailPerUnit > pricePerUnit;
  const showUnitPrice = totalQuantity > 1;

  return (
    <div className="py-4">
      {/* Fila superior: imagen + nombre/tamaño + eliminar */}
      <div className="flex items-center gap-3">
        <Link to={productLink} className="flex-shrink-0">
          <div className="w-24 h-24 rounded-md overflow-hidden bg-white">
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
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0 rounded-md self-start"
          onClick={() => onDelete(id)}
          aria-label="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Sabores (ancho completo): nombre del sabor + su contador */}
      {flavorEntries.length > 0 && (
        <div className="mt-3 space-y-2">
          {flavorEntries.map((entry) => {
            // "Sin sabor" sólo cuando el producto tiene varias variantes (una sin sabor);
            // si el producto no tiene sabor (una sola entrada nula), no mostramos etiqueta.
            const label = entry.flavor
              ? entry.flavor
              : flavorEntries.length > 1
                ? "Sin sabor"
                : null;
            return (
              <div key={entry.id} className="flex items-center justify-between gap-3">
                {label ? (
                  <p className="text-sm text-foreground truncate min-w-0 flex-1">{label}</p>
                ) : (
                  <span className="flex-1" />
                )}
                <QuantityStepper
                  quantity={entry.quantity}
                  onMinus={() => onQuantityChange(entry.id, -1, entry.quantity)}
                  onPlus={() => onQuantityChange(entry.id, 1, entry.quantity)}
                  allowZero={flavorEntries.length > 1}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Pie (ancho completo): c/u arriba (si hay varias unidades); luego cantidad
          en la misma fila que el retail tachado y el total */}
      <div className="mt-3 pt-3 border-t">
        {showUnitPrice && (
          <div className="text-right text-xs text-muted-foreground mb-0.5">
            {formatPrice(pricePerUnit)} c/u
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {totalQuantity} {totalQuantity === 1 ? "unidad" : "unidades"}
          </span>
          <div className="text-right">
            {showRetail && (
              <span className="line-through text-muted-foreground text-sm mr-2">
                {formatPrice(retailPerUnit * totalQuantity)}
              </span>
            )}
            <span className="font-bold text-base">
              {formatPrice(pricePerUnit * totalQuantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
