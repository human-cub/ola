import { useEffect, useState } from "react";
import { fetchCollectiveClock } from "@/lib/serverClock";

export const useCollectiveClock = () => {
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [nextCollectiveClose, setNextCollectiveClose] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    const syncClock = async () => {
      try {
        const clock = await fetchCollectiveClock();

        if (cancelled) {
          return;
        }

        setServerOffsetMs(clock.serverNow.getTime() - Date.now());
        setNextCollectiveClose(clock.nextCollectiveClose);
      } catch (error) {
        console.error("Error syncing collective clock:", error);
      }
    };

    void syncClock();

    const timer = window.setInterval(() => {
      void syncClock();
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return { serverOffsetMs, nextCollectiveClose };
};
