export interface PriceTier {
  people: number;
  price: number;
}

export interface CollectiveOrderItemSnapshot {
  participants_count?: number | null;
}

export interface CollectiveCountdownState {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  isCollectionEnded: boolean;
  confirmationDeadline: Date | null;
}

const COLLECTIVE_CONFIRMATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const getSundayClose = (date: Date): Date => {
  const close = new Date(date);
  close.setHours(23, 59, 59, 999);
  return close;
};

const isBeforeSundayClose = (date: Date): boolean => {
  return date.getDay() === 0 && date.getTime() < getSundayClose(date).getTime();
};

const toTimeLeft = (difference: number) => {
  const safeDifference = Math.max(0, difference);

  return {
    days: Math.floor(safeDifference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((safeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((safeDifference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((safeDifference % (1000 * 60)) / 1000),
  };
};

export const normalizePriceTiers = (rawPrices: unknown): PriceTier[] => {
  if (!Array.isArray(rawPrices)) return [];

  return rawPrices
    .map((tier: any) => ({
      people: Number(tier?.people),
      price: Number(tier?.price),
    }))
    .filter((tier) => Number.isFinite(tier.people) && Number.isFinite(tier.price))
    .sort((a, b) => a.people - b.people);
};

export const getCollectiveTierPrice = (
  rawPrices: unknown,
  participantsCount: number
): number | null => {
  const tiers = normalizePriceTiers(rawPrices);
  if (tiers.length === 0) return null;

  if (tiers.length === 1) {
    return tiers[0].price;
  }

  const secondTier = tiers[1];
  if (participantsCount < secondTier.people) {
    return secondTier.price;
  }

  let price = secondTier.price;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (participantsCount >= tiers[i].people) {
      price = tiers[i].price;
      break;
    }
  }

  return price;
};

export const getFirstTierPrice = (rawPrices: unknown, fallback: number): number => {
  const tiers = normalizePriceTiers(rawPrices);
  return tiers[0]?.price ?? fallback;
};

export const getLastSundayClose = (now: Date = new Date()): Date => {
  const lastSunday = new Date(now);
  const daysSinceSunday = now.getDay();

  if (daysSinceSunday === 0 && isBeforeSundayClose(now)) {
    lastSunday.setDate(now.getDate() - 7);
  } else {
    lastSunday.setDate(now.getDate() - daysSinceSunday);
  }

  return getSundayClose(lastSunday);
};

export const isCollectiveOrderFrozen = (createdAt: string, now: Date = new Date()): boolean => {
  const orderCreatedAt = new Date(createdAt);
  const lastSundayClose = getLastSundayClose(now);
  return orderCreatedAt < lastSundayClose && now > lastSundayClose;
};

export const isCollectiveOrderClosed = (params: {
  collectiveCloseDate?: string | Date | null;
  createdAt: string;
  now?: Date;
}): boolean => {
  const { collectiveCloseDate, createdAt, now = new Date() } = params;

  if (collectiveCloseDate) {
    const closeDate = new Date(collectiveCloseDate);

    if (!Number.isNaN(closeDate.getTime())) {
      return now >= closeDate;
    }
  }

  return isCollectiveOrderFrozen(createdAt, now);
};

export const getNextSunday = (now: Date = new Date()): Date => {
  const next = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7;

  if (daysUntilSunday === 0 && isBeforeSundayClose(now)) {
    return getSundayClose(next);
  }

  next.setDate(now.getDate() + (daysUntilSunday || 7));
  return getSundayClose(next);
};

export const getNextSundayIso = (now: Date = new Date()): string => {
  return getNextSunday(now).toISOString();
};

export const getCollectiveCountdownState = (params: {
  pendingOrderCreatedAt: Date | null;
  collectiveCloseDate?: Date | null;
  nextCollectiveClose?: Date | null;
  now?: Date;
}): CollectiveCountdownState => {
  const { pendingOrderCreatedAt, collectiveCloseDate, nextCollectiveClose, now = new Date() } = params;
  const resolvedNextClose = nextCollectiveClose ?? getNextSunday(now);

  if (collectiveCloseDate && !Number.isNaN(collectiveCloseDate.getTime())) {
    const confirmationDeadline = new Date(
      collectiveCloseDate.getTime() + COLLECTIVE_CONFIRMATION_WINDOW_MS
    );

    if (now < collectiveCloseDate) {
      return {
        timeLeft: toTimeLeft(collectiveCloseDate.getTime() - now.getTime()),
        isCollectionEnded: false,
        confirmationDeadline,
      };
    }

    if (now < confirmationDeadline) {
      return {
        timeLeft: toTimeLeft(confirmationDeadline.getTime() - now.getTime()),
        isCollectionEnded: true,
        confirmationDeadline,
      };
    }

    return {
      timeLeft: toTimeLeft(resolvedNextClose.getTime() - now.getTime()),
      isCollectionEnded: false,
      confirmationDeadline,
    };
  }

  const lastClose = getLastSundayClose(now);
  const nextClose = resolvedNextClose;
  const confirmationDeadline = new Date(lastClose);
  confirmationDeadline.setDate(confirmationDeadline.getDate() + 7);

  const hasPendingOrderFromPreviousCycle =
    !!pendingOrderCreatedAt &&
    pendingOrderCreatedAt < lastClose &&
    now > lastClose &&
    now < confirmationDeadline;

  if (hasPendingOrderFromPreviousCycle) {
    return {
      timeLeft: toTimeLeft(confirmationDeadline.getTime() - now.getTime()),
      isCollectionEnded: true,
      confirmationDeadline,
    };
  }

  return {
    timeLeft: toTimeLeft(nextClose.getTime() - now.getTime()),
    isCollectionEnded: false,
    confirmationDeadline,
  };
};

export const shouldUseDynamicCollectivePricing = (params: {
  orderType: string;
  status: string;
  createdAt: string;
  collectiveCloseDate?: string | null;
  isPromo?: boolean | null;
  items: CollectiveOrderItemSnapshot[];
  now?: Date;
}): boolean => {
  const { orderType, status, createdAt, collectiveCloseDate, isPromo, items, now } = params;

  if (orderType !== "collective" || status !== "pending" || isPromo) {
    return false;
  }

  const hasFrozenSnapshot = items.some(
    (item) => item.participants_count != null && Number(item.participants_count) > 0
  );

  if (hasFrozenSnapshot) {
    return false;
  }

  return !isCollectiveOrderClosed({ createdAt, collectiveCloseDate, now });
};
