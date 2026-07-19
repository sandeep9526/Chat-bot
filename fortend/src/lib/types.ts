export type LauncherStyle = "pill" | "bubble" | "bar";
export type SurfaceMode = "auto" | "light" | "dark";
export type CornersMode = "sharp" | "soft" | "round";
export type FontSrc = "preset" | "google" | "custom" | "inherit";
export type PresetFont = "system" | "rounded" | "serif" | "mono";
export type Anchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface ZevaConfig {
  name: string;
  label: string;
  welcome: string;
  /** Header tagline under the name (e.g. "answer engine · grounded"). */
  subtitle: string;
  /** Logo shown in the header + launcher. Data URL (uploaded) or image URL. "" = default orb. */
  logo: string;
  accent: string;
  surface: SurfaceMode;
  /** Custom open-panel background color. "" = follow the surface theme. */
  panelBg: string;
  corners: CornersMode;
  launcher: LauncherStyle;
  anchor: Anchor;
  offX: number;
  offY: number;
  glass: boolean;
  sources: boolean;
  brand: boolean;
  fontSrc: FontSrc;
  font: PresetFont;
  gFont: string;
  cFam: string;
  cUrl: string;
  /** Starter question chips shown in the empty state. */
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: ChatSource[];
  isGuardrail?: boolean;
  /** Set once the lead ticket for this message has been handed off. */
  ticketState?: TicketState;
  /** Name the visitor entered on the lead ticket (shown in the handoff stub). */
  leadName?: string;
}

export type TicketState = "idle" | "gone";

export interface ChatSource {
  file: string;
  match: number;
  snip: string;
  highlight: string;
}

export interface KbEntry {
  keys: string[];
  answer: string;
  file: string;
  match: number;
  snip: string;
  hi: string;
}

/** Payload sent to POST /chat. `name` is used only by the demo mock. */
export interface ChatRequest {
  message: string;
  botId: string;
  name?: string;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  isGuardrail: boolean;
}

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  botId: string;
}

export interface LeadResponse {
  ok: boolean;
}
