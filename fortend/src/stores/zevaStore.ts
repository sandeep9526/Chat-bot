/**
 * Zustand store — owns all client/UI state.
 * Rule: Zustand = what the user is configuring/seeing; React Query = what the server owns.
 */
import { create } from "zustand";
import { DEFAULTS, BOT_ID } from "@/lib/defaults";

import type {
  ZevaConfig,
  Anchor,
  LauncherStyle,
  SurfaceMode,
  CornersMode,
  FontSrc,
  PresetFont,
  ChatMessage,
} from "@/lib/types";
import { shade } from "@/lib/color";

/* ------------------------------------------------------------------ */
/*  Session persistence — sessionStorage, so a reload/back-nav doesn't  */
/*  silently wipe an in-progress conversation. Tab-scoped on purpose:   */
/*  a shared machine shouldn't leak one visitor's chat into the next.   */
/* ------------------------------------------------------------------ */
const SESSION_KEY = "zeva-session-messages";

function loadPersistedMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function savePersistedMessages(messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
  } catch {
    /* private mode / storage full — conversation just won't survive reload */
  }
}

function clearPersistedMessages(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
}

/* ------------------------------------------------------------------ */
/*  Config slice                                                       */
/* ------------------------------------------------------------------ */
interface ConfigSlice {
  config: ZevaConfig;
  accentStrong: string;
  websiteUrl: string;
  botId: string;
  setBotId: (id: string) => void;
  setWebsiteUrl: (url: string) => void;
  setAccent: (hex: string, strong?: string) => void;

  setSurface: (v: SurfaceMode) => void;
  setCorners: (v: CornersMode) => void;
  setLauncher: (v: LauncherStyle) => void;
  setAnchor: (anchor: Anchor, offX?: number, offY?: number) => void;
  setOffsets: (offX: number, offY: number) => void;
  setFontSrc: (v: FontSrc) => void;
  setPresetFont: (v: PresetFont) => void;
  setGoogleFont: (name: string) => void;
  setCustomFont: (fam: string, url: string) => void;
  setName: (v: string) => void;
  setLabel: (v: string) => void;
  setWelcome: (v: string) => void;
  setSubtitle: (v: string) => void;
  setLogo: (v: string) => void;
  setPanelBg: (v: string) => void;
  setSuggestions: (v: string[]) => void;
  toggleGlass: () => void;
  toggleSources: () => void;
  toggleBrand: () => void;
  /** Bulk-merge a saved design into the config (used to restore a "Make it
   *  yours" design after sign-up, or a bot's stashed full look in Studio). */
  applyConfig: (partial: Partial<ZevaConfig>, websiteUrl?: string) => void;
  resetConfig: () => void;
}

/* ------------------------------------------------------------------ */
/*  Session slice (chat messages, widget open/close)                    */
/*  This is CLIENT state (what the user sees). The in-flight request    */
/*  and its loading/error live in React Query, never here.              */
/* ------------------------------------------------------------------ */
interface SessionSlice {
  isOpen: boolean;
  setOpen: (v: boolean) => void;
  toggleOpen: () => void;

  messages: ChatMessage[];
  pushMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  resetSession: () => void;
  /** Loads any sessionStorage'd thread. Called post-mount only (never during
   *  the initial render) so SSR and the first client render always agree on
   *  an empty list — avoids a hydration mismatch. */
  hydrateMessages: () => void;

  isQuestionProcessing: boolean;
  setIsQuestionProcessing: (v: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Combined store                                                      */
/* ------------------------------------------------------------------ */
export interface ZevaState extends ConfigSlice, SessionSlice {}

export const useZevaStore = create<ZevaState>((set) => ({
  /* ---- config ---- */
  config: { ...DEFAULTS },
  accentStrong: shade(DEFAULTS.accent),
  websiteUrl: "",
  botId: BOT_ID,
  setBotId: (id) => set({ botId: id }),
  setWebsiteUrl: (url) => set({ websiteUrl: url }),

  setAccent: (hex, strong) =>
    set((s) => ({
      accentStrong: strong ?? shade(hex),
      config: { ...s.config, accent: hex },
    })),

  setSurface: (v) => set((s) => ({ config: { ...s.config, surface: v } })),
  setCorners: (v) => set((s) => ({ config: { ...s.config, corners: v } })),
  setLauncher: (v) => set((s) => ({ config: { ...s.config, launcher: v } })),

  setAnchor: (anchor, offX = 24, offY = 24) =>
    set((s) => ({ config: { ...s.config, anchor, offX, offY } })),

  setOffsets: (offX, offY) =>
    set((s) => ({ config: { ...s.config, offX, offY } })),

  setFontSrc: (v) => set((s) => ({ config: { ...s.config, fontSrc: v } })),
  setPresetFont: (v) => set((s) => ({ config: { ...s.config, font: v } })),
  setGoogleFont: (name) => set((s) => ({ config: { ...s.config, gFont: name } })),
  setCustomFont: (fam, url) =>
    set((s) => ({ config: { ...s.config, cFam: fam, cUrl: url } })),

  setName: (v) => set((s) => ({ config: { ...s.config, name: v } })),
  setLabel: (v) => set((s) => ({ config: { ...s.config, label: v } })),
  setWelcome: (v) => set((s) => ({ config: { ...s.config, welcome: v } })),
  setSubtitle: (v) => set((s) => ({ config: { ...s.config, subtitle: v } })),
  setLogo: (v) => set((s) => ({ config: { ...s.config, logo: v } })),
  setPanelBg: (v) => set((s) => ({ config: { ...s.config, panelBg: v } })),
  setSuggestions: (v) => set((s) => ({ config: { ...s.config, suggestions: v } })),

  toggleGlass: () => set((s) => ({ config: { ...s.config, glass: !s.config.glass } })),
  toggleSources: () => set((s) => ({ config: { ...s.config, sources: !s.config.sources } })),
  toggleBrand: () => set((s) => ({ config: { ...s.config, brand: !s.config.brand } })),

  applyConfig: (partial, url) =>
    set((s) => ({
      config: { ...s.config, ...partial },
      accentStrong: partial.accent ? shade(partial.accent) : s.accentStrong,
      websiteUrl: url ?? s.websiteUrl,
    })),

  resetConfig: () =>
    set(() => ({
      config: { ...DEFAULTS },
      accentStrong: shade(DEFAULTS.accent),
    })),

  /* ---- session ---- */
  isOpen: true,
  setOpen: (v) => set({ isOpen: v }),
  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

  messages: [],
  hydrateMessages: () => {
    const messages = loadPersistedMessages();
    if (messages.length) set({ messages });
  },
  pushMessage: (msg) =>
    set((s) => {
      const messages = [...s.messages, msg];
      savePersistedMessages(messages);
      return { messages };
    }),
  updateMessage: (id, patch) =>
    set((s) => {
      const messages = s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m));
      savePersistedMessages(messages);
      return { messages };
    }),
  resetSession: () => {
    clearPersistedMessages();
    set({ messages: [] });
  },

  isQuestionProcessing: false,
  setIsQuestionProcessing: (v) => set({ isQuestionProcessing: v }),
}));
