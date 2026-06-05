import { useEffect, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { COLLECTA_DELTA_EVENT, type CollectaDeltaDetail } from "@/lib/collectaBus";

export interface BrandCollectionRow {
  slug: string;
  collected_total: number;
  target_amount: number;
  goal_reached: boolean;
}

export const BRAND_COLLECTION_KEY = ["brand-collection-meta"];

// ОДИН запрос на все марки вместо точечного запроса в каждом инстансе хука.
// (Карусель главной рендерит каждую карточку дважды для бесшовного лупа —
// раньше это давало 16 параллельных запросов brand_collection_public на старте.)
const fetchBrandCollection = async (): Promise<BrandCollectionRow[]> => {
  const { data } = await supabase
    .from("brand_collection_public" as any)
    .select("slug, collected_total, target_amount, goal_reached");
  return ((data ?? []) as any[]).map((r) => ({
    slug: r.slug,
    collected_total: Number(r.collected_total ?? 0),
    target_amount: Number(r.target_amount ?? 0),
    goal_reached: Boolean(r.goal_reached ?? false),
  }));
};

// Синглтон: один realtime-канал и один collecta-changed-листенер на всё
// приложение (раньше каждый прогресс-бар держал собственный канал).
let subscribers = 0;
let channel: ReturnType<typeof supabase.channel> | null = null;
let onChangedGlobal: (() => void) | null = null;

const bindGlobalInvalidation = (qc: QueryClient) => {
  subscribers++;
  if (!onChangedGlobal) {
    onChangedGlobal = () => {
      void qc.invalidateQueries({ queryKey: BRAND_COLLECTION_KEY });
    };
    window.addEventListener("collecta-changed", onChangedGlobal);
    channel = supabase
      .channel("brand-collection-meta-global")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_overrides" },
        onChangedGlobal,
      )
      .subscribe();
  }
  return () => {
    subscribers--;
    if (subscribers <= 0 && onChangedGlobal) {
      window.removeEventListener("collecta-changed", onChangedGlobal);
      if (channel) supabase.removeChannel(channel);
      channel = null;
      onChangedGlobal = null;
    }
  };
};

/** Данные сбора всех марок (общий кэш React Query). */
export const useBrandCollectionData = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: BRAND_COLLECTION_KEY,
    queryFn: fetchBrandCollection,
    staleTime: 30_000,
  });
  useEffect(() => bindGlobalInvalidation(qc), [qc]);
  return query;
};

/** Сбор конкретной марки + optimistic-дельта (см. collectaBus). */
export const useBrandCollection = (brandSlug: string | null | undefined) => {
  const { data, dataUpdatedAt } = useBrandCollectionData();
  const [delta, setDelta] = useState(0);

  // Свежие серверные данные уже включают эффект наших действий — дельта отработала
  useEffect(() => {
    if (dataUpdatedAt) setDelta(0);
  }, [dataUpdatedAt]);

  useEffect(() => {
    if (!brandSlug) return;
    const onDelta = (e: Event) => {
      const detail = (e as CustomEvent<CollectaDeltaDetail>).detail;
      if (detail?.slug === brandSlug) setDelta((d) => d + detail.amount);
    };
    window.addEventListener(COLLECTA_DELTA_EVENT, onDelta);
    return () => window.removeEventListener(COLLECTA_DELTA_EVENT, onDelta);
  }, [brandSlug]);

  const row = brandSlug ? (data ?? []).find((r) => r.slug === brandSlug) : undefined;
  const target = row?.target_amount ?? 0;
  const collectedRaw = Math.max(0, (row?.collected_total ?? 0) + delta);
  const goalReached = Boolean(row?.goal_reached);
  return { collectedRaw, target, goalReached, loaded: data !== undefined };
};
