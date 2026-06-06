import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/formatting";

interface Props {
  urlSlug: string;
  name: string;
  size?: string | null;
  brandName?: string | null;
  image?: string | null;
  priceRetailDisplay?: number;
  /** Súper-Precio (t4) */
  priceSuper: number;
  /** Компактный вид (блок Otros Productos): меньше паддинги и зазор имя-цена */
  compact?: boolean;
}

export const CatalogProductCard = ({
  urlSlug,
  name,
  size,
  brandName,
  image,
  priceRetailDisplay,
  priceSuper,
  compact = false,
}: Props) => {
  return (
    <Link
      to={`/productos/${urlSlug}`}
      className={`group bg-card rounded-xl border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col ${compact ? "p-3" : "p-4"}`}
    >
      <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          width={400}
          height={400}
        />
      </div>
      <div className={`flex flex-col flex-1 ${compact ? "pt-2" : "pt-4"}`}>
        {brandName && (
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">
            {brandName}
          </p>
        )}
        <h3 className={`font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors ${compact ? "min-h-0 mb-0.5" : "min-h-[2.8em] mb-1"}`}>
          {name}
          {size && <span className="ml-1">{size}</span>}
        </h3>
        <div className={`mt-auto ${compact ? "pt-0.5" : "pt-2"}`}>
          <p className="text-xs text-muted-foreground/70 line-through leading-tight min-h-[1rem]">
            {priceRetailDisplay && priceRetailDisplay > priceSuper ? formatPrice(priceRetailDisplay) : "\u00A0"}
          </p>
          <p className={`${compact ? "text-base" : "text-lg"} font-bold text-primary leading-tight`}>{formatPrice(priceSuper)}</p>
          <p className="text-[10px] text-muted-foreground">(Súper-Precio)</p>
        </div>
      </div>
    </Link>
  );
};

export default CatalogProductCard;