export interface PriceTier {
  people: number;
  price: number;
}

export interface CollectiveOrderItemSnapshot {
  participants_count?: number | null;
}

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

  if (daysSinceSunday === 0) {
    if (now.getHours() < 23 || (now.getHours() === 23 && now.getMinutes() < 59)) {
      lastSunday.setDate(now.getDate() - 7);
    }
  } else {
    lastSunday.setDate(now.getDate() - daysSinceSunday);
  }

  lastSunday.setHours(23, 59, 59, 999);
  return lastSunday;
};

export const isCollectiveOrderFrozen = (createdAt: string, now: Date = new Date()): boolean => {
  const orderCreatedAt = new Date(createdAt);
  const lastSundayClose = getLastSundayClose(now);
  return orderCreatedAt < lastSundayClose && now > lastSundayClose;
};

export const shouldUseDynamicCollectivePricing = (params: {
  orderType: string;
  status: string;
  createdAt: string;
  isPromo?: boolean | null;
  items: CollectiveOrderItemSnapshot[];
}): boolean => {
  const { orderType, status, createdAt, isPromo, items } = params;

  if (orderType !== "collective" || status !== "pending" || isPromo) {
    return false;
  }

  const hasFrozenSnapshot = items.some(
    (item) => item.participants_count != null && Number(item.participants_count) > 0
  );

  if (hasFrozenSnapshot) {
    return false;
  }

  return !isCollectiveOrderFrozen(createdAt);
};
