import { describe, expect, it } from "vitest";
import {
  getCollectiveCountdownState,
  getLastSundayClose,
  getNextSunday,
} from "./collectivePricing";

describe("collectivePricing deadline helpers", () => {
  it("keeps the current Sunday close as the next deadline until 23:59:59", () => {
    const now = new Date(2026, 2, 15, 23, 58, 59, 0);

    const nextSunday = getNextSunday(now);
    const lastSundayClose = getLastSundayClose(now);

    expect(nextSunday.getFullYear()).toBe(2026);
    expect(nextSunday.getMonth()).toBe(2);
    expect(nextSunday.getDate()).toBe(15);
    expect(nextSunday.getHours()).toBe(23);
    expect(nextSunday.getMinutes()).toBe(59);

    expect(lastSundayClose.getFullYear()).toBe(2026);
    expect(lastSundayClose.getMonth()).toBe(2);
    expect(lastSundayClose.getDate()).toBe(8);
    expect(lastSundayClose.getHours()).toBe(23);
    expect(lastSundayClose.getMinutes()).toBe(59);
  });

  it("switches to the confirmation window only after the weekly close passes", () => {
    const now = new Date(2026, 2, 16, 0, 0, 0, 0);
    const pendingOrderCreatedAt = new Date(2026, 2, 14, 12, 0, 0, 0);

    const state = getCollectiveCountdownState({ now, pendingOrderCreatedAt });

    expect(state.isCollectionEnded).toBe(true);
    expect(state.confirmationDeadline?.getFullYear()).toBe(2026);
    expect(state.confirmationDeadline?.getMonth()).toBe(2);
    expect(state.confirmationDeadline?.getDate()).toBe(22);
    expect(state.confirmationDeadline?.getHours()).toBe(23);
    expect(state.confirmationDeadline?.getMinutes()).toBe(59);
    expect(state.timeLeft.days).toBe(6);
  });

  it("does not jump to the next week one minute before close without a pending order", () => {
    const now = new Date(2026, 2, 15, 23, 58, 59, 0);

    const state = getCollectiveCountdownState({ now, pendingOrderCreatedAt: null });

    expect(state.isCollectionEnded).toBe(false);
    expect(state.timeLeft.days).toBe(0);
    expect(state.timeLeft.hours).toBe(0);
    expect(state.timeLeft.minutes).toBe(1);
  });

  it("uses a stored collective close date as the deadline source of truth", () => {
    const now = new Date(2026, 2, 15, 23, 58, 59, 0);
    const collectiveCloseDate = new Date(2026, 2, 15, 23, 59, 59, 999);

    const state = getCollectiveCountdownState({
      now,
      collectiveCloseDate,
      pendingOrderCreatedAt: new Date(2026, 2, 14, 12, 0, 0, 0),
    });

    expect(state.isCollectionEnded).toBe(false);
    expect(state.timeLeft.days).toBe(0);
    expect(state.timeLeft.hours).toBe(0);
    expect(state.timeLeft.minutes).toBe(1);
  });
});
