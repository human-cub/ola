// Optimistic-дельты суммы сбора (collecta).
//
// Серверный пересчёт суммы — длинная цепочка (UPDATE листа -> syncWaitingListOrder
// -> RPC refresh_brand_goal -> событие collecta-changed -> рефетч вьюхи), это
// секунды. Чтобы бар двигался мгновенно, лист ожидания диспатчит дельту своего
// действия (±qty × precio garantizado) сразу; подписчики прибавляют её к
// последнему серверному значению, а при следующем рефетче (collecta-changed)
// заменяют всё настоящим значением и сбрасывают накопленные дельты.
//
// Дельты шлём только для залогиненных: вклад гостя не попадает в real_score
// (заказ не создаётся), сервер сумму не изменит — бар бы дёрнулся и откатился.

export interface CollectaDeltaDetail {
  slug: string;
  amount: number;
}

export const COLLECTA_DELTA_EVENT = "collecta-delta";

export const dispatchCollectaDelta = (
  slug: string | null | undefined,
  amount: number,
) => {
  if (!slug || !amount || typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CollectaDeltaDetail>(COLLECTA_DELTA_EVENT, {
      detail: { slug, amount },
    }),
  );
};

/** Цена строки листа в формуле real_score (refresh_brand_goal). */
export const collectaUnitPrice = (item: {
  guaranteed_price_per_unit?: number | null;
  current_price_per_unit: number;
}): number => item.guaranteed_price_per_unit ?? item.current_price_per_unit;
