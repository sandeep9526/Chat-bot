/**
 * Zeva Chat Widget — Embeddable Loader
 * =====================================================================
 * Drop this on any website:
 *
 *   <script
 *     src="https://cdn.zeva.app/widget.js"
 *     data-bot-id="acme-salon"
 *     data-api-url="https://api.your-zeva-deployment.com"
 *     data-name="Acme Salon"
 *     data-accent="#4f46e5"
 *     data-surface="auto"
 *     data-corners="soft"
 *     data-font="system"
 *     data-launcher="pill"
 *     data-position="bottom-right"
 *     data-glass="on"
 *     data-sources="on"
 *     async></script>
 *
 * Full data-* contract: see WIDGET.md. This file has no build step, no
 * external dependencies, and self-mounts on load — no init call needed.
 *
 * ---------------------------------------------------------------------
 * API URL resolution (data-api-url vs inferring from the script's `src`)
 * ---------------------------------------------------------------------
 * We deliberately do NOT infer the backend origin from this script's own
 * `src`. This file is a static asset — in production it's served from a
 * CDN or a static host (e.g. this Next.js app's /public folder), which is
 * almost never the same origin as the FastAPI backend. If we inferred the
 * API host from `src`, a client pasting
 * `<script src="https://cdn.zeva.app/widget.js">` would silently send every
 * /chat and /lead request to the CDN instead of the API — a broken widget
 * with no clear error. Instead: `data-api-url` is authoritative (this is
 * exactly what the Studio embed snippet emits — see src/lib/embed.ts),
 * and falls back to a documented placeholder otherwise so a hand-written
 * snippet without it still boots instead of throwing.
 *
 * ---------------------------------------------------------------------
 * Isolation
 * ---------------------------------------------------------------------
 * Everything mounts inside a Shadow DOM (`{mode:'open'}`) with a single
 * inline <style> scoped to the shadow root. The host page's CSS cannot
 * reach in, and this widget's CSS cannot leak out.
 */
