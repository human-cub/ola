import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/formatting";

interface Props {
  urlSlug: string;
  name: string;
  size?: string | null;
  brandName?: string | null;
  image?: string | null;
  priceRetailDisplay?: number;
  priceT3: number;
}

export const CatalogProductCard = ({
  urlSlug,
  name,
  size,
  brandName,
  image,
  priceRetailDisplay,
  priceT3,
}: Props) => {
  return (
    <Link
      to={`/v2/p/${urlSlug}`}
      className="group bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      <div className="aspect-square bg-muted/30 p-4 flex items-center justify-center">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          width={400}
          height={400}
        />
      </div>
      <div className="p-4 space-y-1">
        {brandName && (
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">
            {brandName}
          </p>
        )}
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {name}
          {size && <span className="ml-1">{size}</span>}
        </h3>
        <div className="pt-1">
          {priceRetailDisplay && priceRetailDisplay > priceT3 ? (
            <p className="text-xs text-muted-foreground/70 line-through leading-tight">
              {formatPrice(priceRetailDisplay)}
            </p>
          ) : null}
          <p className="text-lg font-bold text-primary leading-tight">{formatPrice(priceT3)}</p>
          <p className="text-[10px] text-muted-foreground">(Súper-Precio)</p>
        </div>
      </div>
    </Link>
  );
};

export default CatalogProductCard;