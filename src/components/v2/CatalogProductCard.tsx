import { Link } from "react-router-dom";
import { formatPrice } from "@/lib/formatting";
import { usePriceCurtain } from "@/hooks/usePriceCurtain";
import { Lock } from "lucide-react";
import { ProductQuickActions } from "@/components/ProductQuickActions";
import type { CatalogProduct } from "@/hooks/useCatalogProducts";

interface Props {
  urlSlug: string;
  name: string;
  size?: string | null;
  brandName?: string | null;
  image?: string | null;
  priceRetailDisplay?: number;
  /** Súper-Precio (t4) */
  priceSuper: number;
  /** Comprar ahora (t1) — shown instead of Súper when the curtain hides group prices */
  priceBuyNow?: number;
  /** Компактный вид (блок Otros Productos): меньше паддинги и зазор имя-цена */
  compact?: boolean;
  /** Полный продукт: включает кнопки быстрого добавления (корзина/grupo) на фото */
  product?: CatalogProduct;
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
  priceBuyNow,
  compact = false,
  product,
}: Props) => {
  const { curtained } = usePriceCurtain();
  const showCurtain = curtained && !!priceBuyNow && priceBuyNow > 0;
  const sizeCls = compact ? "text-sm md:text-base" : "text-base md:text-lg";
  const hasRetailSuper = !!priceRetailDisplay && priceRetailDisplay > priceSuper;
  const hasRetailBuyNow = !!priceRetailDisplay && !!priceBuyNow && priceRetailDisplay > priceBuyNow;
  return (
    <Link
      to={`/productos/${urlSlug}`}
      className={`group bg-card rounded-xl border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col ${compact ? "p-3" : "p-4"}`}
    >
      <div className="relative aspect-square bg-slate-50 rounded-xl overflow-hidden">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          width={400}
          height={400}
        />
        {product && <ProductQuickActions product={product} />}
      </div>
      <div className={`flex flex-col flex-1 ${compact ? "pt-2" : "pt-4"}`}>
        {/* Precio arriba (Súper-Precio en naranja + retail tachado a la derecha) */}
        <div className={compact ? "mb-1.5" : "mb-2"}>
          {showCurtain ? (
            <>
              {/* Súper-Precio: visible pero difuminado (naranja) — el gancho para registrarse */}
              <div className="flex items-center gap-1.5">
                <span className={`${sizeCls} font-bold leading-tight blur-[6px] select-none`} style={ACCENT} aria-hidden>
                  {formatPrice(priceSuper)}
                </span>
                <Lock className="w-3 h-3 flex-shrink-0" style={ACCENT} />
              </div>
              <p className="text-[10px] leading-tight font-semibold" style={ACCENT}>(Súper-Precio)</p>
              {/* Comprar ahora: legible, en negro */}
              <div className="flex items-baseline gap-1.5 flex-wrap mt-1.5">
                <span className={`${sizeCls} font-bold leading-tight text-foreground`}>
                  {formatPrice(priceBuyNow as number)}
                </span>
                {hasRetailBuyNow && (
                  <span className="text-[11px] md:text-xs text-muted-foreground/70 line-through leading-tight">
                    {formatPrice(priceRetailDisplay)}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={`${sizeCls} font-bold leading-tight`} style={ACCENT}>
                  {formatPrice(priceSuper)}
                </span>
                {hasRetailSuper && (
                  <span className="text-[11px] md:text-xs text-muted-foreground/70 line-through leading-tight">
                    {formatPrice(priceRetailDisplay)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">(Súper-Precio)</p>
            </>
          )}
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
