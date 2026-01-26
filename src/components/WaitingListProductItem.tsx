import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Trash2, Share2 } from "lucide-react";

interface WaitingListProductItemProps {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  pricePerUnit: number;
  quantity: number;
  flavor?: string | null;
  flavors: string[];
  productLink: string;
  participantCount: number;
  nextThreshold: { people: number; price: number } | null;
  isCollectionEnded?: boolean;
  onQuantityChange: (id: string, delta: number, currentQty: number) => void;
  onFlavorChange: (id: string, flavor: string) => void;
  onDelete: (id: string) => void;
  onShare: () => void;
  formatPrice: (price: number) => string;
}

export const WaitingListProductItem = ({
  id,
  productId,
  productName,
  productImage,
  pricePerUnit,
  quantity,
  flavor,
  flavors,
  productLink,
  participantCount,
  nextThreshold,
  isCollectionEnded = false,
  onQuantityChange,
  onFlavorChange,
  onDelete,
  onShare,
  formatPrice,
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
            {!isCollectionEnded && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            )}
          </div>
        </div>

        {/* Row 2: Participant indicator */}
        <div className="flex flex-wrap items-center gap-1 mb-1">
          <span className="text-xs font-medium text-primary">
            {participantCount}/100
          </span>
          {nextThreshold && nextThreshold.people > participantCount && (
            <span className="text-xs text-muted-foreground">
              · Faltan {nextThreshold.people - participantCount} para {formatPrice(nextThreshold.price)}
            </span>
          )}
        </div>

        {/* Row 3: Flavor selector if available */}
        {flavors.length > 0 && (
          <Select
            value={flavor || ""}
            onValueChange={(value) => onFlavorChange(id, value)}
          >
            <SelectTrigger className="w-full h-7 text-xs mb-2">
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
        )}

        {/* Row 4: Quantity controls and price - always at bottom */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onQuantityChange(id, -1, quantity)}
              disabled={quantity <= 1 || isCollectionEnded}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-6 text-center font-medium text-sm">
              {quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => onQuantityChange(id, 1, quantity)}
              disabled={quantity >= 99 || isCollectionEnded}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatPrice(pricePerUnit)} c/u
            </p>
            <p className="font-semibold text-sm">
              {formatPrice(pricePerUnit * quantity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
