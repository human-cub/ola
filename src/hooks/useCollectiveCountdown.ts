import { useState, useEffect } from "react";
import { getLastSundayClose, getNextSunday } from "@/lib/collectivePricing";

interface CollectiveCountdownResult {
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  isCollectionEnded: boolean;
  confirmationDeadline: Date | null;
}

export const useCollectiveCountdown = (
  pendingOrderCreatedAt: Date | null
): CollectiveCountdownResult => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isCollectionEnded, setIsCollectionEnded] = useState(false);
  const [confirmationDeadline, setConfirmationDeadline] = useState<Date | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const lastClose = getLastSundayClose();
      const nextSun = getNextSunday();

      const deadline = new Date(lastClose);
      deadline.setDate(deadline.getDate() + 7);
      setConfirmationDeadline(deadline);

      const hasPendingOrderFromPreviousCycle =
        pendingOrderCreatedAt &&
        pendingOrderCreatedAt < lastClose &&
        now > lastClose &&
        now < deadline;

      if (hasPendingOrderFromPreviousCycle) {
        setIsCollectionEnded(true);
        const diff = deadline.getTime() - now.getTime();
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
        return;
      }

      setIsCollectionEnded(false);

      const difference = nextSun.getTime() - now.getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [pendingOrderCreatedAt]);

  return { timeLeft, isCollectionEnded, confirmationDeadline };
};
