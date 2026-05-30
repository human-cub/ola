import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import * as amplitude from "@amplitude/analytics-browser";
import { Users, Sparkles, Timer, AlertTriangle } from "lucide-react";
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

interface PriceData {
  people: number;
  price: number;
}

interface GroupBuyPriceBlockProps {
  productName: string;
  productId: string;
  productImage?: string | null;
  flavors?: string[];
  priceData: PriceData[];
  waitingCount?: number;
  brandName?: string | null;
  brandSlug?: string | null;
}

interface PriceComparisonItem {
  label: string;
  price: number | null;
  labelClassName: string;
  priceClassName: string;
  style?: CSSProperties;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBuyNowPrice(prices: PriceData[]): number | null {
  if (prices.length === 0) return null;
  return prices.length > 1 ? prices[1].price : prices[0].price;
}

function getRetailPrice(prices: PriceData[]): number | null {
  if (prices.length === 0) return null;
  return prices[0].price;
}

function getTierPrice(prices: PriceData[], index: number): number | null {
  if (prices.length === 0) return null;
  if (index < prices.length) return prices[index].price;
  return prices[prices.length - 1].price;
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

function useGroupBuyBlock(prices: PriceData[], productName: string, productId: string) {
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
    amplitude.track('CTA Clicked', { button_label: 'Comprar ahora', source: 'group_buy_block' });
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

export const GroupBuyPriceBlock = ({
  productName,
  productId,
  productImage = null,
  flavors = [],
  priceData = [],
  waitingCount = 0,
}: GroupBuyPriceBlockProps) => {
  const [displayWaitingCount, setDisplayWaitingCount] = useState(waitingCount);
  const {
    timeLeft,
    dialogOpen,
    setDialogOpen,
    isWaitingList,
    conflictDialogOpen,
    setConflictDialogOpen,
    handleBuyNow,
    handleWaitForDiscount,
    goToWaitingList,
  } = useGroupBuyBlock(priceData, productName, productId);

  useEffect(() => {
    setDisplayWaitingCount(waitingCount);
  }, [waitingCount]);

  const refreshWaitingCount = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("total_orders_count")
      .eq("id", productId)
      .maybeSingle();

    if (!error && data?.total_orders_count !== null && data?.total_orders_count !== undefined) {
      setDisplayWaitingCount(data.total_orders_count);
    }
  };

  const retailPrice = getRetailPrice(priceData);
  const currentPrice = getCurrentTierPrice(priceData, displayWaitingCount);
  const superPrice = getMaxDiscountPrice(priceData);
  const buyNowPrice = getBuyNowPrice(priceData);
  const groupBuyAccentStyle = { color: "hsl(var(--group-buy-accent))" } satisfies CSSProperties;
  const groupBuyAccentBackgroundStyle = {
    backgroundColor: "hsl(var(--group-buy-accent))",
  } satisfies CSSProperties;

  const formatPrice = (price: number | null) => {
    if (price === null) return "-";
    return `$${new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)}`;
  };

  // Progress bar: 4 markers (tiers 2-5) with 3 symmetric segments
  const progressTiers = priceData.slice(1); // people: [1, 6, 18, 42]
  let visualProgress = 0;
  if (progressTiers.length >= 4) {
    const t0 = progressTiers[0].people; // 1
    const t1 = progressTiers[1].people; // 6
    const t2 = progressTiers[2].people; // 18
    const t3 = progressTiers[3].people; // 42
    const segWidth = 100 / 3;

    if (displayWaitingCount <= t1) {
      visualProgress = ((displayWaitingCount - t0) / Math.max(1, t1 - t0)) * segWidth;
    } else if (displayWaitingCount <= t2) {
      visualProgress = segWidth + ((displayWaitingCount - t1) / Math.max(1, t2 - t1)) * segWidth;
    } else if (displayWaitingCount <= t3) {
      visualProgress = segWidth * 2 + ((displayWaitingCount - t2) / Math.max(1, t3 - t2)) * segWidth;
    } else {
      visualProgress = 100;
    }
  } else if (progressTiers.length >= 3) {
    const t0 = progressTiers[0].people;
    const t1 = progressTiers[1].people;
    const t2 = progressTiers[2].people;
    const segWidth = 100 / 3;
    if (displayWaitingCount <= t0) visualProgress = (displayWaitingCount / Math.max(1, t0)) * segWidth;
    else if (displayWaitingCount <= t1) visualProgress = segWidth + ((displayWaitingCount - t0) / Math.max(1, t1 - t0)) * segWidth;
    else if (displayWaitingCount <= t2) visualProgress = segWidth * 2 + ((displayWaitingCount - t1) / Math.max(1, t2 - t1)) * segWidth;
    else visualProgress = 100;
  }
  visualProgress = Math.min(100, Math.max(0, visualProgress));
  const groupBuyProgressStyle = {
    width: `${visualProgress}%`,
    background:
      "linear-gradient(90deg, hsl(36 100% 50%), hsl(var(--group-buy-accent)), hsl(48 100% 60%))",
  } satisfies CSSProperties;

  // Get next threshold
  const getNextThreshold = () => {
    // Message should point to the next meaningful drop tier (skip retail + first discount tier)
    const messageTiers = priceData.slice(2);

    if (messageTiers.length === 0) return null;

    for (const tier of messageTiers) {
      if (tier.people > displayWaitingCount) {
        return tier;
      }
    }

    return null;
  };
  const nextThreshold = getNextThreshold();
  const remaining = nextThreshold ? nextThreshold.people - displayWaitingCount : 0;
  const priceComparisonItems: PriceComparisonItem[] = [
    {
      label: "Retail",
      price: retailPrice,
      labelClassName: "text-muted-foreground",
      priceClassName: "text-muted-foreground line-through",
    },
    {
      label: "Ya bajó a",
      price: currentPrice,
      labelClassName: "text-primary",
      priceClassName: "text-primary",
    },
    {
      label: "Súper-Precio",
      price: superPrice,
      labelClassName: "",
      priceClassName: "",
      style: groupBuyAccentStyle,
    },
  ];

  return (
    <>
      <section className="w-full">
        <div className="mx-auto max-w-[390px]">
          <div className="bg-card rounded-3xl shadow-floating overflow-hidden border-[3px] animate-border-pulse">
            
            {/* Header with countdown and participants */}
            <div className="px-4 py-4 relative overflow-hidden bg-gradient-primary">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              <div className="flex items-center justify-between gap-2 relative">
                <div className="flex items-center gap-1.5 min-w-0 flex-shrink">
                  <Sparkles className="w-5 h-5 text-white animate-pulse flex-shrink-0" />
                  <span className="text-white font-bold text-base whitespace-nowrap">
                    Ya se sumaron {displayWaitingCount}
                  </span>
                </div>
                <div
                  className="px-2.5 py-1.5 rounded-full shadow-md flex items-center gap-1 flex-shrink-0 squircle"
                  style={groupBuyAccentBackgroundStyle}
                >
                  <Timer className="w-3.5 h-3.5 text-white" />
                  <div className="text-white font-mono font-bold text-xs tracking-wide whitespace-nowrap">
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                  </div>
                </div>
              </div>
            </div>

            {/* Price Comparison */}
            <div className="px-6 py-6 bg-card border-b border-border">
              <div className="grid grid-cols-3 gap-2 text-center items-start">
                {priceComparisonItems.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-1">
                    <div className={`text-[13px] font-bold ${item.labelClassName}`} style={item.style}>
                      {item.label}
                    </div>
                    <div
                      className={`text-[20px] sm:text-[24px] font-bold leading-none ${item.priceClassName}`}
                      style={item.style}
                    >
                      {formatPrice(item.price)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Bar Section */}
            <div className="px-6 py-8 bg-card">
              <div className="relative">
                {/* Tier people counts (top) — from progressTiers */}
                <div className="flex justify-between mb-3 text-sm font-bold text-foreground -mx-3">
                  {progressTiers.map((tier, i) => (
                    <span key={i} className="w-8 text-center">
                      {tier.people}
                    </span>
                  ))}
                </div>

                {/* Progress bar — 3 symmetric segments */}
                <div className="relative h-5 bg-muted rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 z-10"
                    style={groupBuyProgressStyle}
                  />
                  {/* 2 divider lines at 33.33% and 66.67% */}
                  <div className="absolute top-0 left-0 w-full h-full z-20">
                    <div className="absolute top-0 w-0.5 h-full bg-white opacity-70" style={{ left: '33.33%' }} />
                    <div className="absolute top-0 w-0.5 h-full bg-white opacity-70" style={{ left: '66.67%' }} />
                  </div>
                </div>                

                {/* Tier prices (bottom) */}
                <div className="flex justify-between mt-3 text-[13px] font-bold text-muted-foreground -mx-3">
                  {progressTiers.map((tier, i) => (
                    <span key={i} className="w-14 text-center first:text-left last:text-right">
                      {formatPrice(tier.price)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Next threshold message */}
              {nextThreshold && remaining > 0 && (
                <div className="mt-8 text-center">
                  <p className="text-[15px] font-semibold text-foreground">
                    Faltan <span className="font-bold" style={groupBuyAccentStyle}>{remaining} unidades</span> para{' '}
                    <span className="font-bold text-primary">{formatPrice(nextThreshold.price)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="px-6 pb-6 space-y-4 bg-card">
              <button
                onClick={handleWaitForDiscount}
                className="w-full py-4 rounded-2xl font-bold text-white text-[17px] flex items-center justify-center gap-2 shadow-lg transform transition active:scale-95 bg-gradient-primary"
              >
                <Users className="w-6 h-6" />
                Sumate al grupo
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full py-4 rounded-2xl font-bold text-foreground border-2 border-border bg-card hover:bg-muted transform transition active:scale-95"
              >
                Comprar ahora {formatPrice(buyNowPrice)}
              </button>
            </div>
          </div>
        </div>
      </section>

      <AddToCartDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        productId={productId}
        productName={productName}
        productImage={productImage}
        flavors={flavors}
        prices={priceData}
        isWaitingList={isWaitingList}
        currentParticipants={displayWaitingCount}
        onWaitingListAdded={refreshWaitingCount}
      />

      <ConflictDialog
        open={conflictDialogOpen}
        onClose={() => setConflictDialogOpen(false)}
        onGoToWaitingList={goToWaitingList}
      />
    </>
  );
};

export default GroupBuyPriceBlock;
