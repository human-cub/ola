/**
 * Redondeo del total para pago en EFECTIVO — incentivo para pagar cash.
 * Baja el total al múltiplo de $10.000 — o $5.000 — si el descuento implícito
 * queda dentro del 2% del total; si no alcanza, $1.000 (también dentro del 2%)
 * y como último recurso $500. Nunca sube el total.
 */
export const isCashMethod = (method: string | null | undefined): boolean =>
  method === "efectivo";

export const cashRoundedTotal = (total: number): number => {
  // Pedidos minúsculos: no redondear (el paso de $500 sería un % enorme).
  if (!Number.isFinite(total) || total < 5000) return total;
  for (const step of [10000, 5000, 1000]) {
    const candidate = Math.floor(total / step) * step;
    if (candidate > 0 && total - candidate <= total * 0.02) return candidate;
  }
  // Último recurso: múltiplo de $500 sin límite del 2% — el descuento
  // implícito nunca supera $499, despreciable en términos absolutos.
  const candidate = Math.floor(total / 500) * 500;
  return candidate > 0 ? candidate : total;
};

export const applyCashRounding = (
  total: number,
  method: string | null | undefined,
): number => (isCashMethod(method) ? cashRoundedTotal(total) : total);
