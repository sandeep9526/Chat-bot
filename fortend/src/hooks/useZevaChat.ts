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
import { ChatRequestError, type ChatErrorKind } from "@/lib/api";

let seq = 0;
function nextId(): string {
  return `m${++seq}`;
}

/** User-facing copy per failure cause — a network blip, a timeout, a rate
 *  limit, and a server error all need different next steps. */
function errorTextForKind(kind: ChatErrorKind): string {
  switch (kind) {
    case "offline":
      return "You appear to be offline. Reconnect and try again.";
    case "timeout":
      return "That took longer than expected. Want to try again?";
    case "rate_limited":
      return "You're sending messages a little fast — give it a few seconds and try again.";
    case "server":
      return "Something went wrong on our end — try again in a moment.";
    case "network":
    default:
      return "Connection trouble — check your internet and try again.";
  }
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
          onError: (error) => {
            setIsQuestionProcessing(false);
            const kind =
              error instanceof ChatRequestError ? error.kind : "network";
            pushMessage({
              id: nextId(),
              role: "assistant",
              text: errorTextForKind(kind),
              sources: [],
              isError: true,
              retryText: text,
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
