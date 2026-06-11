import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/formatting";

interface FlavorEntry {
  id: string;
  flavor: string | null;
  quantity: number;
}

interface WaitingListProductItemProps {
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

export const WaitingListProductItem = ({
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
}: WaitingListProductItemProps) => {
  const showRetail = retailPerUnit > pricePerUnit;
  return (
    <div className="flex gap-3 py-4">
      {/* Imagen cuadrada fija (más grande) */}
      <Link to={productLink} className="flex-shrink-0">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
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

      {/* Contenido */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Nombre + tamaño + eliminar */}
        <div className="flex justify-between items-start gap-2">
          <Link to={productLink} className="hover:underline flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {productName}
            </h3>
            {productSize && (
              <p className="text-xs text-muted-foreground mt-0.5">{productSize}</p>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 flex-shrink-0"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Sabores con su contador */}
        {flavorEntries.length > 0 && (
          <div className="mt-2 space-y-2">
            {flavorEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground truncate">
                  {entry.flavor || "Sin sabor"}
                </p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onQuantityChange(entry.id, -1, entry.quantity)}
                    disabled={entry.quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center font-medium text-sm">
                    {entry.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onQuantityChange(entry.id, 1, entry.quantity)}
                    disabled={entry.quantity >= 99}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pie: total de unidades + precio (retail tachado + actual c/u + total) */}
        <div className="mt-3 pt-2.5 border-t flex items-end justify-between gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {totalQuantity} {totalQuantity === 1 ? "unidad" : "unidades"}
          </span>
          <div className="text-right">
            <p className="text-xs whitespace-nowrap">
              {showRetail && (
                <span className="line-through text-muted-foreground mr-1.5">
                  {formatPrice(retailPerUnit)}
                </span>
              )}
              <span className="text-muted-foreground">{formatPrice(pricePerUnit)} c/u</span>
            </p>
            <p className="font-semibold text-sm">
              {formatPrice(pricePerUnit * totalQuantity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
