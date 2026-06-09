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

// Фирменный оранжевый (тот же акцент, что у Súper-Precio/таймера).
const ACCENT = { color: "hsl(var(--group-buy-accent))" } as const;

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
  const hasRetail = !!priceRetailDisplay && priceRetailDisplay > priceSuper;
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
        {/* Precio arriba (Súper-Precio en naranja + retail tachado a la derecha) */}
        <div className={compact ? "mb-1.5" : "mb-2"}>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`${compact ? "text-sm md:text-base" : "text-base md:text-lg"} font-bold leading-tight`} style={ACCENT}>
              {formatPrice(priceSuper)}
            </span>
            {hasRetail && (
              <span className="text-[11px] md:text-xs text-muted-foreground/70 line-through leading-tight">
                {formatPrice(priceRetailDisplay)}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">(Súper-Precio)</p>
        </div>

        {brandName && (
          <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
            {brandName}
          </p>
        )}
        <h3
          className={`font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors ${
            compact ? "min-h-0" : "min-h-[2.6em]"
          }`}
        >
          {name}
          {size && <span className="ml-1">{size}</span>}
        </h3>
      </div>
    </Link>
  );
};

export default CatalogProductCard;
