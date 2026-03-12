import { useState, useEffect } from "react";
import { getCollectiveCountdownState } from "@/lib/collectivePricing";
import { useCollectiveClock } from "@/hooks/useCollectiveClock";

interface CollectiveCountdownResult {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  isCollectionEnded: boolean;
  confirmationDeadline: Date | null;
}

export const useCollectiveCountdown = (
  pendingOrderCreatedAt: Date | null,
  collectiveCloseDate: Date | null
): CollectiveCountdownResult => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isCollectionEnded, setIsCollectionEnded] = useState(false);
  const [confirmationDeadline, setConfirmationDeadline] = useState<Date | null>(null);
  const { serverOffsetMs, nextCollectiveClose } = useCollectiveClock();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const countdownState = getCollectiveCountdownState({
        pendingOrderCreatedAt,
        collectiveCloseDate,
        nextCollectiveClose,
        now: new Date(Date.now() + serverOffsetMs),
      });

      setTimeLeft(countdownState.timeLeft);
      setIsCollectionEnded(countdownState.isCollectionEnded);
      setConfirmationDeadline(countdownState.confirmationDeadline);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [collectiveCloseDate, nextCollectiveClose, pendingOrderCreatedAt, serverOffsetMs]);

  return { timeLeft, isCollectionEnded, confirmationDeadline };
};
