import { supabase } from "@/integrations/supabase/client";

interface CollectiveClockRow {
  server_now: string;
  next_collective_close: string;
}

const parseTimestamp = (value: unknown, label: string): Date => {
  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label} timestamp`);
  }

  return parsed;
};

export const fetchServerTime = async (): Promise<Date> => {
  const { data, error } = await supabase.rpc("get_server_time");

  if (error) {
    throw error;
  }

  return parseTimestamp(data, "server time");
};

export const fetchCollectiveClock = async (): Promise<{
  serverNow: Date;
  nextCollectiveClose: Date;
}> => {
  const { data, error } = await supabase.rpc("get_collective_clock");

  if (error) {
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as CollectiveClockRow | null;

  if (!row) {
    throw new Error("Collective clock RPC returned no rows");
  }

  return {
    serverNow: parseTimestamp(row.server_now, "server_now"),
    nextCollectiveClose: parseTimestamp(row.next_collective_close, "next_collective_close"),
  };
};