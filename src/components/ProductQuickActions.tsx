import { useMemo, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import * as amplitude from "@amplitude/analytics-browser";
import { ShoppingCart } from "lucide-react";
import { GroupIcon } from "@/components/icons/GroupIcon";
import { AddToCartDialog } from "@/components/AddToCartDialog";
import { ContactGateDialog } from "@/components/ContactGateDialog";
import { ConflictDialog, hasPendingConflict } from "@/components/GroupBuyPriceBlock";
import { usePriceCurtain } from "@/hooks/usePriceCurtain";
import { useBrandCollection } from "@/hooks/useBrandCollection";
import {
  buildLegacyPriceTiers,
  type CatalogProduct,
} from "@/hooks/useCatalogProducts";
import { supabase } from "@/integrations/supabase/client";
import { fetchCollectiveClock } from "@/lib/serverClock";

// Botones rápidos sobre la foto de la tarjeta de catálogo: carrito (Comprar
// ahora) y grupo (Sumate al grupo). Abren el mismo AddToCartDialog que la
// página de producto, sin navegar. Los diálogos se montan recién al primer
// click para no encarecer las grillas largas.
export const ProductQuickActions = ({ product }: { product: CatalogProduct }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isWaitingList, setIsWaitingList] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const { curtained } = usePriceCurtain();
  const { goalReached } = useBrandCollection(product.brandSlug);
  const navigate = useNavigate();

  // Стабильные ссылки: новый массив на каждый рендер заставлял попап
  // сбрасывать состояние (см. reset-эффект в AddToCartDialog).
  const variantOptions = useMemo(
    () =>
      product.variants.map((v) => ({
        productId: v.productId,
        flavor: v.flavor,
        image: v.images[0] ?? product.images[0] ?? null,
        prices: buildLegacyPriceTiers(v),
      })),
    [product],
  );

  const first = product.variants[0];
  if (!first) return null;

  // La tarjeta entera es un <Link>: cortar la navegación en los botones.
  const stop = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onCart = (e: MouseEvent) => {
    stop(e);
    amplitude.track("CTA Clicked", { button_label: "Comprar ahora", source: "catalog_card" });
    setIsWaitingList(false);
    setDialogOpen(true);
  };

  const onGroup = async (e: MouseEvent) => {
    stop(e);
    if (curtained) {
      setContactOpen(true);
      return;
    }
    amplitude.track("List Joined", {
      list_name: product.name,
      list_id: first.productId,
      source: "catalog_card",
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      let now = new Date();
      let nextClose: Date | null = null;
      try {
        const clock = await fetchCollectiveClock();
        now = clock.serverNow;
        nextClose = clock.nextCollectiveClose;
      } catch {
        // sin reloj de servidor: hasPendingConflict usa el fallback local
      }
      if (await hasPendingConflict(session.user.id, now, nextClose)) {
        setConflictOpen(true);
        return;
      }
    }
    setIsWaitingList(true);
    setDialogOpen(true);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Comprar ahora"
        title="Comprar ahora"
        onClick={onCart}
        className="absolute bottom-2 left-2 z-10 w-9 h-9 rounded-full bg-card/95 border border-border shadow-md flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition"
      >
        <ShoppingCart className="w-[18px] h-[18px]" />
      </button>
      <button
        type="button"
        aria-label="Sumate al grupo"
        title="Sumate al grupo"
        onClick={onGroup}
        className="absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full bg-gradient-primary shadow-md flex items-center justify-center text-white hover:opacity-90 active:scale-95 transition"
      >
        <GroupIcon className="w-5 h-5" />
      </button>

      {/* Los portales de Radix se renderizan en <body>, pero los eventos sintéticos
          suben por el árbol de React hasta el <Link> de la tarjeta — sin esta
          envoltura un click en "Cancelar" navegaba a la página del producto. */}
      <span className="contents" onClick={stop}>
      {dialogOpen && (
        <AddToCartDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          productId={first.productId}
          productName={product.name}
          productImage={first.images[0] ?? product.images[0] ?? null}
          productSize={product.size}
          flavors={[]}
          prices={buildLegacyPriceTiers(first)}
          isWaitingList={isWaitingList}
          brandSlug={product.brandSlug}
          productLink={`https://alaola.com.ar/productos/${product.urlSlug}`}
          isBrandGoalReached={goalReached}
          preselectedFlavor={first.flavor}
          variantOptions={variantOptions}
        />
      )}
      {contactOpen && (
        <ContactGateDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          productName={product.name}
        />
      )}
      {conflictOpen && (
        <ConflictDialog
          open={conflictOpen}
          onClose={() => setConflictOpen(false)}
          onGoToWaitingList={() => {
            setConflictOpen(false);
            navigate("/mis-grupos");
          }}
        />
      )}
      </span>
    </>
  );
};

export default ProductQuickActions;
