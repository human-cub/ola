export type PendingAddAction =
  | {
      kind: "cart";
      redirectTo: string;
      item: {
        product_id: string;
        product_name: string;
        flavor: string | null;
        quantity: number;
        price_per_unit: number;
        product_image: string | null;
        product_link?: string | null;
      };
    }
  | {
      kind: "waiting_list";
      redirectTo: string;
      item: {
        product_id: string;
        product_name: string;
        flavor: string | null;
        quantity: number;
        current_price_per_unit: number;
        product_image: string | null;
        brand_slug?: string | null;
        retail_price_per_unit?: number | null;
        guaranteed_price_per_unit?: number | null;
        super_price_per_unit?: number | null;
        product_link?: string | null;
      };
    };

const KEY = "ola_pending_add_action_v1";

export function setPendingAddAction(action: PendingAddAction) {
  localStorage.setItem(KEY, JSON.stringify(action));
}

export function consumePendingAddAction(): PendingAddAction | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  // remove first to avoid double-processing on multiple auth events
  localStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as PendingAddAction;
  } catch {
    return null;
  }
}
