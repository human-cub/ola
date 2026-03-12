import { useState, useEffect } from "react";

export interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ZERO: CountdownValues = { days: 0, hours: 0, minutes: 0, seconds: 0 };

export const useCountdown = (
  targetDate: Date | null,
  intervalMs = 1000
): CountdownValues => {
  const [timeLeft, setTimeLeft] = useState<CountdownValues>(ZERO);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(ZERO);
      return;
    }

    const calculate = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(ZERO);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculate();
    const timer = setInterval(calculate, intervalMs);
    return () => clearInterval(timer);
  }, [targetDate, intervalMs]);

  return timeLeft;
};
