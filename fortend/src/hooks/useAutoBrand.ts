"use client";

import { useEffect } from "react";
import { useOchreshiftStore } from "@/stores/ochreshiftStore";
import { useBotConfig } from "./useOchreshiftApi";

/**
 * Widget brands itself from the backend: fetch /config?botId and apply the
 * bot's name / accent / welcome / suggestions to the store. Change the bot's
 * accent in the DB → the widget recolors on next load, no code change.
 * (Real mode only; in mock/studio mode useBotConfig is disabled.)
 */
export function useAutoBrand(botId: string): void {
  const { data } = useBotConfig(botId);
  const setName = useOchreshiftStore((s) => s.setName);
  const setAccent = useOchreshiftStore((s) => s.setAccent);
  const setWelcome = useOchreshiftStore((s) => s.setWelcome);
  const setSuggestions = useOchreshiftStore((s) => s.setSuggestions);

  useEffect(() => {
    if (!data) return;
    if (data.name) setName(data.name);
    if (data.accent) setAccent(data.accent);
    if (data.welcome) setWelcome(data.welcome);
    if (data.suggestions?.length) setSuggestions(data.suggestions);
  }, [data, setName, setAccent, setWelcome, setSuggestions]);
}
