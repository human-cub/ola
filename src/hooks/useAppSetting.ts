import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads a single value from the public.app_settings key/value table.
 * Falls back to `defaultValue` while loading or on error.
 */
export const useAppSetting = <T = unknown>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data } = await supabase
        .from("app_settings" as any)
        .select("value")
        .eq("key", key)
        .maybeSingle();

      if (!mounted) return;
      if (data && (data as any).value !== undefined && (data as any).value !== null) {
        setValue((data as any).value as T);
      }
      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [key]);

  return { value, loading };
};