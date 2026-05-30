export type { PriceTier } from "./collectivePricing";

/** Alias kept for convenience – identical to PriceTier */
export type PriceData = { people: number; price: number };

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type OrderType = "immediate" | "collective" | "mayorista";

export interface OrderItem {
  product_id: string;
  product_name: string;
  flavor: string | null;
  quantity: number;
  price_per_unit: number;
  product_image: string | null;
  participants_count?: number;
}

export interface DeliveryAddress {
  street: string;
  number: string;
  floor: string | null;
  postalCode: string;
  city: string;
  province: string;
  references: string | null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  processing: "Procesando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  immediate: "Inmediato",
  collective: "Colectivo",
  mayorista: "Mayorista",
};
