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
  const setIsQuestionProcessing = useZevaStore((s) => s.setIsQuestionProcessing);
  const isQuestionProcessingStore = useZevaStore((s) => s.isQuestionProcessing);
  const name = useZevaStore((s) => s.config.name);
  const botId = useZevaStore((s) => s.botId) || BOT_ID;
  const send = useSendMessage();

  const ask = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || send.isPending) return;
      setIsQuestionProcessing(true);
      pushMessage({ id: nextId(), role: "user", text });
      send.mutate(
        { message: text, botId, name },

        {
          onSuccess: (res) => {
            setIsQuestionProcessing(false);
            pushMessage({
              id: nextId(),
              role: "assistant",
              text: res.answer,
              sources: res.sources,
              isGuardrail: res.isGuardrail,
              limitReached: res.limitReached,
              ticketState: (res.isGuardrail && !res.limitReached) ? "idle" : undefined,
            });
          },
          onError: () => {
            setIsQuestionProcessing(false);
            pushMessage({
              id: nextId(),
              role: "assistant",
              text: "Couldn't reach the server. Try again in a moment.",
              sources: [],
            });
          },
        },
      );
    },
    [name, botId, pushMessage, send, setIsQuestionProcessing],
  );

  return {
    messages,
    ask,
    updateMessage,
    isScanning: send.isPending || isQuestionProcessingStore,
    error: send.error,
  };
}