(function () {
  "use strict";

  if (typeof document === "undefined" || typeof window === "undefined") return;

  // ---- capture the owning <script> tag synchronously ----------------------
  // document.currentScript is only valid during this script's own synchronous
  // top-level execution (which is happening right now, even with `async`).
  // We stash it immediately so later async callbacks can still read attrs.
  var scriptEl = document.currentScript || findScriptTagFallback();

  function findScriptTagFallback() {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var s = scripts[i];
      if (s.hasAttribute("data-bot-id") || /widget\.js(\?|$)/.test(s.src || "")) {
        return s;
      }
    }
    return null;
  }

  function hasAttr(name) {
    return !!(scriptEl && scriptEl.hasAttribute(name) && scriptEl.getAttribute(name) !== "");
  }

  function getAttr(name, fallback) {
    if (!scriptEl) return fallback;
    var v = scriptEl.getAttribute(name);
    return v === null || v === "" ? fallback : v;
  }

  function toPx(raw, fallback) {
    var n = parseInt(raw, 10);
    return isNaN(n) ? fallback : n;
  }

  var HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  // ---- data-* attribute contract (see WIDGET.md) ---------------------------
  var BOT_ID = getAttr("data-bot-id", "acme-salon");
  var DEFAULT_API_URL = "https://api.zeva.app"; // documented placeholder — see comment block above
  var API_URL = getAttr("data-api-url", DEFAULT_API_URL).replace(/\/+$/, "");

  var NAME_EXPLICIT = hasAttr("data-name");
  var ACCENT_EXPLICIT = hasAttr("data-accent");

  var RAW = {
    name: getAttr("data-name", ""),
    accent: HEX_RE.test(getAttr("data-accent", "")) ? getAttr("data-accent", "") : "#4f46e5",
    surface: getAttr("data-surface", "auto"),
    corners: getAttr("data-corners", "soft"),
    font: getAttr("data-font", "system"),
    fontFamily: getAttr("data-font-family", ""),
    fontUrl: getAttr("data-font-url", ""),
    launcher: getAttr("data-launcher", "pill"),
    position: getAttr("data-position", "bottom-right"),
    glass: getAttr("data-glass", "on") !== "off",
    sources: getAttr("data-sources", "on") !== "off",
    offsetX: toPx(getAttr("data-offset-x", "24"), 24),
    offsetY: toPx(getAttr("data-offset-y", "24"), 24),
    whitelabel: getAttr("data-whitelabel", "off") === "on",
    draggable: getAttr("data-draggable", "off") === "on",
    logo: getAttr("data-logo", ""),
  };

  var HAS_FETCH = typeof fetch === "function";

  // ---- small utilities ------------------------------------------------------
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Darken a hex colour by `amt` (0-1) — mirrors src/lib/color.ts shade(). */
  function shade(hex, amt) {
    amt = amt == null ? 0.16 : amt;
    var h = String(hex || "#4f46e5").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = "4f46e5";
    var n = parseInt(h, 16);
    var r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
    var g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
    var b = Math.max(0, Math.round((n & 255) * (1 - amt)));
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  function hexToRgba(hex, alpha) {
    var h = String(hex || "#4f46e5").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = "4f46e5";
    var n = parseInt(h, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function whenBodyReady(cb) {
    if (document.body) { cb(); return; }
    document.addEventListener("DOMContentLoaded", function handler() {
      document.removeEventListener("DOMContentLoaded", handler);
      cb();
    });
  }

  var GENERIC_SUGGESTIONS = [
    "What services do you offer?",
    "What are your prices?",
    "Where are you located?",
    "What are your working hours?",
    "How can I contact you?",
  ];

  // ---- widget state -----------------------------------------------------
  var state = {
    name: RAW.name || "Chat with us",
    accent: RAW.accent,
    accentStrong: shade(RAW.accent),
    welcome: "Ask in your own words — every answer comes from our documents.",
    suggestions: GENERIC_SUGGESTIONS.slice(),
    configStatus: "loading", // loading | ready | error
    configErrorMessage: "",
    isOpen: false,
    isScanning: false,
  };

  // DOM refs (populated in mount())
  var hostEl, shadow, anchorEl, panelEl, launcherWrapEl, streamEl;

  function boot() {
    try {
      whenBodyReady(mount);
    } catch (e) {
      if (window.console && console.error) console.error("[Zeva Widget] failed to initialize", e);
    }
  }

  // =======================================================================
  // Icons (inline SVG strings — no external icon font/CDN)
  // =======================================================================
  var ICON_SPARK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M5 12H2M22 12h-3"/><circle cx="12" cy="12" r="3.4"/></svg>';
  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  var ICON_ARROW =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ICON_WARNING =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>';
  var ICON_FILE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>';
  var ICON_USERPLUS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6M19 8v6"/></svg>';
  var ICON_CHECK_BOLD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  // =======================================================================
  // CSS (fully static — dynamic values are applied as CSS custom props /
  // data-* attributes on .zeva-anchor at runtime, never interpolated here)
  // =======================================================================
  function buildCss() {
    return (
      ":host{all:initial;}" +
      ".zeva-anchor,.zeva-anchor *,.zeva-anchor *::before,.zeva-anchor *::after{box-sizing:border-box;}" +
      ".zeva-anchor{" +
      "all:initial;position:fixed;z-index:2147483000;display:flex;gap:0;" +
      "width:min(430px, calc(100vw - 48px));" +
      "font-family:var(--font-family, var(--ui-stack));-webkit-font-smoothing:antialiased;" +
      "--accent:#4f46e5;--accent-strong:#4338ca;--accent-soft:rgba(79,70,229,.14);--accent-ring:rgba(79,70,229,.26);--good:#10b981;" +
      "--surface:#ffffff;--glass:rgba(255,255,255,.72);--panel:#f6f8fc;--paper:#fffef8;--paper-rule:#eceadd;" +
      "--text:#1e293b;--muted:#64748b;--faint:#97a1b2;--border:#e5e9f2;--ring:#eef1f8;" +
      "--shadow:0 30px 70px -24px rgba(30,41,90,.42),0 10px 26px -14px rgba(30,41,90,.28);" +
      "--ui-stack:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;" +
      "--mono:ui-monospace,'SF Mono','JetBrains Mono',Menlo,Consolas,monospace;" +
      "--r1:11px;--r2:14px;--r3:22px;" +
      "}" +
      ".zeva-anchor.zeva-gap{gap:12px;}" +
      ".zeva-anchor[data-theme='dark']{--surface:#0f172a;--glass:rgba(15,23,42,.72);--panel:rgba(2,6,23,.5);--paper:#131a2b;--paper-rule:#22304b;--text:#eef2f9;--muted:#93a1b8;--faint:#5c6c86;--border:#1e293b;--ring:#1e293b;--shadow:0 34px 80px -24px rgba(0,0,0,.75),0 10px 30px -14px rgba(0,0,0,.6);}" +
      ".zeva-anchor[data-corners='sharp']{--r1:5px;--r2:7px;--r3:10px;}" +
      ".zeva-anchor[data-corners='round']{--r1:16px;--r2:20px;--r3:28px;}" +
      ".zeva-anchor[data-font='rounded']{--font-family:ui-rounded,'SF Pro Rounded','Hiragino Maru Gothic ProN','Quicksand',system-ui,sans-serif;}" +
      ".zeva-anchor[data-font='serif']{--font-family:'Iowan Old Style','Palatino Linotype',Georgia,'Times New Roman',serif;}" +
      ".zeva-anchor[data-font='mono']{--font-family:var(--mono);}" +
      // Launcher
      ".zeva-launcher{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:14px;font-weight:650;box-shadow:var(--shadow);transition:transform .1s ease-out;}" +
      ".zeva-launcher:hover{transform:translateY(-1px);}" +
      ".zeva-launcher:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}" +
      ".zeva-launcher.zeva-variant-pill{border-radius:999px;padding:11px 16px 11px 12px;}" +
      ".zeva-launcher.zeva-variant-bubble{width:58px;height:58px;padding:0;justify-content:center;border-radius:999px;}" +
      ".zeva-launcher.zeva-variant-bar{width:100%;justify-content:flex-start;border-radius:var(--r2);padding:11px 16px 11px 12px;}" +
      ".zeva-launcher.zeva-glass{background:var(--glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);}" +
      ".zeva-launcher.zeva-solid{background:var(--surface);}" +
      ".zeva-launcher.zeva-variant-bubble{background:linear-gradient(135deg,var(--accent),var(--accent-strong));color:#fff;border-color:transparent;}" +
      ".zeva-launcher.zeva-breathe{animation:zeva-breathe 4.5s ease-in-out infinite;}" +
      ".zeva-launcher.zeva-unavailable{opacity:.7;}" +
      ".zeva-launcher-icon{display:grid;place-items:center;flex-shrink:0;overflow:hidden;border-radius:999px;width:25px;height:25px;}" +
      ".zeva-variant-bubble .zeva-launcher-icon{width:30px;height:30px;}" +
      ".zeva-launcher-icon.zeva-orb{background:linear-gradient(135deg,var(--accent),var(--accent-strong));color:#fff;}" +
      ".zeva-launcher-icon img{width:100%;height:100%;border-radius:50%;object-fit:cover;}" +
      ".zeva-launcher-icon.zeva-orb img{border-radius:50%;}" +
      ".zeva-launcher-icon svg{width:14px;height:14px;}" +
      ".zeva-variant-bubble .zeva-launcher-icon svg{width:26px;height:26px;color:#fff;}" +
      ".zeva-launcher-label{line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;}" +
      ".zeva-launcher-kbd{border:1px solid var(--border);border-radius:6px;padding:1px 6px;font-family:var(--mono);font-size:11px;color:var(--faint);}" +
      ".zeva-launcher-dot{position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#f59e0b;border:2px solid var(--surface);}" +
      ".zeva-draggable .zeva-launcher{cursor:grab;}" +
      ".zeva-anchor.zeva-dragging{transition:none !important;}" +
      ".zeva-anchor.zeva-dragging .zeva-launcher{cursor:grabbing;}" +
      // Panel
      ".zeva-panel{display:flex;flex-direction:column;overflow:hidden;width:100%;border-radius:var(--r3);border-width:0;box-shadow:var(--shadow);background:var(--surface);color:var(--text);transform-origin:var(--panel-origin, bottom right);transition:opacity .3s ease-out,transform .3s ease-out;opacity:0;transform:scale(.94) translateY(14px);pointer-events:none;height:0;max-height:0;}" +
      ".zeva-panel.zeva-glass{background:var(--glass);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);}" +
      ".zeva-panel.zeva-open{opacity:1;transform:scale(1) translateY(0);pointer-events:auto;height:560px;max-height:calc(100vh - 150px);border-width:1px;border-style:solid;border-color:var(--border);}" +
      ".zeva-header{display:flex;align-items:center;gap:10px;padding:13px 14px;border-bottom:1px solid var(--border);flex-shrink:0;}" +
      ".zeva-header-avatar{width:26px;height:26px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--accent),var(--accent-strong));box-shadow:0 0 0 4px var(--accent-soft);}" +
      ".zeva-header-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;}" +
      ".zeva-header-name{flex:1;min-width:0;font-size:13.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
      ".zeva-header-close{all:unset;box-sizing:border-box;display:grid;place-items:center;width:30px;height:30px;border-radius:8px;cursor:pointer;color:var(--muted);}" +
      ".zeva-header-close:hover{background:var(--ring);color:var(--text);}" +
      ".zeva-header-close:focus-visible{outline:2px solid var(--accent);}" +
      ".zeva-header-close svg{width:16px;height:16px;}" +
      // Composer
      ".zeva-composer{position:relative;margin:12px;flex-shrink:0;}" +
      ".zeva-composer-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--accent);display:grid;place-items:center;pointer-events:none;}" +
      ".zeva-composer-icon svg{width:16px;height:16px;}" +
      ".zeva-input{width:100%;border:1px solid var(--border);border-radius:var(--r2);background:var(--surface);color:var(--text);padding:12px 44px 12px 38px;font-size:14px;font-family:inherit;outline:none;}" +
      ".zeva-input:focus{border-color:var(--accent);box-shadow:0 0 0 4px var(--accent-ring);}" +
      ".zeva-input:disabled{opacity:.6;cursor:not-allowed;}" +
      ".zeva-send{all:unset;box-sizing:border-box;position:absolute;right:7px;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:var(--r1);display:grid;place-items:center;background:var(--accent);color:#fff;cursor:pointer;}" +
      ".zeva-send:disabled{opacity:.35;cursor:not-allowed;}" +
      ".zeva-send:focus-visible{outline:2px solid var(--accent-ring);}" +
      ".zeva-send svg{width:16px;height:16px;}" +
      // Stream
      ".zeva-stream{flex:1;overflow-y:auto;padding:2px 14px 14px;display:flex;flex-direction:column;gap:16px;scrollbar-width:thin;scrollbar-color:var(--border) transparent;}" +
      ".zeva-stream::-webkit-scrollbar{width:5px;}" +
      ".zeva-stream::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}" +
      ".zeva-welcome{font-size:13px;line-height:1.5;color:var(--muted);margin:4px 2px 12px;}" +
      ".zeva-unavailable{margin:0 2px;padding:12px 14px;border-radius:var(--r2);border:1px dashed var(--border);background:var(--panel);font-size:12.5px;line-height:1.5;color:var(--muted);}" +
      ".zeva-chips{display:flex;flex-direction:column;gap:7px;}" +
      ".zeva-chip{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;border:1px solid var(--border);border-radius:var(--r1);background:var(--surface);padding:9px 11px;font-size:13px;color:var(--text);cursor:pointer;transition:border-color .1s,transform .1s;}" +
      ".zeva-chip:hover{border-color:var(--accent);transform:translateX(2px);}" +
      ".zeva-chip:focus-visible{outline:2px solid var(--accent);}" +
      ".zeva-chip svg{width:14px;height:14px;flex-shrink:0;color:var(--accent);}" +
      ".zeva-chip-text{flex:1;text-align:left;}" +
      ".zeva-chip-kbd{border:1px solid var(--border);border-radius:5px;padding:1px 5px;font-family:var(--mono);font-size:10px;color:var(--faint);}" +
      // Messages
      ".zeva-msg-user{align-self:flex-end;max-width:85%;background:var(--accent);color:#fff;border-radius:var(--r1);border-bottom-right-radius:5px;padding:8px 12px;font-size:13px;font-weight:500;line-height:1.5;white-space:pre-wrap;word-break:break-word;}" +
      ".zeva-msg-assistant{display:flex;flex-direction:column;}" +
      ".zeva-msg-assistant-head{display:flex;align-items:flex-start;gap:9px;}" +
      ".zeva-msg-assistant-head>svg{width:16px;height:16px;margin-top:3px;flex-shrink:0;color:var(--accent);}" +
      ".zeva-msg-assistant-text{font-size:15px;font-weight:500;line-height:1.5;color:var(--text);white-space:pre-wrap;word-break:break-word;}" +
      ".zeva-guardrail{margin-top:12px;display:flex;align-items:center;gap:10px;border:1px dashed var(--border);border-radius:var(--r2);padding:10px 12px;font-size:12.5px;color:var(--muted);}" +
      ".zeva-guardrail svg{width:16px;height:16px;color:#f59e0b;flex-shrink:0;}" +
      ".zeva-connector{position:relative;margin:8px 0 8px 7px;width:2px;height:16px;background:linear-gradient(var(--accent),transparent);}" +
      ".zeva-connector::after{content:'';position:absolute;bottom:0;left:-2px;width:6px;height:6px;border-radius:50%;background:var(--accent);}" +
      // Scan indicator
      ".zeva-scan{display:flex;flex-direction:column;gap:8px;}" +
      ".zeva-scan-label{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:11.5px;color:var(--muted);}" +
      ".zeva-scan-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);animation:zeva-blink 1s infinite;}" +
      ".zeva-scan-bar{height:9px;border-radius:5px;background:linear-gradient(90deg,var(--ring),var(--accent-soft),var(--ring));background-size:200% 100%;animation:zeva-sweep 1.1s linear infinite;}" +
      ".zeva-scan-bar.zeva-w1{width:92%;}" +
      ".zeva-scan-bar.zeva-w2{width:74%;animation-delay:.15s;}" +
      ".zeva-scan-bar.zeva-w3{width:84%;animation-delay:.3s;}" +
      // Proof card
      ".zeva-proof-wrap{margin-top:8px;}" +
      ".zeva-proof{border-radius:var(--r2);border:1px solid var(--paper-rule);background:var(--paper);overflow:hidden;transform-origin:top;transition:opacity .35s ease-out,transform .35s ease-out;opacity:0;transform:translateY(-6px) scaleY(.8);}" +
      ".zeva-proof.zeva-revealed{opacity:1;transform:translateY(0) scaleY(1);}" +
      ".zeva-proof-meta{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--paper-rule);padding:8px 11px;}" +
      ".zeva-proof-file{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;font-weight:600;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}" +
      ".zeva-proof-file svg{width:13px;height:13px;color:var(--accent);flex-shrink:0;}" +
      ".zeva-proof-match{margin-left:auto;display:flex;align-items:center;gap:7px;flex-shrink:0;}" +
      ".zeva-proof-bar{width:44px;height:5px;border-radius:3px;background:var(--ring);overflow:hidden;}" +
      ".zeva-proof-bar-fill{display:block;height:100%;width:0%;background:var(--good);transition:width .6s ease-out .2s;}" +
      ".zeva-proof.zeva-revealed .zeva-proof-bar-fill{width:var(--match,0%);}" +
      ".zeva-proof-pct{font-family:var(--mono);font-size:10.5px;font-weight:700;color:var(--good);white-space:nowrap;}" +
      ".zeva-proof-snip{padding:11px 12px;font-size:12.5px;line-height:1.7;color:var(--muted);background-image:repeating-linear-gradient(var(--paper) 0 27px, var(--paper-rule) 27px 28px);}" +
      ".zeva-proof-snip mark{background:var(--accent-soft);color:var(--text);border-radius:3px;padding:1px 3px;font-weight:600;}" +
      // Lead affordance + ticket
      ".zeva-lead-btn{all:unset;box-sizing:border-box;margin-top:12px;display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);border-radius:var(--r1);background:var(--panel);padding:8px 12px;font-size:12.5px;font-weight:600;color:var(--text);cursor:pointer;}" +
      ".zeva-lead-btn:hover{border-color:var(--accent);}" +
      ".zeva-lead-btn:focus-visible{outline:2px solid var(--accent);}" +
      ".zeva-lead-btn svg{width:14px;height:14px;color:var(--accent);}" +
      ".zeva-ticket-wrap{margin-top:12px;}" +
      ".zeva-ticket{position:relative;border-radius:var(--r1);border:1px solid var(--paper-rule);background:var(--paper);padding:16px;box-shadow:0 10px 26px -12px rgba(30,41,90,.35);transition:transform .45s ease-out,opacity .45s ease-out;}" +
      ".zeva-ticket.zeva-sent{transform:translateY(-8px) rotate(-1deg);}" +
      ".zeva-ticket.zeva-gone{transform:translateY(30px) scale(.9);opacity:0;}" +
      ".zeva-ticket-stamp{position:absolute;right:12px;top:12px;transform:rotate(9deg);border:2px solid var(--accent);border-radius:6px;padding:3px 7px;font-family:var(--mono);font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--accent);opacity:.85;}" +
      ".zeva-ticket-title{font-family:var(--mono);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--faint);margin:0;padding-right:70px;}" +
      ".zeva-ticket-sub{margin:4px 0 12px;font-size:13.5px;font-weight:650;color:var(--text);}" +
      ".zeva-ticket-fields{display:flex;flex-direction:column;gap:8px;}" +
      ".zeva-ticket-input{width:100%;border:0;border-bottom:1.5px dashed var(--paper-rule);background:transparent;padding:7px 2px;font-size:13.5px;font-family:inherit;color:var(--text);outline:none;}" +
      ".zeva-ticket-input:focus{border-bottom-color:var(--accent);}" +
      ".zeva-ticket-submit{all:unset;box-sizing:border-box;display:block;width:100%;margin-top:12px;border-radius:var(--r1);padding:11px;text-align:center;font-size:13.5px;font-weight:700;color:#fff;background:var(--accent);cursor:pointer;}" +
      ".zeva-ticket-submit:disabled{opacity:.4;cursor:not-allowed;}" +
      ".zeva-ticket-submit:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}" +
      ".zeva-stub{margin-top:12px;display:flex;align-items:center;gap:10px;border-radius:var(--r2);padding:12px 14px;font-size:13px;border:1px solid rgba(16,185,129,.3);background:rgba(16,185,129,.12);}" +
      ".zeva-stub-check{width:24px;height:24px;border-radius:50%;background:var(--good);color:#fff;display:grid;place-items:center;flex-shrink:0;}" +
      ".zeva-stub-check svg{width:14px;height:14px;}" +
      ".zeva-stub-name{display:block;margin-top:2px;font-size:11.5px;color:var(--muted);}" +
      // Footer
      ".zeva-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--border);padding:9px 14px;flex-shrink:0;font-size:10.5px;color:var(--faint);}" +
      ".zeva-footer-left{display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden;}" +
      ".zeva-footer-left>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
      ".zeva-footer-left svg{width:12px;height:12px;color:var(--good);flex-shrink:0;}" +
      ".zeva-footer-brand{flex-shrink:0;}" +
      ".zeva-footer-brand b{color:var(--muted);font-weight:700;}" +
      // Keyframes
      "@keyframes zeva-breathe{0%,100%{box-shadow:var(--shadow),0 0 0 0 var(--accent-soft);}50%{box-shadow:var(--shadow),0 0 0 9px transparent;}}" +
      "@keyframes zeva-blink{0%,100%{opacity:1;}50%{opacity:.25;}}" +
      "@keyframes zeva-sweep{0%{background-position:200% 0;}100%{background-position:-200% 0;}}" +
      "@media (prefers-reduced-motion: reduce){.zeva-anchor,.zeva-anchor *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;}}" +
      // Mobile: panel goes near-fullscreen; launcher stays put.
      "@media (max-width: 480px){" +
      ".zeva-panel.zeva-open{position:fixed;inset:8px;width:auto;height:auto;max-height:none;border-radius:var(--r3);z-index:2147483001;}" +
      "}" +
      "@media (max-width: 340px){" +
      ".zeva-panel.zeva-open{inset:0;border-radius:0;}" +
      "}"
    );
  }

  // =======================================================================
  // Theme / placement / font application
  // =======================================================================
  function effectiveTheme() {
    if (RAW.surface === "light" || RAW.surface === "dark") return RAW.surface;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme() {
    anchorEl.setAttribute("data-theme", effectiveTheme());
    anchorEl.setAttribute(
      "data-corners",
      ["sharp", "soft", "round"].indexOf(RAW.corners) >= 0 ? RAW.corners : "soft"
    );
    anchorEl.style.setProperty("--accent", state.accent);
    anchorEl.style.setProperty("--accent-strong", state.accentStrong);
    anchorEl.style.setProperty("--accent-soft", hexToRgba(state.accent, 0.14));
    anchorEl.style.setProperty("--accent-ring", hexToRgba(state.accent, 0.26));
  }

  function watchSystemTheme() {
    if (RAW.surface !== "auto" || !window.matchMedia) return;
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onChange = function () { anchorEl.setAttribute("data-theme", effectiveTheme()); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange); // legacy Safari
  }

  function applyPlacement() {
    var anchor = ["top-left", "top-right", "bottom-left", "bottom-right"].indexOf(RAW.position) >= 0
      ? RAW.position
      : "bottom-right";
    var parts = anchor.split("-");
    var v = parts[0], h = parts[1];
    var align = h === "left" ? "flex-start" : "flex-end";
    var direction = v === "top" ? "column" : "column-reverse";

    anchorEl.style.left = h === "left" ? RAW.offsetX + "px" : "auto";
    anchorEl.style.right = h === "right" ? RAW.offsetX + "px" : "auto";
    anchorEl.style.top = v === "top" ? RAW.offsetY + "px" : "auto";
    anchorEl.style.bottom = v === "bottom" ? RAW.offsetY + "px" : "auto";
    anchorEl.style.flexDirection = direction;
    anchorEl.style.alignItems = align;
    anchorEl.style.setProperty("--panel-origin", (v === "top" ? "top" : "bottom") + " " + (h === "left" ? "left" : "right"));
  }

  // =======================================================================
  // Drag-to-reposition (data-draggable="on" only). Only the closed launcher
  // is draggable — dragging the open panel isn't supported, same as the
  // Studio design-time preview this mirrors. On release, snaps to whichever
  // of the 4 corners the pointer ended up nearest, then re-applies the
  // normal corner-based placement (so it never drifts to an unsupported
  // free-floating position) — a small movement (<6px) is still treated as
  // a plain click, not a drag, so opening the panel still works normally.
  // =======================================================================
  function setupDrag(launcherBtn) {
    var drag = null;

    function onPointerDown(e) {
      if (state.isOpen || e.button === 2) return;
      var rect = anchorEl.getBoundingClientRect();
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        rectLeft: rect.left,
        rectTop: rect.top,
        moved: false,
      };
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp, { once: true });
    }

    function onPointerMove(e) {
      if (!drag) return;
      var dx = e.clientX - drag.startX;
      var dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        anchorEl.classList.add("zeva-dragging");
      }
      var vw = window.innerWidth, vh = window.innerHeight;
      var rect = anchorEl.getBoundingClientRect();
      var left = Math.min(Math.max(0, drag.rectLeft + dx), vw - rect.width);
      var top = Math.min(Math.max(0, drag.rectTop + dy), vh - rect.height);
      anchorEl.style.left = left + "px";
      anchorEl.style.top = top + "px";
      anchorEl.style.right = "auto";
      anchorEl.style.bottom = "auto";
    }

    function onPointerUp() {
      document.removeEventListener("pointermove", onPointerMove);
      var wasDrag = drag && drag.moved;
      anchorEl.classList.remove("zeva-dragging");

      if (wasDrag) {
        // Snap to nearest corner from the final drop position.
        var rect = anchorEl.getBoundingClientRect();
        var vw = window.innerWidth, vh = window.innerHeight;
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var h = cx < vw / 2 ? "left" : "right";
        var v = cy < vh / 2 ? "top" : "bottom";
        RAW.position = v + "-" + h;
        RAW.offsetX = Math.max(8, Math.round(h === "left" ? rect.left : vw - rect.right));
        RAW.offsetY = Math.max(8, Math.round(v === "top" ? rect.top : vh - rect.bottom));
        applyPlacement();

        // A drag's pointerup is immediately followed by a synthetic click on
        // the same element — swallow just that one so it doesn't also
        // trigger openPanel().
        launcherBtn.addEventListener(
          "click",
          function (ce) { ce.preventDefault(); ce.stopImmediatePropagation(); },
          { capture: true, once: true },
        );
      }
      drag = null;
    }

    launcherBtn.addEventListener("pointerdown", onPointerDown);
  }

  function loadGoogleFont(name) {
    var id = "zeva-widget-google-font";
    var link = document.getElementById(id);
    var href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(name).replace(/%20/g, "+") + ":wght@400;500;600;700&display=swap";
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  }

  function loadCustomFont(family, url) {
    var id = "zeva-widget-custom-font";
    var styleTag = document.getElementById(id);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = id;
      document.head.appendChild(styleTag);
    }
    var fam = String(family).replace(/"/g, "");
    var src = String(url).replace(/"/g, "");
    var fmt = /\.woff2(\?|$)/i.test(src) ? "woff2"
      : /\.woff(\?|$)/i.test(src) ? "woff"
      : /\.otf(\?|$)/i.test(src) ? "opentype"
      : /\.ttf(\?|$)/i.test(src) ? "truetype"
      : "woff2";
    styleTag.textContent = '@font-face{font-family:"' + fam + '";src:url("' + src + '") format("' + fmt + '");font-weight:100 900;font-display:swap;}';
  }

  function applyFont() {
    var fontVal = RAW.font || "system";
    if (fontVal.indexOf("google:") === 0) {
      var family = fontVal.slice(7).trim() || "Poppins";
      loadGoogleFont(family);
      anchorEl.style.setProperty("--font-family", '"' + family.replace(/"/g, "") + '", var(--ui-stack)');
      anchorEl.removeAttribute("data-font");
    } else if (fontVal === "inherit") {
      anchorEl.style.setProperty("--font-family", "inherit");
      anchorEl.removeAttribute("data-font");
    } else if (RAW.fontFamily) {
      if (RAW.fontUrl) loadCustomFont(RAW.fontFamily, RAW.fontUrl);
      anchorEl.style.setProperty("--font-family", '"' + RAW.fontFamily.replace(/"/g, "") + '", var(--ui-stack)');
      anchorEl.removeAttribute("data-font");
    } else {
      anchorEl.style.removeProperty("--font-family");
      anchorEl.setAttribute("data-font", ["system", "rounded", "serif", "mono"].indexOf(fontVal) >= 0 ? fontVal : "system");
    }
  }

  // =======================================================================
  // Static HTML skeletons
  // =======================================================================
  function buildLauncherHtml() {
    var variant = ["pill", "bubble", "bar"].indexOf(RAW.launcher) >= 0 ? RAW.launcher : "pill";
    var glassClass = variant === "bubble" ? "" : RAW.glass ? "zeva-glass" : "zeva-solid";
    var label = state.configStatus === "error" ? "Chat unavailable" : "Ask " + state.name;
    var launcherIcon = RAW.logo
      ? '<span class="zeva-launcher-icon' + (variant === "bubble" ? "" : " zeva-orb") + '"><img src="' + escapeHtml(RAW.logo) + '" alt="" /></span>'
      : '<span class="zeva-launcher-icon' + (variant === "bubble" ? "" : " zeva-orb") + '">' + ICON_SPARK + "</span>";
    var html =
      '<button type="button" class="zeva-launcher zeva-variant-' + variant + " " + glassClass +
      (state.configStatus !== "error" ? " zeva-breathe" : "") +
      '" aria-label="' + escapeHtml(label) + '" id="zeva-launcher-btn">' +
      launcherIcon;
    if (variant !== "bubble") {
      html +=
        '<span class="zeva-launcher-label" id="zeva-launcher-label">' + escapeHtml(label) + "</span>" +
        '<span class="zeva-launcher-kbd">/</span>';
    }
    html += "</button>";
    return html;
  }

  function buildPanelSkeletonHtml() {
    // Always render branded by default — data-whitelabel is the client's
    // *request*, not a grant. The server has final say (cfg.whitelabelAllowed,
    // driven by the bot owner's plan) and this gets hidden in onConfigLoaded()
    // only if the server actually allows it. Prevents a free-tier embed from
    // simply setting data-whitelabel="on" itself to remove branding for free.
    var brandRow = '<span class="zeva-footer-brand" id="zeva-footer-brand">Powered by <b>Zeva</b></span>';
    var headerAvatar = RAW.logo
      ? '<div class="zeva-header-avatar"><img src="' + escapeHtml(RAW.logo) + '" alt="" /></div>'
      : '<div class="zeva-header-avatar"></div>';
    return (
      '<div class="zeva-header">' +
      headerAvatar +
      '<div class="zeva-header-name" id="zeva-header-name"></div>' +
      '<button type="button" class="zeva-header-close" id="zeva-close-btn" aria-label="Close">' + ICON_CLOSE + "</button>" +
      "</div>" +
      '<form class="zeva-composer" id="zeva-composer-form" autocomplete="off">' +
      '<span class="zeva-composer-icon">' + ICON_SPARK + "</span>" +
      '<input class="zeva-input" id="zeva-input" type="text" placeholder="" />' +
      '<button type="submit" class="zeva-send" id="zeva-send-btn" aria-label="Ask" disabled>' + ICON_ARROW + "</button>" +
      "</form>" +
      '<div class="zeva-stream" id="zeva-stream"></div>' +
      '<div class="zeva-footer">' +
      '<span class="zeva-footer-left" id="zeva-footer-left">' + ICON_CHECK + "<span>Grounded in your documents</span></span>" +
      brandRow +
      "</div>"
    );
  }

  // =======================================================================
  // Mount
  // =======================================================================
  function mount() {
    hostEl = document.createElement("div");
    hostEl.id = "zeva-widget-root-" + BOT_ID.replace(/[^a-zA-Z0-9_-]/g, "");
    document.body.appendChild(hostEl);

    if (typeof hostEl.attachShadow !== "function") {
      // No Shadow DOM support — bail rather than inject unscoped styles that
      // could clash with (or be broken by) the host page.
      if (window.console && console.warn) {
        console.warn("[Zeva Widget] Shadow DOM is not supported in this browser; widget disabled.");
      }
      return;
    }

    shadow = hostEl.attachShadow({ mode: "open" });

    var styleTag = document.createElement("style");
    styleTag.textContent = buildCss();
    shadow.appendChild(styleTag);

    anchorEl = document.createElement("div");
    anchorEl.className = "zeva-anchor" + (RAW.draggable ? " zeva-draggable" : "");
    shadow.appendChild(anchorEl);

    applyTheme();
    watchSystemTheme();
    applyPlacement();
    applyFont();

    panelEl = document.createElement("div");
    panelEl.className = "zeva-panel" + (RAW.glass ? " zeva-glass" : "");
    panelEl.id = "zeva-panel";
    panelEl.setAttribute("role", "dialog");
    panelEl.setAttribute("aria-label", "Ask " + state.name);
    panelEl.setAttribute("aria-hidden", "true");
    panelEl.setAttribute("inert", "");
    panelEl.innerHTML = buildPanelSkeletonHtml();
    anchorEl.appendChild(panelEl);

    launcherWrapEl = document.createElement("div");
    launcherWrapEl.innerHTML = buildLauncherHtml();
    anchorEl.appendChild(launcherWrapEl);

    streamEl = shadow.getElementById("zeva-stream");

    var closeBtn = shadow.getElementById("zeva-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closePanel);

    var launcherBtn = shadow.getElementById("zeva-launcher-btn");
    if (launcherBtn) launcherBtn.addEventListener("click", openPanel);
    if (RAW.draggable && launcherBtn) setupDrag(launcherBtn);

    var input = shadow.getElementById("zeva-input");
    var sendBtn = shadow.getElementById("zeva-send-btn");
    if (input) {
      input.addEventListener("input", function () {
        if (sendBtn) sendBtn.disabled = !input.value.trim() || state.isScanning || state.configStatus === "error";
      });
    }

    var form = shadow.getElementById("zeva-composer-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!input) return;
        var text = input.value;
        input.value = "";
        if (sendBtn) sendBtn.disabled = true;
        ask(text);
      });
    }

    refreshBranding();
    renderEmptyState();
    fetchConfig();
  }

  function openPanel() {
    if (state.isOpen) return;
    state.isOpen = true;
    panelEl.classList.add("zeva-open");
    panelEl.setAttribute("aria-hidden", "false");
    panelEl.removeAttribute("inert");
    launcherWrapEl.style.display = "none";
    anchorEl.classList.add("zeva-gap");
    var input = shadow.getElementById("zeva-input");
    if (input && !input.disabled) setTimeout(function () { input.focus(); }, 30);
  }

  function closePanel() {
    if (!state.isOpen) return;
    state.isOpen = false;
    panelEl.classList.remove("zeva-open");
    panelEl.setAttribute("aria-hidden", "true");
    panelEl.setAttribute("inert", "");
    launcherWrapEl.style.display = "";
    anchorEl.classList.remove("zeva-gap");
  }

  // =======================================================================
  // Branding / empty-state refresh (called at mount, and again once /config
  // resolves — see fetchConfig()).
  // =======================================================================
  function refreshBranding() {
    var headerName = shadow.getElementById("zeva-header-name");
    if (headerName) headerName.textContent = state.name;

    var input = shadow.getElementById("zeva-input");
    if (input) {
      var placeholder = state.configStatus === "error" ? "Chat is currently unavailable" : "Ask anything about " + state.name + "…";
      input.setAttribute("placeholder", placeholder);
      input.setAttribute("aria-label", placeholder);
    }

    var label = state.configStatus === "error" ? "Chat unavailable" : "Ask " + state.name;
    var launcherLabelEl = shadow.getElementById("zeva-launcher-label");
    if (launcherLabelEl) launcherLabelEl.textContent = label;
    var launcherBtn = shadow.getElementById("zeva-launcher-btn");
    if (launcherBtn) launcherBtn.setAttribute("aria-label", label);

    if (panelEl) panelEl.setAttribute("aria-label", "Ask " + state.name);
  }

  /** Update logo in header + launcher after /config loads with a saved logo. */
  function refreshLogo() {
    if (!RAW.logo) return;
    // Header avatar
    var avatarEl = shadow.querySelector(".zeva-header-avatar");
    if (avatarEl && !avatarEl.querySelector("img")) {
      var img = document.createElement("img");
      img.src = RAW.logo;
      img.alt = "";
      avatarEl.innerHTML = "";
      avatarEl.appendChild(img);
    }
    // Launcher icon
    var launcherIcon = shadow.querySelector(".zeva-launcher-icon");
    if (launcherIcon && !launcherIcon.querySelector("img")) {
      var img2 = document.createElement("img");
      img2.src = RAW.logo;
      img2.alt = "";
      launcherIcon.innerHTML = "";
      launcherIcon.appendChild(img2);
    }
  }

  /** Re-render the entire launcher (used when launcher style changes from config). */
  function refreshLauncher() {
    var old = shadow.getElementById("zeva-launcher-btn");
    if (!old) return;
    var tmp = document.createElement("div");
    tmp.innerHTML = buildLauncherHtml();
    var fresh = tmp.firstChild;
    old.parentNode.replaceChild(fresh, old);
    attachDragListeners();
  }

  /** Apply a font family to the widget shadow root. */
  function applyFontFamily(family) {
    if (!family || !shadow) return;
    shadow.host.style.setProperty("--widget-font", '"' + family + '", sans-serif');
    var styleTag = shadow.querySelector("style");
    if (styleTag) {
      var css = styleTag.textContent;
      // Inject or update font-family override at the end
      var marker = "/* @zeva-font-override */";
      var override = marker + "\n.zeva-panel,.zeva-launcher{font-family:\"" + family + "\",sans-serif !important;}";
      if (css.indexOf(marker) >= 0) {
        styleTag.textContent = css.replace(new RegExp(marker[0] + ".*?" + marker.slice(-1) + "[\\s\\S]*$"), override);
      } else {
        styleTag.textContent = css + "\n" + override;
      }
    }
  }

  function refreshLauncherAvailability() {
    var btn = shadow.getElementById("zeva-launcher-btn");
    if (!btn) return;
    if (state.configStatus === "error") {
      btn.classList.remove("zeva-breathe");
      btn.classList.add("zeva-unavailable");
      if (!shadow.getElementById("zeva-launcher-dot")) {
        var dot = document.createElement("span");
        dot.className = "zeva-launcher-dot";
        dot.id = "zeva-launcher-dot";
        dot.title = "Chat unavailable";
        btn.appendChild(dot);
      }
      var footerLeft = shadow.getElementById("zeva-footer-left");
      if (footerLeft) footerLeft.style.display = "none";
    }
  }

  function renderEmptyState() {
    var el = document.createElement("div");
    el.id = "zeva-empty";

    var p = document.createElement("p");
    p.className = "zeva-welcome";
    p.textContent = state.welcome;
    el.appendChild(p);

    if (state.configStatus === "error") {
      var warn = document.createElement("div");
      warn.className = "zeva-unavailable";
      warn.textContent = state.configErrorMessage || "This chat is temporarily unavailable. Please check back soon.";
      el.appendChild(warn);
    } else if (state.suggestions && state.suggestions.length) {
      var chips = document.createElement("div");
      chips.className = "zeva-chips";
      state.suggestions.forEach(function (raw) {
        var q = String(raw || "").trim();
        if (!q) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "zeva-chip";
        btn.innerHTML = ICON_SPARK;
        var span = document.createElement("span");
        span.className = "zeva-chip-text";
        span.textContent = q;
        btn.appendChild(span);
        var kbd = document.createElement("span");
        kbd.className = "zeva-chip-kbd";
        kbd.textContent = "↵";
        btn.appendChild(kbd);
        btn.addEventListener("click", function () { ask(q); });
        chips.appendChild(btn);
      });
      el.appendChild(chips);
    }

    streamEl.appendChild(el);
  }

  function refreshEmptyStateIfUntouched() {
    var existing = shadow.getElementById("zeva-empty");
    if (!existing) return; // user already sent a message — don't disturb history
    existing.remove();
    renderEmptyState();
  }

  function removeEmptyState() {
    var el = shadow.getElementById("zeva-empty");
    if (el) el.remove();
  }

  function scrollToBottom() {
    if (!streamEl) return;
    var reduce = prefersReducedMotion();
    try {
      streamEl.scrollTo({ top: streamEl.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    } catch {
      streamEl.scrollTop = streamEl.scrollHeight;
    }
  }

  // =======================================================================
  // /config — brands the widget; graceful failure state on error
  // =======================================================================
  function fetchConfig() {
    if (!HAS_FETCH) {
      onConfigFailed("This browser doesn't support the features required for chat.");
      return;
    }
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;

    fetch(API_URL + "/config?botId=" + encodeURIComponent(BOT_ID), {
      method: "GET",
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) {
          return res
            .json()
            .catch(function () { return null; })
            .then(function (body) {
              var detail = body && body.detail ? String(body.detail) : null;
              throw new Error(detail || "Config load failed (" + res.status + ")");
            });
        }
        return res.json();
      })
      .then(function (cfg) {
        onConfigLoaded(cfg || {});
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        onConfigFailed(err && err.message);
      });
  }

  function onConfigLoaded(cfg) {
    state.configStatus = "ready";

    if (!NAME_EXPLICIT && cfg.name) state.name = cfg.name;
    if (!ACCENT_EXPLICIT && cfg.accent && HEX_RE.test(cfg.accent)) {
      state.accent = cfg.accent;
      state.accentStrong = shade(state.accent);
      applyTheme();
    }
    if (cfg.welcome) state.welcome = cfg.welcome;
    if (Array.isArray(cfg.suggestions) && cfg.suggestions.length) state.suggestions = cfg.suggestions;

    // Apply design settings from /config (Studio-saved look)
    var design = cfg.design && cfg.design.config ? cfg.design.config : null;
    if (design) {
      // Logo: only apply if not explicitly set via data-logo
      if (!RAW.logo && design.logo) {
        RAW.logo = design.logo;
        refreshLogo();
      }
      // Fonts: only apply if not explicitly set via data-font
      if (getAttr("data-font", "") === "" && design.fontSrc) {
        if (design.fontSrc === "google" && design.gFont) {
          loadGoogleFont(design.gFont);
          applyFontFamily(design.gFont);
        } else if (design.fontSrc === "custom" && design.cFam && design.cUrl) {
          loadCustomFont(design.cFam, design.cUrl);
          applyFontFamily(design.cFam);
        } else if (design.fontSrc === "preset" && design.font && design.font !== "system") {
          var presetMap = { rounded: "Nunito", serif: "Playfair Display", mono: "JetBrains Mono" };
          var gFontName = presetMap[design.font];
          if (gFontName) { loadGoogleFont(gFontName); applyFontFamily(gFontName); }
        }
      }
      // Surface theme
      if (getAttr("data-surface", "") === "" && design.surface) {
        RAW.surface = design.surface;
        applyTheme();
      }
      // Corners
      if (getAttr("data-corners", "") === "" && design.corners) {
        RAW.corners = design.corners;
        applyTheme();
      }
      // Glass mode
      if (!hasAttr("data-glass") && typeof design.glass === "boolean") {
        RAW.glass = design.glass;
        applyTheme();
      }
      // Launcher style
      if (getAttr("data-launcher", "") === "" && design.launcher) {
        RAW.launcher = design.launcher;
        refreshLauncher();
      }
      // Sources toggle
      if (!hasAttr("data-sources") && typeof design.sources === "boolean") {
        RAW.sources = design.sources;
      }
      // Whitelabel: server-authoritative
      if (RAW.whitelabel && cfg.whitelabelAllowed) {
        var brandEl = shadow.getElementById("zeva-footer-brand");
        if (brandEl) brandEl.style.display = "none";
      }
    } else {
      // No design blob — still apply whitelabel if both sides agree
      if (RAW.whitelabel && cfg.whitelabelAllowed) {
        var brandEl2 = shadow.getElementById("zeva-footer-brand");
        if (brandEl2) brandEl2.style.display = "none";
      }
    }

    refreshBranding();
    refreshEmptyStateIfUntouched();
  }

  function onConfigFailed(reason) {
    state.configStatus = "error";
    state.configErrorMessage = reason || "This chat is temporarily unavailable. Please check back soon.";

    refreshBranding();
    refreshLauncherAvailability();
    refreshEmptyStateIfUntouched();

    var input = shadow.getElementById("zeva-input");
    var sendBtn = shadow.getElementById("zeva-send-btn");
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
  }

  // =======================================================================
  // Chat: ask() → /chat, scan indicator, typewriter reveal
  // =======================================================================
  function setScanning(on) {
    state.isScanning = on;
    var input = shadow.getElementById("zeva-input");
    var sendBtn = shadow.getElementById("zeva-send-btn");
    var unavailable = state.configStatus === "error";
    if (input) input.disabled = on || unavailable;
    if (sendBtn) sendBtn.disabled = on || unavailable || !(input && input.value.trim());
    if (on) appendScanIndicator();
    else removeScanIndicator();
  }

  function appendScanIndicator() {
    removeScanIndicator();
    var el = document.createElement("div");
    el.className = "zeva-scan";
    el.id = "zeva-scan-indicator";
    el.innerHTML =
      '<div class="zeva-scan-label"><span class="zeva-scan-dot"></span>searching your knowledge…</div>' +
      '<div class="zeva-scan-bar zeva-w1"></div>' +
      '<div class="zeva-scan-bar zeva-w2"></div>' +
      '<div class="zeva-scan-bar zeva-w3"></div>';
    streamEl.appendChild(el);
    scrollToBottom();
  }

  function removeScanIndicator() {
    var el = shadow.getElementById("zeva-scan-indicator");
    if (el) el.remove();
  }

  function typewriter(el, text) {
    if (prefersReducedMotion() || !text) {
      el.textContent = text || "";
      return;
    }
    var words = text.split(" ");
    var i = 0;
    var iv = setInterval(function () {
      i++;
      el.textContent = words.slice(0, i).join(" ");
      scrollToBottom();
      if (i >= words.length) clearInterval(iv);
    }, 30);
  }

  function addUserMessage(text) {
    removeEmptyState();
    var el = document.createElement("div");
    el.className = "zeva-msg-user";
    el.textContent = text;
    streamEl.appendChild(el);
    scrollToBottom();
  }

  function appendHighlighted(container, snip, hi) {
    if (!hi) { container.textContent = snip; return; }
    var i = snip.indexOf(hi);
    if (i < 0) { container.textContent = snip; return; }
    container.appendChild(document.createTextNode(snip.slice(0, i)));
    var mark = document.createElement("mark");
    mark.textContent = hi;
    container.appendChild(mark);
    container.appendChild(document.createTextNode(snip.slice(i + hi.length)));
  }

  function buildProofCard(src) {
    var wrap = document.createElement("div");
    wrap.className = "zeva-proof-wrap";
    var match = typeof src.match === "number" ? src.match : parseInt(src.match, 10) || 0;

    var card = document.createElement("div");
    card.className = "zeva-proof";
    card.style.setProperty("--match", match + "%");

    var meta = document.createElement("div");
    meta.className = "zeva-proof-meta";

    var fileSpan = document.createElement("span");
    fileSpan.className = "zeva-proof-file";
    fileSpan.innerHTML = ICON_FILE;
    var fileNameSpan = document.createElement("span");
    fileNameSpan.textContent = src.file || "document";
    fileSpan.appendChild(fileNameSpan);
    meta.appendChild(fileSpan);

    var matchWrap = document.createElement("span");
    matchWrap.className = "zeva-proof-match";
    matchWrap.innerHTML = '<span class="zeva-proof-bar"><span class="zeva-proof-bar-fill"></span></span>';
    var pct = document.createElement("span");
    pct.className = "zeva-proof-pct";
    pct.textContent = match + "% match";
    matchWrap.appendChild(pct);
    meta.appendChild(matchWrap);

    card.appendChild(meta);

    var snip = document.createElement("div");
    snip.className = "zeva-proof-snip";
    appendHighlighted(snip, src.snip || "", src.highlight || "");
    card.appendChild(snip);

    wrap.appendChild(card);
    return wrap;
  }

  function buildLeadTicket(onDone) {
    var el = document.createElement("div");
    el.className = "zeva-ticket-wrap";
    el.innerHTML =
      '<div class="zeva-ticket" id="zt-card">' +
      '<span class="zeva-ticket-stamp">WARM LEAD</span>' +
      '<h4 class="zeva-ticket-title">' + escapeHtml(state.name) + " · handoff</h4>" +
      '<div class="zeva-ticket-sub">Leave your details and the team will reach out.</div>' +
      '<div class="zeva-ticket-fields">' +
      '<input class="zeva-ticket-input" type="text" placeholder="Your name" aria-label="Your name" id="zt-name" />' +
      '<input class="zeva-ticket-input" type="email" placeholder="Email" aria-label="Email" id="zt-email" />' +
      '<input class="zeva-ticket-input" type="tel" placeholder="Phone (optional)" aria-label="Phone (optional)" id="zt-phone" />' +
      '<input class="zeva-ticket-input" type="text" placeholder="What do you need? (optional)" aria-label="Message (optional)" id="zt-message" />' +
      "</div>" +
      '<button type="button" class="zeva-ticket-submit" id="zt-submit" disabled>Hand me to the team →</button>' +
      "</div>";

    var card = el.querySelector("#zt-card");
    var nameI = el.querySelector("#zt-name");
    var emailI = el.querySelector("#zt-email");
    var phoneI = el.querySelector("#zt-phone");
    var msgI = el.querySelector("#zt-message");
    var submitBtn = el.querySelector("#zt-submit");
    var phase = "idle";

    function refresh() {
      var can = nameI.value.trim().length > 0 && emailI.value.trim().length > 0;
      submitBtn.disabled = !can || phase !== "idle";
    }
    nameI.addEventListener("input", refresh);
    emailI.addEventListener("input", refresh);

    submitBtn.addEventListener("click", function () {
      var can = nameI.value.trim().length > 0 && emailI.value.trim().length > 0;
      if (!can || phase !== "idle") return;
      var leadName = nameI.value.trim();

      if (HAS_FETCH) {
        var payload = { name: leadName, email: emailI.value.trim(), botId: BOT_ID };
        var phoneVal = phoneI.value.trim();
        var msgVal = msgI.value.trim();
        if (phoneVal) payload.phone = phoneVal;
        if (msgVal) payload.message = msgVal;
        fetch(API_URL + "/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(function () { /* fire-and-forget — UX doesn't block on the response */ });
      }

      var reduce = prefersReducedMotion();
      phase = "sent";
      card.classList.add("zeva-sent");
      submitBtn.textContent = "Sent ✓";
      submitBtn.disabled = true;

      setTimeout(function () {
        phase = "gone";
        card.classList.remove("zeva-sent");
        card.classList.add("zeva-gone");
        setTimeout(function () { onDone(leadName); }, reduce ? 0 : 420);
      }, reduce ? 0 : 640);
    });

    setTimeout(function () { nameI.focus(); }, 60);

    return el;
  }

  function buildLeadStub(name) {
    var el = document.createElement("div");
    el.className = "zeva-stub";
    el.innerHTML = '<span class="zeva-stub-check">' + ICON_CHECK_BOLD + "</span>" + "<div><b>Handed to the team.</b><small class=\"zeva-stub-name\"></small></div>";
    el.querySelector(".zeva-stub-name").textContent = (name || "This visitor") + " — marked a warm lead.";
    return el;
  }

  function addAssistantMessage(payload) {
    removeEmptyState();

    var wrap = document.createElement("div");
    wrap.className = "zeva-msg-assistant";

    var head = document.createElement("div");
    head.className = "zeva-msg-assistant-head";
    head.innerHTML = ICON_CHECK;
    var textSpan = document.createElement("span");
    textSpan.className = "zeva-msg-assistant-text";
    head.appendChild(textSpan);
    wrap.appendChild(head);

    var hasSource = payload.sources && payload.sources.length > 0;
    var showProof = RAW.sources && hasSource;

    if (payload.isGuardrail) {
      var g = document.createElement("div");
      g.className = "zeva-guardrail";
      g.innerHTML = ICON_WARNING;
      var gt = document.createElement("span");
      gt.textContent = "No matching source — routing you to a human.";
      g.appendChild(gt);
      wrap.appendChild(g);
    }

    if (showProof) {
      wrap.appendChild(Object.assign(document.createElement("div"), { className: "zeva-connector" }));
      payload.sources.forEach(function (src) { wrap.appendChild(buildProofCard(src)); });
    }

    // Lead-capture slot: guardrail auto-opens the ticket; a sourced answer
    // shows an affordance button that opens it on click (matches AnswerEntry.tsx).
    var slot = document.createElement("div");
    wrap.appendChild(slot);

    function mountTicket() {
      slot.innerHTML = "";
      slot.appendChild(
        buildLeadTicket(function (leadName) {
          slot.innerHTML = "";
          slot.appendChild(buildLeadStub(leadName));
        })
      );
    }

    if (payload.isGuardrail) {
      mountTicket();
    } else if (hasSource) {
      var leadBtn = document.createElement("button");
      leadBtn.type = "button";
      leadBtn.className = "zeva-lead-btn";
      leadBtn.innerHTML = ICON_USERPLUS + "<span>Book / leave my details</span>";
      leadBtn.addEventListener("click", mountTicket);
      slot.appendChild(leadBtn);
    }

    streamEl.appendChild(wrap);
    scrollToBottom();

    typewriter(textSpan, payload.text);

    if (showProof) {
      setTimeout(function () {
        var cards = wrap.querySelectorAll(".zeva-proof");
        for (var i = 0; i < cards.length; i++) cards[i].classList.add("zeva-revealed");
      }, 50);
    }
  }

  function ask(raw) {
    var text = String(raw || "").trim();
    if (!text || state.isScanning || state.configStatus === "error") return;

    addUserMessage(text);
    setScanning(true);

    if (!HAS_FETCH) {
      setScanning(false);
      addAssistantMessage({
        text: "Sorry — this browser doesn't support the features required for chat.",
        sources: [],
        isGuardrail: false,
      });
      return;
    }

    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 45000) : null;

    fetch(API_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, botId: BOT_ID }),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("Backend responded " + res.status);
        return res.json();
      })
      .then(function (data) {
        setScanning(false);
        addAssistantMessage({
          text: data.answer || "Sorry, I didn't get a response. Please try again.",
          sources: Array.isArray(data.sources) ? data.sources : [],
          isGuardrail: !!data.isGuardrail,
        });
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        setScanning(false);
        addAssistantMessage({
          text: "Sorry — I couldn't reach the server just now. Please try again in a moment.",
          sources: [],
          isGuardrail: false,
        });
      });
  }

  // ---- go ------------------------------------------------------------------
  // Invoked last (not right after its definition) so every `var` constant
  // above — icons, RAW, state, GENERIC_SUGGESTIONS — is guaranteed to be
  // assigned before mount() can possibly run, including the synchronous path
  // (whenBodyReady calls back immediately when document.body already exists).
  boot();
})();
