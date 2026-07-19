"use client";

import { useEffect } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { getPendingDesign } from "@/lib/pendingDesign";

/** Per-USER seen flag (not per-browser) so every new account gets the tour once,
 *  even in a shared browser where someone else already saw it. */
const seenKeyFor = (userKey: string) => `zeva-tour-seen:${userKey || "anon"}`;

/**
 * A 30-second guided tour of the dashboard (driver.js), replacing the old
 * step-by-step onboarding wizard. Auto-runs once per user on their first desktop
 * visit — and always for a brand-new account (0 bots) that hasn't seen it. Can
 * be re-triggered anywhere by dispatching `window` event "zeva:start-tour" (the
 * "Take the tour" buttons in Settings and the empty state). Renders nothing.
 */
export function DashboardTour({
  hasBots,
  userKey,
  onGoto,
}: {
  hasBots: boolean;
  userKey: string;
  onGoto: (section: string) => void;
}) {
  useEffect(() => {
    const seenKey = seenKeyFor(userKey);
    const start = () => runTour(hasBots, onGoto, seenKey);
    window.addEventListener("zeva:start-tour", start);

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const seen = localStorage.getItem(seenKey);
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      // Auto-run for any user who hasn't seen it. A brand-new user always has
      // 0 bots, so this is exactly the "new user lands on an empty dashboard →
      // show the tour" case the onboarding relies on. Exception: a visitor who
      // came through "Make it yours" has a pre-filled create modal waiting — let
      // that own the screen instead of stacking a tour on top of it.
      if (!seen && desktop && !getPendingDesign()) {
        timer = setTimeout(start, 900); // let the shell paint
      }
    } catch {
      /* private mode — skip auto-run */
    }

    return () => {
      window.removeEventListener("zeva:start-tour", start);
      if (timer) clearTimeout(timer);
    };
  }, [hasBots, userKey, onGoto]);

  return null;
}

function runTour(
  hasBots: boolean,
  onGoto: (section: string) => void,
  seenKey: string,
) {
  const steps: DriveStep[] = [
    {
      popover: {
        title: "Welcome to Zeva",
        description:
          "This is your dashboard. Here's a quick 30-second tour of where everything lives.",
      },
    },
    {
      element: '[data-tour="nav-bots"]',
      popover: {
        title: "Manage your bots",
        description:
          "Create, customize, pause or delete every chatbot you run — all from one place.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="bot-switcher"]',
      popover: {
        title: "Switch between bots",
        description:
          "Running more than one? Jump between them — or start a new one — from any screen.",
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="nav-knowledge"]',
      popover: {
        title: "Teach your bot",
        description:
          "Upload your docs, FAQs and prices. Your bot answers only from these — never made-up.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="nav-appearance"]',
      popover: {
        title: "Make it yours",
        description:
          "Open Studio to set your bot's colour, welcome message and suggested questions — with a live preview.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="nav-leads"]',
      popover: {
        title: "Capture every lead",
        description:
          "Everyone who leaves their name and number in the chat shows up here, scored hot/warm/cold.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="nav-install"]',
      popover: {
        title: "Go live in one line",
        description:
          "Copy your embed snippet and paste it on your site — WordPress, Shopify, plain HTML, anything.",
        side: "right",
        align: "start",
      },
    },
    {
      popover: {
        title: hasBots ? "You're all set" : "Create your first bot",
        description: hasBots
          ? "That's the tour. You can replay it anytime from Settings."
          : "Head to the Bots tab and hit “New bot” — it takes about a minute to get live.",
      },
    },
  ];

  const d = driver({
    showProgress: true,
    allowClose: true,
    overlayColor: "#0b1020",
    overlayOpacity: 0.6,
    popoverClass: "zeva-tour", // themed in globals.css
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Got it",
    steps,
    onDestroyed: () => {
      try {
        localStorage.setItem(seenKey, "1");
      } catch {
        /* ignore */
      }
      if (!hasBots) onGoto("bots");
    },
  });

  d.drive();
}
