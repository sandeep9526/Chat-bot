import type { Anchor, LauncherStyle } from "@/lib/types";

/** Everything the wizard collects across its 5 steps. */
export interface WizardData {
  businessName: string;
  botId: string;
  accent: string;
  welcome: string;
  suggestions: string[];
  launcher: LauncherStyle;
  anchor: Anchor;
  offX: number;
  offY: number;
}

export const INITIAL_WIZARD_DATA: WizardData = {
  businessName: "",
  botId: "",
  accent: "#4f46e5",
  welcome: "",
  suggestions: [],
  launcher: "pill",
  anchor: "bottom-right",
  offX: 24,
  offY: 24,
};
