"use client";

/**
 * Orchestrates the ask → scan → answer flow by wiring the Zustand session
 * (the message list the user sees) to the React Query send mutation (the
 * server call + its loading/error). Components read `messages` + `isScanning`
 * from here and never touch the network directly.
 */
import { useCallback } from "react";
import { useZevaStore } from "@/stores/zevaStore";
import { useSendMessage } from "./useZevaApi";
import { BOT_ID } from "@/lib/defaults";

let seq = 0;
function nextId(): string {
  return `m${++seq}`;
}

export function useZevaChat() {
  const messages = useZevaStore((s) => s.messages);
  const pushMessage = useZevaStore((s) => s.pushMessage);
  const updateMessage = useZevaStore((s) => s.updateMessage);
  const name = useZevaStore((s) => s.config.name);
  const send = useSendMessage();

  const ask = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || send.isPending) return;
      pushMessage({ id: nextId(), role: "user", text });
      send.mutate(
        { message: text, botId: BOT_ID, name },
        {
          onSuccess: (res) =>
            pushMessage({
              id: nextId(),
              role: "assistant",
              text: res.answer,
              sources: res.sources,
              isGuardrail: res.isGuardrail,
              ticketState: res.isGuardrail ? "idle" : undefined,
            }),
          // Backend down / errored → show a friendly message, don't hang silently.
          onError: () =>
            pushMessage({
              id: nextId(),
              role: "assistant",
              text: "Sorry — I couldn’t reach the server just now. Please try again in a moment.",
              sources: [],
            }),
        },
      );
    },
    [name, pushMessage, send],
  );

  return {
    messages,
    ask,
    updateMessage,
    // Loading/error come from React Query, not a Zustand boolean.
    isScanning: send.isPending,
    error: send.error,
  };
}
