import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";
import Script from "next/script";
import { PageLoader } from "@/components/ui/PageLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Pre-paint, pre-hydration theme boot for EVERY route — sets data-theme from the
// visitor's saved choice (single `zeva-theme` key across the whole site), else
// follows the OS. This prevents a flash of the wrong theme and, crucially, makes
// the auth/app routes (sign-in, sign-up, onboarding, dashboard, admin) honour the
// chosen theme too — not just the marketing/studio/demo pages. The home also arms
// the scroll-reveal CSS; studio/demo let their own useZevaTheme refine it after.
const THEME_BOOT = `(function(){try{var r=document.documentElement,p=location.pathname,t=localStorage.getItem('zeva-theme');var dark=t==='dark'||(t!=='light'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(p==='/')r.classList.add('reveal-ready');r.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`;

export const metadata: Metadata = {
  title: "ochreshift",
  description: "ochreshift Answer Engine — Studio & Widget",
  // Stops Chrome/Google Translate from auto-translating the UI (e.g. into
  // Hindi for browsers set to that locale) — machine translation mangles
  // button labels and layout, so real users should see the original text.
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased notranslate`}>
        <PageLoader />
        <Script id="theme-boot" strategy="beforeInteractive">
          {THEME_BOOT}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
