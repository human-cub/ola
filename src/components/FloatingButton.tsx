import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as amplitude from "@amplitude/analytics-browser";
import { Clock, ShoppingCart, Timer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddToCartDialog } from "./AddToCartDialog";
import { supabase } from "@/integrations/supabase/client";
import { getLastSundayClose } from "@/lib/collectivePricing";
import { useCollectiveClock } from "@/hooks/useCollectiveClock";
import type { PriceData } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloatingButtonProps {
  productName: string;
  productId: string;
  productImage?: string | null;
  flavors?: string[];
  prices?: PriceData[];
  waitingCount?: number;
}

function getDiscountPrice(prices: PriceData[]): number | null {
  if (prices.length === 0) return null;
  return prices.length >= 5 ? prices[4].price : prices[prices.length - 1].price;
}

function getBuyNowPrice(prices: PriceData[]): number | null {
  if (prices.length === 0) return null;
  return prices.length > 1 ? prices[1].price : prices[0].price;
}

async function hasPendingConflict(
  userId: string,
  now: Date,
  nextCollectiveClose: Date | null
): Promise<boolean> {
  const fallbackLastClose = nextCollectiveClose
    ? new Date(nextCollectiveClose.getTime() - 7 * 24 * 60 * 60 * 1000)
    : getLastSundayClose(now);

  const { data, error } = await supabase
    .from("user_orders")
    .select("id, collective_close_date, created_at")
    .eq("user_id", userId)
    .eq("order_type", "collective")
    .eq("status", "pending");

  if (error || !data?.length) return false;

  const nowMs = now.getTime();
  const fallbackLastCloseMs = fallbackLastClose.getTime();

  return data.some((order) => {
    if (order.collective_close_date) {
      const closeAt = new Date(order.collective_close_date).getTime();
      if (!Number.isNaN(closeAt)) {
        return closeAt <= nowMs;
      }
    }

    const createdAt = new Date(order.created_at).getTime();
    return !Number.isNaN(createdAt) && createdAt < fallbackLastCloseMs && nowMs > fallbackLastCloseMs;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useFloatingButton(prices: PriceData[]) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isWaitingList, setIsWaitingList] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const { nextCollectiveClose, serverOffsetMs } = useCollectiveClock();

  useEffect(() => {
    const calculate = () => {
      if (!nextCollectiveClose) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }

      const diff = nextCollectiveClose.getTime() - (Date.now() + serverOffsetMs);
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculate();
    const timer = setInterval(calculate, 60000);
    return () => clearInterval(timer);
  }, [nextCollectiveClose, serverOffsetMs]);

  const handleBuyNow = () => {
    amplitude.track('Buy Now Click', { source: 'floating_button' });
    setIsWaitingList(false);
    setDialogOpen(true);
  };

  const handleWaitForDiscount = async () => {
    amplitude.track('List Joined', { list_name: productName, list_id: productId });
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && await hasPendingConflict(
      session.user.id,
      new Date(Date.now() + serverOffsetMs),
      nextCollectiveClose,
    )) {
      setConflictDialogOpen(true);
      return;
    }
    setIsWaitingList(true);
    setDialogOpen(true);
  };

  const goToWaitingList = () => {
    setConflictDialogOpen(false);
    navigate("/lista-espera");
  };

  return {
    timeLeft,
    discountPrice: getDiscountPrice(prices),
    buyNowPrice: getBuyNowPrice(prices),
    dialogOpen,
    setDialogOpen,
    isWaitingList,
    conflictDialogOpen,
    setConflictDialogOpen,
    handleBuyNow,
    handleWaitForDiscount,
    goToWaitingList,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CountdownTimer({ days, hours, minutes }: { days: number; hours: number; minutes: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-3">
      <div className="text-sm">
        <div className="flex gap-1 items-center justify-center">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mr-1" />
          <span className="font-bold">{days}d</span>
          <span>:</span>
          <span className="font-bold">{hours}h</span>
          <span>:</span>
          <span className="font-bold">{minutes}m</span>
        </div>
        <div className="text-xs opacity-90 text-center whitespace-nowrap">
          Tiempo de recolección
        </div>
      </div>
    </div>
  );
}

function WaitForDiscountButton({
  discountPrice,
  onClick,
}: {
  discountPrice: number | null;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2 flex-1 h-auto py-3 sm:py-2 w-full"
    >
      <Timer className="size-5 flex-shrink-0" />
      <span className="text-sm font-normal">
        Esperar y comprar desde{" "}
        {discountPrice && <span className="font-bold">${discountPrice.toLocaleString()}</span>}
      </span>
    </Button>
  );
}

function BuyNowButton({
  buyNowPrice,
  onClick,
}: {
  buyNowPrice: number | null;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2 flex-1 h-auto py-3 sm:py-2 w-full"
    >
      <ShoppingCart className="size-5 flex-shrink-0" />
      <span className="text-sm font-normal">
        Comprar ahora{" "}
        {buyNowPrice && <span className="font-bold">${buyNowPrice.toLocaleString()}</span>}
      </span>
    </Button>
  );
}

function ConflictDialog({
  open,
  onClose,
  onGoToWaitingList,
}: {
  open: boolean;
  onClose: () => void;
  onGoToWaitingList: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Pedido pendiente
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            Tenés un pedido de la semana pasada en tu Lista de Espera que aún no fue confirmado ni
            cancelado. Para agregar nuevos productos, primero necesitás resolver ese pedido.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onGoToWaitingList} className="w-full">
            Ir a mi Lista de Espera
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FloatingButton = ({
  productName,
  productId,
  productImage = null,
  flavors = [],
  prices = [],
  waitingCount = 0,
}: FloatingButtonProps) => {
  const {
    timeLeft,
    discountPrice,
    buyNowPrice,
    dialogOpen,
    setDialogOpen,
    isWaitingList,
    conflictDialogOpen,
    setConflictDialogOpen,
    handleBuyNow,
    handleWaitForDiscount,
    goToWaitingList,
  } = useFloatingButton(prices);

  return (
    <>
      <div className="bottom-0 left-0 right-0 z-50 md:left-auto md:top-[110px] md:bottom-auto flex-[0_1_448px]">
        <div className="bg-gradient-primary rounded-2xl px-3 py-3 sm:p-4 shadow-floating text-white max-w-md sm:max-w-md mx-auto">
          <CountdownTimer {...timeLeft} />
          <div className="flex flex-col gap-2">
            <WaitForDiscountButton discountPrice={discountPrice} onClick={handleWaitForDiscount} />
            <BuyNowButton buyNowPrice={buyNowPrice} onClick={handleBuyNow} />
          </div>
        </div>
        {/* <div className="mx-auto max-w-[calc(100%-16px)] sm:max-w-md">
        </div> */}
      </div>

      <AddToCartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        productName={productName}
        productImage={productImage}
        flavors={flavors}
        prices={prices}
        isWaitingList={isWaitingList}
        currentParticipants={waitingCount}
      />

      <ConflictDialog
        open={conflictDialogOpen}
        onClose={() => setConflictDialogOpen(false)}
        onGoToWaitingList={goToWaitingList}
      />
    </>
  );
};
