import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, Share2 } from "lucide-react";
import { formatPrice } from "@/lib/formatting";
import { useBrandProgress } from "@/components/BrandProgressBar";

interface FlavorEntry {
  id: string;
  flavor: string | null;
  quantity: number;
}

interface WaitingListProductItemProps {
  id: string;
  productName: string;
  productImage: string | null;
  pricePerUnit: number;
  totalQuantity: number;
  flavorEntries: FlavorEntry[];
  productLink: string;
  brandSlug: string | null;
  isCollectionEnded?: boolean;
  onQuantityChange: (id: string, delta: number, currentQty: number) => void;
  onDelete: (id: string) => void;
  onShare: () => void;
}

const BrandCollectiveRow = ({ brandSlug }: { brandSlug: string | null }) => {
  const { collected, target, pct, reached } = useBrandProgress(brandSlug ?? "");
  if (!brandSlug || target <= 0) return null;
  return (
    <div className="mb-1">
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, hsl(36 100% 50%), hsl(var(--group-buy-accent)), hsl(48 100% 60%))",
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {reached ? (
          <span className="font-semibold text-primary">¡Meta alcanzada! Súper-Precio activo</span>
        ) : (
          <>
            Faltan <span className="font-semibold text-primary">{formatPrice(target - collected)}</span> para Súper-Precio
          </>
        )}
      </p>
    </div>
  );
};

export const WaitingListProductItem = ({
  id,
  productName,
  productImage,
  pricePerUnit,
  totalQuantity,
  flavorEntries,
  productLink,
  brandSlug,
  isCollectionEnded = false,
  onQuantityChange,
  onDelete,
  onShare,
}: WaitingListProductItemProps) => {
  return (
    <div className="flex gap-3 py-4">
      {/* Fixed square image container */}
      <Link to={productLink} className="flex-shrink-0">
        {productImage && (
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
            <img
              src={productImage}
              alt={productName}
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Row 1: Name and action buttons */}
        <div className="flex justify-between items-start gap-2 mb-1">
          <Link to={productLink} className="hover:underline flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {productName}
            </h3>
          </Link>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Row 2: Brand collective progress (money-based model) */}
        <BrandCollectiveRow brandSlug={brandSlug} />

        {/* Row 3: Plain-text flavor list with per-flavor quantity controls */}
        {flavorEntries.length > 0 && (
          <div className="my-3 space-y-1.5 w-fit">
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

        {/* Row 4: Group total and price */}
        <div className="flex items-center justify-between mt-auto">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {totalQuantity} {totalQuantity === 1 ? "unidad" : "unidades"}
          </p>

          <div className="text-right">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatPrice(pricePerUnit)} c/u
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
