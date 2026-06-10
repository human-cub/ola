import { describe, expect, it } from "vitest";
import { applyCashRounding, cashRoundedTotal, isCashMethod } from "./cashRounding";

describe("cashRoundedTotal", () => {
  it("prefers 10000 multiples within 2.5%", () => {
    expect(cashRoundedTotal(100500)).toBe(100000);
    expect(cashRoundedTotal(121990)).toBe(120000);
  });
  it("falls back to 5000 multiples within 2.5%", () => {
    expect(cashRoundedTotal(207980)).toBe(205000);
  });
  it("falls back to 1000 multiples within 2.5%", () => {
    expect(cashRoundedTotal(102990)).toBe(102000);
    expect(cashRoundedTotal(57300)).toBe(57000);
  });
  it("last resort: 500 multiples regardless of 2.5% (max $499 absolute)", () => {
    expect(cashRoundedTotal(21990)).toBe(21500);
    expect(cashRoundedTotal(8990)).toBe(8500);
  });
  it("keeps already-round totals as is", () => {
    expect(cashRoundedTotal(104000)).toBe(104000);
  });
  it("never touches tiny totals (<5000)", () => {
    expect(cashRoundedTotal(4990)).toBe(4990);
    expect(cashRoundedTotal(990)).toBe(990);
  });
  it("never rounds up", () => {
    for (const t of [5001, 9999, 33333, 87654, 123456]) {
      expect(cashRoundedTotal(t)).toBeLessThanOrEqual(t);
    }
  });
});

describe("isCashMethod / applyCashRounding", () => {
  it("only efectivo gets the discount", () => {
    expect(isCashMethod("efectivo")).toBe(true);
    expect(isCashMethod("transferencia")).toBe(false);
    expect(isCashMethod(null)).toBe(false);
    expect(applyCashRounding(102990, "efectivo")).toBe(102000);
    expect(applyCashRounding(102990, "transferencia")).toBe(102990);
  });
});
