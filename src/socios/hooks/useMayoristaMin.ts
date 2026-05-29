import { useAppSetting } from "@/hooks/useAppSetting";

const DEFAULT_MIN = 200000;

export const useMayoristaMin = (): number => {
  const { value } = useAppSetting<number | string>("mayorista_min_order", DEFAULT_MIN);
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed) || (parsed as number) <= 0) return DEFAULT_MIN;
  return parsed as number;
};