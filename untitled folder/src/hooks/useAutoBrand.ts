"use client";

import { useEffect } from "react";
import { useZevaStore } from "@/stores/zevaStore";
import { useBotConfig } from "./useZevaApi";

/**
 * Widget brands itself from the backend: fetch /config?botId and apply the
 * bot's name / accent / welcome / suggestions to the store. Change the bot's
 * accent in the DB → the widget recolors on next load, no code change.
 * (Real mode only; in mock/studio mode useBotConfig is disabled.)
 */
export function useAutoBrand(botId: string): void {
  const { data } = useBotConfig(botId);
  const setName = useZevaStore((s) => s.setName);
  const setAccent = useZevaStore((s) => s.setAccent);
  const setWelcome = useZevaStore((s) => s.setWelcome);
  const setSuggestions = useZevaStore((s) => s.setSuggestions);

  useEffect(() => {
    if (!data) return;
    if (data.name) setName(data.name);
    if (data.accent) setAccent(data.accent);
    if (data.welcome) setWelcome(data.welcome);
    if (data.suggestions?.length) setSuggestions(data.suggestions);
  }, [data, setName, setAccent, setWelcome, setSuggestions]);
}
