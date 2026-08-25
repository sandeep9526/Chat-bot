/**
 * OchreShift Chat Widget — Embeddable Loader
 * =====================================================================
 * Drop this on any website:
 *
 *   <script
 *     src="https://cdn.ochreshift.app/widget.js"
 *     data-bot-id="ochreshift-ai"
 *     data-api-url="https://api.your-ochreshift-deployment.com"
 *     data-name="OchreShift AI"
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
 * `<script src="https://cdn.ochreshift.app/widget.js">` would silently send every
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
  var BOT_ID = getAttr("data-bot-id", "ochreshift-ai");
  var DEFAULT_API_URL = "https://api.ochreshift.app"; // documented placeholder — see comment block above
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
    consent: getAttr("data-consent", "off") === "on",
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
    formSchema: [],
    configStatus: "loading", // loading | ready | error
    configErrorMessage: "",
    isOpen: false,
    isScanning: false,
  };

  var SESSION_ID = (function () {
    try {
      var k = "ochreshift_sess_" + BOT_ID;
      var s = localStorage.getItem(k);
      if (!s) {
        s = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
        localStorage.setItem(k, s);
      }
      return s;
    } catch (e) {
      return "sess_" + Math.random().toString(36).substring(2, 11);
    }
  })();

  // Shallow same-tab conversation cache — sessionStorage (not localStorage)
  // so it survives a reload/navigation within this tab but never leaks across
  // tabs or outlives the browsing session. Only message text/metadata is kept
  // — never lead-form field values, so no PII sits in storage longer than a
  // single form submission.
  var HISTORY_KEY = "ochreshift_hist_" + BOT_ID;
  var MAX_HISTORY = 24;

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(HISTORY_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function appendHistory(entry) {
    try {
      var hist = loadHistory();
      hist.push(entry);
      if (hist.length > MAX_HISTORY) hist = hist.slice(hist.length - MAX_HISTORY);
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    } catch (e) { /* storage unavailable/full — degrade to non-persistent */ }
  }

  var liveWs = null;
  function connectLiveChat() {
    try {
      var wsUrl = API_URL.replace(/^http/, "ws") + "/ws/live-chat/" + encodeURIComponent(SESSION_ID) + "?botId=" + encodeURIComponent(BOT_ID);
      liveWs = new WebSocket(wsUrl);
      liveWs.onmessage = function (event) {
        try {
          var msg = JSON.parse(event.data);
          if (msg.sender === "agent" || msg.sender === "system") {
            addAssistantMessage({ text: msg.text, sources: [], isGuardrail: false });
          }
        } catch (err) { }
      };
      liveWs.onclose = function () {
        setTimeout(connectLiveChat, 5000);
      };
    } catch (err) { }
  }

  // DOM refs (populated in mount())
  var hostEl, shadow, anchorEl, panelEl, launcherWrapEl, streamEl;

  function boot() {
    try {
      whenBodyReady(mount);
    } catch (e) {
      if (window.console && console.error) console.error("[OchreShift Widget] failed to initialize", e);
    }
  }

  // =======================================================================
  // Icons (inline SVG strings — no external icon font/CDN)
  // =======================================================================
  var ICON_LOGO =
    '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="16,2 3.88,9 3.88,23 16,30 16,22.4 10.8,19.4 10.8,11 16,8" fill="#FFB800"/><polygon points="16,2 16,8 21.2,11 21.2,19.4 16,22.4 16,30 28.12,23 28.12,9" fill="currentColor"/></svg>';
  var ICON_LOGO_FULL =
    '<svg viewBox="0 0 168 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="height:12px;width:auto;opacity:0.8;margin-left:6px;"><polygon points="16,2 3.88,9 3.88,23 16,30 16,22.4 10.8,19.4 10.8,11 16,8" fill="#FFB800"/><polygon points="16,2 16,8 21.2,11 21.2,19.4 16,22.4 16,30 28.12,23 28.12,9" fill="currentColor"/><text x="38" y="23" style="font-family:\'Space Grotesk\', system-ui, sans-serif" font-weight="800" font-size="22" letter-spacing="-0.02em"><tspan fill="#FFB800">ochre</tspan><tspan fill="currentColor">shift</tspan></text></svg>';
  var ICON_MORE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>';
  var ICON_ROTATE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
  var ICON_SPARK =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M5 12H2M22 12h-3"/><circle cx="12" cy="12" r="3.4"/></svg>';
  var ICON_CLOSE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  var ICON_CHECK =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  var ICON_ARROW =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>';
  var ICON_WARNING =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  var ICON_FILE =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>';
  var ICON_USERPLUS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6M19 8v6"/></svg>';
  var ICON_CHECK_BOLD =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  // =======================================================================
  // CSS (fully static — dynamic values are applied as CSS custom props /
  // data-* attributes on .ochreshift-anchor at runtime, never interpolated here)
  // =======================================================================
  function buildCss() {
    return (
      ":host{all:initial;}" +
      ".ochreshift-anchor,.ochreshift-anchor *,.ochreshift-anchor *::before,.ochreshift-anchor *::after{box-sizing:border-box;}" +
      ".ochreshift-anchor{" +
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
      ".ochreshift-anchor.ochreshift-gap{gap:12px;}" +
      ".ochreshift-anchor[data-theme='dark']{--surface:#0f172a;--glass:rgba(15,23,42,.72);--panel:rgba(2,6,23,.5);--paper:#131a2b;--paper-rule:#22304b;--text:#eef2f9;--muted:#93a1b8;--faint:#5c6c86;--border:#1e293b;--ring:#1e293b;--shadow:0 34px 80px -24px rgba(0,0,0,.75),0 10px 30px -14px rgba(0,0,0,.6);}" +
      ".ochreshift-anchor[data-corners='sharp']{--r1:5px;--r2:7px;--r3:10px;}" +
      ".ochreshift-anchor[data-corners='round']{--r1:16px;--r2:20px;--r3:28px;}" +
      ".ochreshift-anchor[data-font='rounded']{--font-family:ui-rounded,'SF Pro Rounded','Hiragino Maru Gothic ProN','Quicksand',system-ui,sans-serif;}" +
      ".ochreshift-anchor[data-font='serif']{--font-family:'Iowan Old Style','Palatino Linotype',Georgia,'Times New Roman',serif;}" +
      ".ochreshift-anchor[data-font='mono']{--font-family:var(--mono);}" +
      // Launcher
      ".ochreshift-launcher{all:unset;box-sizing:border-box;position:relative;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid var(--border);color:var(--text);font-family:inherit;font-size:14px;font-weight:650;box-shadow:var(--shadow);transition:transform .1s ease-out;}" +
      ".ochreshift-launcher:hover{transform:translateY(-1px);}" +
      ".ochreshift-launcher:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}" +
      ".ochreshift-launcher.ochreshift-variant-pill{border-radius:999px;padding:11px 16px 11px 12px;}" +
      ".ochreshift-launcher.ochreshift-variant-bubble{width:58px;height:58px;padding:0;justify-content:center;border-radius:999px;}" +
      ".ochreshift-launcher.ochreshift-variant-bar{width:100%;justify-content:flex-start;border-radius:var(--r2);padding:11px 16px 11px 12px;}" +
      ".ochreshift-launcher.ochreshift-glass{background:var(--glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);}" +
      ".ochreshift-launcher.ochreshift-solid{background:var(--surface);}" +
      ".ochreshift-launcher.ochreshift-variant-bubble{background:linear-gradient(135deg,var(--accent),var(--accent-strong));color:#fff;border-color:transparent;}" +
      ".ochreshift-launcher.ochreshift-breathe{animation:ochreshift-breathe 4.5s ease-in-out infinite;}" +
      ".ochreshift-launcher.ochreshift-unavailable{opacity:.7;}" +
      ".ochreshift-launcher-icon{display:grid;place-items:center;flex-shrink:0;overflow:hidden;border-radius:999px;width:25px;height:25px;}" +
      ".ochreshift-variant-bubble .ochreshift-launcher-icon{width:30px;height:30px;}" +
      ".ochreshift-launcher-icon.ochreshift-orb{background:linear-gradient(135deg,var(--accent),var(--accent-strong));color:#fff;}" +
      ".ochreshift-launcher-icon.ochreshift-custom{background:var(--surface);padding:2px;}" +
      ".ochreshift-launcher-icon img{width:100%;height:100%;border-radius:50%;object-fit:cover;}" +
      ".ochreshift-launcher-icon.ochreshift-orb img{border-radius:50%;}" +
      ".ochreshift-launcher-icon svg{width:14px;height:14px;}" +
      ".ochreshift-variant-bubble .ochreshift-launcher-icon svg{width:26px;height:26px;color:var(--on-accent);}" +
      ".ochreshift-launcher-label{line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;}" +
      ".ochreshift-launcher-kbd{border:1px solid var(--border);border-radius:6px;padding:1px 6px;font-family:var(--mono);font-size:11px;color:var(--faint);}" +
      ".ochreshift-launcher-dot{position:absolute;top:-2px;right:-2px;width:10px;height:10px;border-radius:50%;background:#f59e0b;border:2px solid var(--surface);}" +
      ".ochreshift-draggable .ochreshift-launcher{cursor:grab;}" +
      ".ochreshift-anchor.ochreshift-dragging{transition:none !important;}" +
      ".ochreshift-anchor.ochreshift-dragging .ochreshift-launcher{cursor:grabbing;}" +
      // Panel
      ".ochreshift-panel{display:flex;flex-direction:column;overflow:hidden;width:100%;border-radius:var(--r3);border-width:0;box-shadow:var(--shadow);background:var(--surface);color:var(--text);transform-origin:var(--panel-origin, bottom right);transition:opacity .3s ease-out,transform .3s ease-out;opacity:0;transform:scale(.94) translateY(14px);pointer-events:none;height:0;max-height:0;}" +
      ".ochreshift-panel.ochreshift-glass{background:var(--glass);backdrop-filter:blur(20px) saturate(1.5);-webkit-backdrop-filter:blur(20px) saturate(1.5);}" +
      ".ochreshift-panel.ochreshift-open{opacity:1;transform:scale(1) translateY(0);pointer-events:auto;height:560px;max-height:calc(100vh - 150px);border-width:1px;border-style:solid;border-color:var(--border);}" +
      // Header — clean bg with Online indicator
      ".ochreshift-header{display:flex;align-items:center;gap:10px;padding:13px 14px;border-bottom:1px solid var(--border);flex-shrink:0;}" +
      ".ochreshift-header-avatar{width:28px;height:28px;border-radius:50%;flex-shrink:0;background:var(--surface);box-shadow:0 1px 2px rgba(0,0,0,.05);border:1px solid var(--border);display:grid;place-items:center;padding:4px;}" +
      ".ochreshift-header-avatar.ochreshift-custom{width:26px;height:26px;padding:2px;box-shadow:0 0 0 4px var(--accent-soft);}" +
      ".ochreshift-header-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;}" +
      ".ochreshift-header-avatar svg{width:100%;height:100%;color:var(--text);}" +
      ".ochreshift-header-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;}" +
      ".ochreshift-header-name{font-size:14px;font-weight:600;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);}" +
      ".ochreshift-header-status{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:11.5px;font-weight:500;color:var(--muted);}" +
      ".ochreshift-header-status-dot{width:6px;height:6px;border-radius:50%;background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.4);}" +
      ".ochreshift-header-actions{display:flex;align-items:center;gap:2px;}" +
      ".ochreshift-header-btn{all:unset;box-sizing:border-box;display:grid;place-items:center;width:30px;height:30px;border-radius:8px;cursor:pointer;color:var(--muted);transition:background .15s,color .15s;}" +
      ".ochreshift-header-btn:hover{background:var(--ring);color:var(--text);}" +
      ".ochreshift-header-btn:focus-visible{outline:2px solid var(--accent);}" +
      ".ochreshift-header-btn svg{width:16px;height:16px;}" +
      // Screen-reader-only live region (announces completed assistant replies)
      ".ochreshift-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}" +
      // Composer — clean input without spark icon, panel bg
      ".ochreshift-composer{position:relative;margin:8px 12px 12px;flex-shrink:0;}" +
      ".ochreshift-input{width:100%;border:1px solid var(--border);border-radius:10px;background:var(--panel);color:var(--text);padding:14px 56px 14px 16px;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s;}" +
      ".ochreshift-input:hover{border-color:var(--muted);}" +
      ".ochreshift-input:focus{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent);}" +
      ".ochreshift-input:disabled{opacity:.6;cursor:not-allowed;}" +
      ".ochreshift-input::placeholder{color:var(--muted);}" +
      ".ochreshift-send{all:unset;box-sizing:border-box;position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:8px;display:grid;place-items:center;background:var(--accent);color:#fff;cursor:pointer;transition:transform .15s;}" +
      ".ochreshift-send:hover{transform:translateY(-50%) scale(1.05);}" +
      ".ochreshift-send:disabled{opacity:.35;cursor:not-allowed;transform:translateY(-50%);}" +
      ".ochreshift-send:focus-visible{outline:2px solid var(--accent-ring);}" +
      ".ochreshift-send svg{width:18px;height:18px;stroke-width:2.5px;}" +
      // Stream
      ".ochreshift-stream{flex:1;overflow-y:auto;padding:2px 14px 14px;display:flex;flex-direction:column;gap:16px;scrollbar-width:thin;scrollbar-color:var(--border) transparent;}" +
      ".ochreshift-stream::-webkit-scrollbar{width:5px;}" +
      ".ochreshift-stream::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px;}" +
      ".ochreshift-welcome{font-size:13px;line-height:1.5;color:var(--muted);margin:4px 2px 12px;}" +
      ".ochreshift-unavailable{margin:0 2px;padding:12px 14px;border-radius:var(--r2);border:1px dashed var(--border);background:var(--panel);font-size:12.5px;line-height:1.5;color:var(--muted);}" +
      // Suggestion chips — pill-shaped wrap layout
      ".ochreshift-chips{display:flex;flex-wrap:wrap;gap:8px;padding:4px 0 12px;}" +
      ".ochreshift-chip{all:unset;box-sizing:border-box;display:flex;align-items:center;border:1px solid var(--border);border-radius:999px;background:transparent;padding:6px 14px;font-size:12.5px;font-weight:500;color:var(--muted);cursor:pointer;transition:border-color .15s,color .15s;}" +
      ".ochreshift-chip:hover{border-color:var(--accent);color:var(--text);}" +
      ".ochreshift-chip:focus-visible{outline:2px solid var(--accent);}" +
      // Messages — user bubbles use panel bg with border; AI uses avatar layout
      ".ochreshift-msg-user{align-self:flex-end;max-width:85%;background:var(--panel);color:var(--text);border-radius:12px;border-bottom-right-radius:4px;padding:10px 16px;font-size:14px;font-weight:500;line-height:1.5;border:1px solid var(--border);box-shadow:0 1px 2px rgba(0,0,0,.05);white-space:pre-wrap;word-break:break-word;}" +
      ".ochreshift-msg-assistant{position:relative;padding-left:38px;}" +
      ".ochreshift-msg-assistant-head{position:absolute;left:0;top:0;width:28px;height:28px;border-radius:50%;background:var(--surface);border:1px solid var(--border);display:grid;place-items:center;padding:4px;box-shadow:0 1px 2px rgba(0,0,0,.05);}" +
      ".ochreshift-msg-assistant-head>svg{width:100%;height:100%;color:var(--text);}" +
      ".ochreshift-msg-assistant-text{padding-top:2px;font-size:15px;font-weight:500;line-height:1.5;color:var(--text);white-space:pre-wrap;word-break:break-word;}" +
      ".ochreshift-guardrail{margin-top:12px;display:flex;align-items:center;gap:10px;border:1px dashed var(--border);border-radius:var(--r2);padding:10px 12px;font-size:12.5px;color:var(--muted);}" +
      ".ochreshift-guardrail svg{width:16px;height:16px;color:#f59e0b;flex-shrink:0;}" +
      ".ochreshift-connector{position:relative;margin:8px 0 8px 7px;width:2px;height:16px;background:linear-gradient(var(--accent),transparent);}" +
      ".ochreshift-connector::after{content:'';position:absolute;bottom:0;left:-2px;width:6px;height:6px;border-radius:50%;background:var(--accent);}" +
      // Scan indicator
      ".ochreshift-scan{display:flex;flex-direction:column;gap:8px;}" +
      ".ochreshift-scan-label{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:11.5px;color:var(--muted);}" +
      ".ochreshift-scan-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);animation:ochreshift-blink 1s infinite;}" +
      ".ochreshift-scan-bar{height:9px;border-radius:5px;background:linear-gradient(90deg,var(--ring),var(--accent-soft),var(--ring));background-size:200% 100%;animation:ochreshift-sweep 1.1s linear infinite;}" +
      ".ochreshift-scan-bar.ochreshift-w1{width:92%;}" +
      ".ochreshift-scan-bar.ochreshift-w2{width:74%;animation-delay:.15s;}" +
      ".ochreshift-scan-bar.ochreshift-w3{width:84%;animation-delay:.3s;}" +
      // Proof card
      ".ochreshift-proof-wrap{margin-top:8px;}" +
      ".ochreshift-proof{border-radius:var(--r2);border:1px solid var(--paper-rule);background:var(--paper);overflow:hidden;transform-origin:top;transition:opacity .35s ease-out,transform .35s ease-out;opacity:0;transform:translateY(-6px) scaleY(.8);}" +
      ".ochreshift-proof.ochreshift-revealed{opacity:1;transform:translateY(0) scaleY(1);}" +
      ".ochreshift-proof-meta{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--paper-rule);padding:8px 11px;}" +
      ".ochreshift-proof-file{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;font-weight:600;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}" +
      ".ochreshift-proof-file svg{width:13px;height:13px;color:var(--accent);flex-shrink:0;}" +
      ".ochreshift-proof-match{margin-left:auto;display:flex;align-items:center;gap:7px;flex-shrink:0;}" +
      ".ochreshift-proof-bar{width:44px;height:5px;border-radius:3px;background:var(--ring);overflow:hidden;}" +
      ".ochreshift-proof-bar-fill{display:block;height:100%;width:0%;background:var(--good);transition:width .6s ease-out .2s;}" +
      ".ochreshift-proof.ochreshift-revealed .ochreshift-proof-bar-fill{width:var(--match,0%);}" +
      ".ochreshift-proof-pct{font-family:var(--mono);font-size:10.5px;font-weight:700;color:var(--good);white-space:nowrap;}" +
      ".ochreshift-proof-snip{padding:11px 12px;font-size:12.5px;line-height:1.7;color:var(--muted);background-image:repeating-linear-gradient(var(--paper) 0 27px, var(--paper-rule) 27px 28px);}" +
      ".ochreshift-proof-snip mark{background:var(--accent-soft);color:var(--text);border-radius:3px;padding:1px 3px;font-weight:600;}" +
      // Lead affordance + ticket
      ".ochreshift-lead-btn{all:unset;box-sizing:border-box;margin-top:12px;display:inline-flex;align-items:center;gap:7px;border:1px solid var(--border);border-radius:var(--r1);background:var(--panel);padding:8px 12px;font-size:12.5px;font-weight:600;color:var(--text);cursor:pointer;}" +
      ".ochreshift-lead-btn:hover{border-color:var(--accent);}" +
      ".ochreshift-lead-btn:focus-visible{outline:2px solid var(--accent);}" +
      ".ochreshift-lead-btn svg{width:14px;height:14px;color:var(--accent);}" +
      ".ochreshift-ticket-wrap{margin-top:12px;}" +
      ".ochreshift-ticket{position:relative;border-radius:var(--r1);border:1px solid var(--paper-rule);background:var(--paper);padding:16px;box-shadow:0 10px 26px -12px rgba(30,41,90,.35);transition:transform .45s ease-out,opacity .45s ease-out;}" +
      ".ochreshift-ticket.ochreshift-sent{transform:translateY(-8px) rotate(-1deg);}" +
      ".ochreshift-ticket.ochreshift-gone{transform:translateY(30px) scale(.9);opacity:0;}" +
      ".ochreshift-ticket-stamp{position:absolute;right:12px;top:12px;transform:rotate(9deg);border:2px solid var(--accent);border-radius:6px;padding:3px 7px;font-family:var(--mono);font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--accent);opacity:.85;}" +
      ".ochreshift-ticket-title{font-family:var(--mono);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--faint);margin:0;padding-right:70px;}" +
      ".ochreshift-ticket-sub{margin:4px 0 12px;font-size:13.5px;font-weight:650;color:var(--text);}" +
      ".ochreshift-ticket-fields{display:flex;flex-direction:column;gap:8px;}" +
      ".ochreshift-ticket-input{width:100%;border:0;border-bottom:1.5px dashed var(--paper-rule);background:transparent;padding:7px 2px;font-size:13.5px;font-family:inherit;color:var(--text);outline:none;}" +
      ".ochreshift-ticket-input:focus{border-bottom-color:var(--accent);}" +
      ".ochreshift-ticket-submit{all:unset;box-sizing:border-box;display:block;width:100%;margin-top:12px;border-radius:var(--r1);padding:11px;text-align:center;font-size:13.5px;font-weight:700;color:#fff;background:var(--accent);cursor:pointer;}" +
      ".ochreshift-ticket-submit:disabled{opacity:.4;cursor:not-allowed;}" +
      ".ochreshift-ticket-submit:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}" +
      ".ochreshift-ticket-error{margin-top:10px;padding:9px 10px;border-radius:var(--r1);border:1px dashed #ef4444;background:rgba(239,68,68,.08);font-size:12px;line-height:1.5;color:var(--text);}" +
      ".ochreshift-ticket-error b{display:block;margin-bottom:3px;}" +
      ".ochreshift-ticket-retry{all:unset;box-sizing:border-box;font-weight:700;color:var(--accent);text-decoration:underline;cursor:pointer;font-size:12px;}" +
      ".ochreshift-ticket-retry:focus-visible{outline:2px solid var(--accent);}" +
      ".ochreshift-stub{margin-top:12px;display:flex;align-items:center;gap:10px;border-radius:var(--r2);padding:12px 14px;font-size:13px;border:1px solid rgba(16,185,129,.3);background:rgba(16,185,129,.12);}" +
      ".ochreshift-stub-check{width:24px;height:24px;border-radius:50%;background:var(--good);color:#fff;display:grid;place-items:center;flex-shrink:0;}" +
      ".ochreshift-stub-check svg{width:14px;height:14px;}" +
      ".ochreshift-stub-name{display:block;margin-top:2px;font-size:11.5px;color:var(--muted);}" +
      // Footer
      ".ochreshift-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--border);padding:9px 14px;flex-shrink:0;font-size:10.5px;color:var(--faint);}" +
      ".ochreshift-footer-left{display:flex;align-items:center;gap:5px;min-width:0;overflow:hidden;}" +
      ".ochreshift-footer-left>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}" +
      ".ochreshift-footer-left svg{width:12px;height:12px;color:var(--good);flex-shrink:0;}" +
      ".ochreshift-footer-brand{display:flex;align-items:center;flex-shrink:0;text-decoration:none;color:var(--faint);}" +
      ".ochreshift-footer-brand:hover{color:var(--muted);}" +
      ".ochreshift-footer-brand svg{transition:opacity .15s;}" +
      // Keyframes
      "@keyframes ochreshift-breathe{0%,100%{box-shadow:var(--shadow),0 0 0 0 var(--accent-soft);}50%{box-shadow:var(--shadow),0 0 0 9px transparent;}}" +
      "@keyframes ochreshift-blink{0%,100%{opacity:1;}50%{opacity:.25;}}" +
      "@keyframes ochreshift-sweep{0%{background-position:200% 0;}100%{background-position:-200% 0;}}" +
      "@media (prefers-reduced-motion: reduce){.ochreshift-anchor,.ochreshift-anchor *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;}}" +
      // Mobile: panel goes near-fullscreen; launcher stays put.
      "@media (max-width: 480px){" +
      ".ochreshift-panel.ochreshift-open{position:fixed;inset:8px;width:auto;height:auto;max-height:none;border-radius:var(--r3);z-index:2147483001;}" +
      "}" +
      "@media (max-width: 340px){" +
      ".ochreshift-panel.ochreshift-open{inset:0;border-radius:0;}" +
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
        anchorEl.classList.add("ochreshift-dragging");
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
      anchorEl.classList.remove("ochreshift-dragging");

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
    var id = "ochreshift-widget-google-font";
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
    var id = "ochreshift-widget-custom-font";
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
    var glassClass = variant === "bubble" ? "" : RAW.glass ? "ochreshift-glass" : "ochreshift-solid";
    var label = state.configStatus === "error" ? "Chat unavailable" : "Ask " + state.name;
    var launcherIconClass = "ochreshift-launcher-icon";
    if (variant !== "bubble") launcherIconClass += " ochreshift-orb";
    if (RAW.logo) launcherIconClass += " ochreshift-custom";

    var launcherIcon = RAW.logo
      ? '<span class="' + launcherIconClass + '"><img src="' + escapeHtml(RAW.logo) + '" alt="" /></span>'
      : '<span class="' + launcherIconClass + '">' + ICON_LOGO + "</span>";
    var html =
      '<button type="button" class="ochreshift-launcher ochreshift-variant-' + variant + " " + glassClass +
      (state.configStatus !== "error" ? " ochreshift-breathe" : "") +
      '" aria-label="' + escapeHtml(label) + '" id="ochreshift-launcher-btn">' +
      launcherIcon;
    if (variant !== "bubble") {
      html +=
        '<span class="ochreshift-launcher-label" id="ochreshift-launcher-label">' + escapeHtml(label) + "</span>" +
        '<span class="ochreshift-launcher-kbd" title="Press / to open chat">/</span>';
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
    var refParam = RAW.botId ? "?ref=" + RAW.botId + "&utm_source=widget_watermark" : "";
    var brandRow = '<a href="https://ochreshift.app' + refParam + '" target="_blank" rel="noopener" class="ochreshift-footer-brand" id="ochreshift-footer-brand">Powered by ' + ICON_LOGO_FULL + '</a>';
    var headerAvatarClass = RAW.logo ? "ochreshift-header-avatar ochreshift-custom" : "ochreshift-header-avatar";
    var headerAvatar = RAW.logo
      ? '<img src="' + escapeHtml(RAW.logo) + '" alt="" />'
      : ICON_LOGO;
    return (
      '<div class="ochreshift-header">' +
      '<div class="' + headerAvatarClass + '">' + headerAvatar + '</div>' +
      '<div class="ochreshift-header-info">' +
      '<div class="ochreshift-header-name" id="ochreshift-header-name"></div>' +
      '<div class="ochreshift-header-status"><span class="ochreshift-header-status-dot"></span>Online</div>' +
      '</div>' +
      '<div class="ochreshift-header-actions">' +
      '<button type="button" class="ochreshift-header-btn" id="ochreshift-refresh-btn" aria-label="Clear chat" title="Clear chat" style="display:none;">' + ICON_ROTATE + "</button>" +
      '<button type="button" class="ochreshift-header-btn" aria-label="More options">' + ICON_MORE + "</button>" +
      '<button type="button" class="ochreshift-header-btn" id="ochreshift-close-btn" aria-label="Close">' + ICON_CLOSE + "</button>" +
      '</div>' +
      "</div>" +
      '<form class="ochreshift-composer" id="ochreshift-composer-form" autocomplete="off">' +
      '<input class="ochreshift-input" id="ochreshift-input" type="text" placeholder="Ask anything..." />' +
      '<button type="submit" class="ochreshift-send" id="ochreshift-send-btn" aria-label="Ask" disabled>' + ICON_ARROW + "</button>" +
      "</form>" +
      '<div class="ochreshift-sr-only" id="ochreshift-live-region" aria-live="polite" aria-atomic="true"></div>' +
      '<div class="ochreshift-stream" id="ochreshift-stream"></div>' +
      '<div class="ochreshift-footer">' +
      '<span class="ochreshift-footer-left" id="ochreshift-footer-left">' + ICON_CHECK + '<span id="ochreshift-footer-status">Answers from ' + escapeHtml(state.name || "the assistant") + '’s own info</span></span>' +
      brandRow +
      "</div>"
    );
  }

  // =======================================================================
  // Mount
  // =======================================================================
  function mount() {
    hostEl = document.createElement("div");
    hostEl.id = "ochreshift-widget-root-" + BOT_ID.replace(/[^a-zA-Z0-9_-]/g, "");
    document.body.appendChild(hostEl);

    if (typeof hostEl.attachShadow !== "function") {
      // No Shadow DOM support — bail rather than inject unscoped styles that
      // could clash with (or be broken by) the host page.
      if (window.console && console.warn) {
        console.warn("[OchreShift Widget] Shadow DOM is not supported in this browser; widget disabled.");
      }
      return;
    }

    shadow = hostEl.attachShadow({ mode: "open" });

    var styleTag = document.createElement("style");
    styleTag.textContent = buildCss();
    shadow.appendChild(styleTag);

    anchorEl = document.createElement("div");
    anchorEl.className = "ochreshift-anchor" + (RAW.draggable ? " ochreshift-draggable" : "");
    shadow.appendChild(anchorEl);

    applyTheme();
    watchSystemTheme();
    applyPlacement();
    applyFont();

    panelEl = document.createElement("div");
    panelEl.className = "ochreshift-panel" + (RAW.glass ? " ochreshift-glass" : "");
    panelEl.id = "ochreshift-panel";
    panelEl.setAttribute("role", "dialog");
    panelEl.setAttribute("aria-label", "Ask " + state.name);
    panelEl.setAttribute("aria-hidden", "true");
    panelEl.setAttribute("inert", "");
    panelEl.innerHTML = buildPanelSkeletonHtml();
    anchorEl.appendChild(panelEl);

    launcherWrapEl = document.createElement("div");
    launcherWrapEl.innerHTML = buildLauncherHtml();
    anchorEl.appendChild(launcherWrapEl);

    streamEl = shadow.getElementById("ochreshift-stream");

    var closeBtn = shadow.getElementById("ochreshift-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closePanel);

    var refreshBtn = shadow.getElementById("ochreshift-refresh-btn");
    if (refreshBtn) refreshBtn.addEventListener("click", function () {
      // Clear history and reset stream
      try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
      if (streamEl) { streamEl.innerHTML = ""; renderEmptyState(); }
      refreshBtn.style.display = "none";
    });

    var launcherBtn = shadow.getElementById("ochreshift-launcher-btn");
    if (launcherBtn) launcherBtn.addEventListener("click", openPanel);
    if (RAW.draggable && launcherBtn) setupDrag(launcherBtn);

    // Escape-to-close + a focus trap so Tab/Shift+Tab can't leave the panel
    // while it's open (previously a keyboard user could tab straight out
    // into the host page with no way back except finding the mouse).
    panelEl.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel();
        var btn = shadow.getElementById("ochreshift-launcher-btn");
        if (btn) btn.focus();
        return;
      }
      if (e.key === "Tab") trapFocus(e);
    });

    // "/" opens the widget from anywhere on the host page — but only when
    // nothing else on that page currently has focus, so this never steals
    // the key from the host site's own inputs or shortcuts.
    document.addEventListener("keydown", function (e) {
      if (state.isOpen || e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var active = document.activeElement;
      if (active && active !== document.body && active !== document.documentElement) return;
      e.preventDefault();
      openPanel();
    });

    var input = shadow.getElementById("ochreshift-input");
    var sendBtn = shadow.getElementById("ochreshift-send-btn");
    if (input) {
      input.addEventListener("input", function () {
        if (sendBtn) sendBtn.disabled = !input.value.trim() || state.isScanning || state.configStatus === "error";
      });
    }

    var form = shadow.getElementById("ochreshift-composer-form");
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

    // Consent notice — when data-consent="on", show a disclaimer before chat
    if (RAW.consent) {
      var consentBar = document.createElement("div");
      consentBar.id = "ochreshift-consent-bar";
      consentBar.style.cssText = "padding:10px 14px;font-size:12px;color:#666;text-align:center;border-top:1px solid #eee;background:#fafafa;";
      consentBar.innerHTML = 'This automated assistant uses AI processing. By continuing, you consent to our data terms and analytics storage.';
      var composerWrap = shadow.querySelector(".ochreshift-composer-wrap") || shadow.getElementById("ochreshift-composer-form");
      if (composerWrap && composerWrap.parentNode) {
        composerWrap.parentNode.insertBefore(consentBar, composerWrap);
      }
    }

    refreshBranding();
    if (!restoreHistory()) renderEmptyState();
    fetchConfig();
  }

  /** Rehydrate a cached conversation (same-tab reload/navigation). Returns true if anything was restored. */
  function restoreHistory() {
    var hist = loadHistory();
    if (!hist.length) return false;
    hist.forEach(function (entry) {
      if (entry.role === "user") {
        addUserMessage(entry.text, true);
      } else if (entry.role === "assistant") {
        addAssistantMessage(
          {
            text: entry.text,
            sources: entry.sources || [],
            isGuardrail: !!entry.isGuardrail,
            limitReached: !!entry.limitReached,
          },
          true
        );
      }
    });
    return true;
  }

  function openPanel() {
    if (state.isOpen) return;
    state.isOpen = true;
    panelEl.classList.add("ochreshift-open");
    panelEl.setAttribute("aria-hidden", "false");
    panelEl.removeAttribute("inert");
    launcherWrapEl.style.display = "none";
    anchorEl.classList.add("ochreshift-gap");
    var input = shadow.getElementById("ochreshift-input");
    if (input && !input.disabled) setTimeout(function () { input.focus(); }, 30);
  }

  function closePanel() {
    if (!state.isOpen) return;
    state.isOpen = false;
    panelEl.classList.remove("ochreshift-open");
    panelEl.setAttribute("aria-hidden", "true");
    panelEl.setAttribute("inert", "");
    launcherWrapEl.style.display = "";
    anchorEl.classList.remove("ochreshift-gap");
  }

  var FOCUSABLE_SEL =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    var focusable = Array.prototype.slice.call(panelEl.querySelectorAll(FOCUSABLE_SEL));
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    var active = shadow.activeElement;
    if (e.shiftKey) {
      if (active === first || !panelEl.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !panelEl.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /** Announce a completed assistant reply to screen readers once (not word-by-word during the typewriter animation). */
  function announceToScreenReader(text) {
    var region = shadow && shadow.getElementById("ochreshift-live-region");
    if (!region || !text) return;
    region.textContent = "";
    setTimeout(function () { region.textContent = text; }, 50);
  }

  // =======================================================================
  // Branding / empty-state refresh (called at mount, and again once /config
  // resolves — see fetchConfig()).
  // =======================================================================
  function refreshBranding() {
    var headerName = shadow.getElementById("ochreshift-header-name");
    if (headerName) headerName.textContent = state.name;

    var input = shadow.getElementById("ochreshift-input");
    if (input) {
      var placeholder = state.configStatus === "error" ? "Chat is currently unavailable" : "Ask anything about " + state.name + "…";
      input.setAttribute("placeholder", placeholder);
      input.setAttribute("aria-label", placeholder);
    }

    var label = state.configStatus === "error" ? "Chat unavailable" : (state.name ? "Ask " + state.name : "Chat with us");
    var launcherLabelEl = shadow.getElementById("ochreshift-launcher-label");
    if (launcherLabelEl) launcherLabelEl.textContent = label;

    refreshFooter();

    var launcherBtn = shadow.getElementById("ochreshift-launcher-btn");
    if (launcherBtn) launcherBtn.setAttribute("aria-label", label);

    if (panelEl) panelEl.setAttribute("aria-label", "Ask " + state.name);
  }

  function refreshFooter() {
    var footerStatusEl = shadow.getElementById("ochreshift-footer-status");
    if (footerStatusEl) {
      footerStatusEl.textContent = state.configStatus === "error" ? "Chat unavailable" : ("Answers from " + (state.name || "the assistant") + "’s own info");
    }
  }

  /** Update logo in header + launcher after /config loads with a saved logo. */
  function refreshLogo() {
    if (!RAW.logo) return;
    // Header avatar
    var avatarEl = shadow.querySelector(".ochreshift-header-avatar");
    if (avatarEl && !avatarEl.querySelector("img")) {
      avatarEl.className += " ochreshift-custom";
      var img = document.createElement("img");
      img.src = RAW.logo;
      img.alt = "";
      avatarEl.innerHTML = "";
      avatarEl.appendChild(img);
    }
    // Launcher icon
    var launcherIcon = shadow.querySelector(".ochreshift-launcher-icon");
    if (launcherIcon) {
      launcherIcon.className += " ochreshift-custom";
      var img2 = document.createElement("img");
      img2.src = RAW.logo;
      img2.alt = "";
      launcherIcon.innerHTML = "";
      launcherIcon.appendChild(img2);
    }
  }

  /** Re-render the entire launcher (used when launcher style changes from config). */
  function refreshLauncher() {
    var old = shadow.getElementById("ochreshift-launcher-btn");
    if (!old) return;
    var tmp = document.createElement("div");
    tmp.innerHTML = buildLauncherHtml();
    var fresh = tmp.firstChild;
    old.parentNode.replaceChild(fresh, old);
    fresh.addEventListener("click", openPanel);
    if (RAW.draggable) setupDrag(fresh);
  }

  /** Apply a font family to the widget shadow root. */
  function applyFontFamily(family) {
    if (!family || !shadow) return;
    shadow.host.style.setProperty("--widget-font", '"' + family + '", sans-serif');
    var styleTag = shadow.querySelector("style");
    if (styleTag) {
      var css = styleTag.textContent;
      // Inject or update font-family override at the end
      var marker = "/* @ochreshift-font-override */";
      var override = marker + "\n.ochreshift-panel,.ochreshift-launcher{font-family:\"" + family + "\",sans-serif !important;}";
      if (css.indexOf(marker) >= 0) {
        styleTag.textContent = css.replace(new RegExp(marker[0] + ".*?" + marker.slice(-1) + "[\\s\\S]*$"), override);
      } else {
        styleTag.textContent = css + "\n" + override;
      }
    }
  }

  function refreshLauncherAvailability() {
    var btn = shadow.getElementById("ochreshift-launcher-btn");
    if (!btn) return;
    if (state.configStatus === "error") {
      btn.classList.remove("ochreshift-breathe");
      btn.classList.add("ochreshift-unavailable");
      if (!shadow.getElementById("ochreshift-launcher-dot")) {
        var dot = document.createElement("span");
        dot.className = "ochreshift-launcher-dot";
        dot.id = "ochreshift-launcher-dot";
        dot.title = "Chat unavailable";
        btn.appendChild(dot);
      }
      var footerLeft = shadow.getElementById("ochreshift-footer-left");
      if (footerLeft) footerLeft.style.display = "none";
    }
  }

  function renderEmptyState() {
    var el = document.createElement("div");
    el.id = "ochreshift-empty";

    var p = document.createElement("p");
    p.className = "ochreshift-welcome";
    p.textContent = state.welcome;
    el.appendChild(p);

    if (state.configStatus === "error") {
      var warn = document.createElement("div");
      warn.className = "ochreshift-unavailable";
      warn.textContent = state.configErrorMessage || "This chat is temporarily unavailable. Please check back soon.";
      el.appendChild(warn);
    } else if (state.suggestions && state.suggestions.length) {
      var chips = document.createElement("div");
      chips.className = "ochreshift-chips";
      state.suggestions.forEach(function (raw) {
        var q = String(raw || "").trim();
        if (!q) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ochreshift-chip";
        btn.innerHTML = ICON_SPARK;
        var span = document.createElement("span");
        span.className = "ochreshift-chip-text";
        span.textContent = q;
        btn.appendChild(span);
        var kbd = document.createElement("span");
        kbd.className = "ochreshift-chip-kbd";
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
    var existing = shadow.getElementById("ochreshift-empty");
    if (!existing) return; // user already sent a message — don't disturb history
    existing.remove();
    renderEmptyState();
  }

  function removeEmptyState() {
    var el = shadow.getElementById("ochreshift-empty");
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
    if (Array.isArray(cfg.formSchema) && cfg.formSchema.length > 0) state.formSchema = cfg.formSchema;

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
      // Panel background colour
      if (design.panelBg) {
        anchorEl.style.setProperty("--panel-bg", design.panelBg);
        panelEl.style.background = "var(--panel-bg)";
      }
      // Position (anchor corner)
      if (!hasAttr("data-position") && design.position) {
        RAW.position = design.position;
        applyPlacement();
      }
      // Offsets
      if (!hasAttr("data-offset-x") && typeof design.offX === "number") {
        RAW.offsetX = design.offX;
        applyPlacement();
      }
      if (!hasAttr("data-offset-y") && typeof design.offY === "number") {
        RAW.offsetY = design.offY;
        applyPlacement();
      }
      // Custom launcher label
      if (design.label) {
        var launcherLabelEl = shadow.getElementById("ochreshift-launcher-label");
        if (launcherLabelEl) launcherLabelEl.textContent = design.label;
      }
      // Brand toggle (separate from whitelabel)
      if (typeof design.brand === "boolean" && !design.brand) {
        var brandEl0 = shadow.getElementById("ochreshift-footer-brand");
        if (brandEl0) brandEl0.style.display = "none";
      }
      // Whitelabel: server-authoritative
      if (RAW.whitelabel && cfg.whitelabelAllowed) {
        var brandEl = shadow.getElementById("ochreshift-footer-brand");
        if (brandEl) brandEl.style.display = "none";
      }
    } else {
      // No design blob — still apply whitelabel if both sides agree
      if (RAW.whitelabel && cfg.whitelabelAllowed) {
        var brandEl2 = shadow.getElementById("ochreshift-footer-brand");
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

    var input = shadow.getElementById("ochreshift-input");
    var sendBtn = shadow.getElementById("ochreshift-send-btn");
    if (input) input.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
  }

  // =======================================================================
  // Chat: ask() → /chat, scan indicator, typewriter reveal
  // =======================================================================
  function setScanning(on) {
    state.isScanning = on;
    var input = shadow.getElementById("ochreshift-input");
    var sendBtn = shadow.getElementById("ochreshift-send-btn");
    var unavailable = state.configStatus === "error";
    if (input) input.disabled = on || unavailable;
    if (sendBtn) sendBtn.disabled = on || unavailable || !(input && input.value.trim());
    if (on) appendScanIndicator();
    else removeScanIndicator();
  }

  function appendScanIndicator() {
    removeScanIndicator();
    var el = document.createElement("div");
    el.className = "ochreshift-scan";
    el.id = "ochreshift-scan-indicator";
    el.innerHTML =
      '<div class="ochreshift-scan-label"><span class="ochreshift-scan-dot"></span>searching your knowledge…</div>' +
      '<div class="ochreshift-scan-bar ochreshift-w1"></div>' +
      '<div class="ochreshift-scan-bar ochreshift-w2"></div>' +
      '<div class="ochreshift-scan-bar ochreshift-w3"></div>';
    streamEl.appendChild(el);
    scrollToBottom();
  }

  function removeScanIndicator() {
    var el = shadow.getElementById("ochreshift-scan-indicator");
    if (el) el.remove();
  }

  function typewriter(el, text, onComplete) {
    if (prefersReducedMotion() || !text) {
      el.textContent = text || "";
      if (onComplete) onComplete();
      return;
    }
    var words = text.split(" ");
    var i = 0;
    var iv = setInterval(function () {
      i++;
      el.textContent = words.slice(0, i).join(" ");
      scrollToBottom();
      if (i >= words.length) {
        clearInterval(iv);
        if (onComplete) onComplete();
      }
    }, 30);
  }

  /** @param {boolean} [isRestore] - true when rehydrating from the sessionStorage cache: skip re-persisting and just render instantly. */
  function addUserMessage(text, isRestore) {
    removeEmptyState();
    var el = document.createElement("div");
    el.className = "ochreshift-msg-user";
    el.textContent = text;
    streamEl.appendChild(el);
    scrollToBottom();
    if (!isRestore) appendHistory({ role: "user", text: text });
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
    wrap.className = "ochreshift-proof-wrap";
    var match = typeof src.match === "number" ? src.match : parseInt(src.match, 10) || 0;

    var card = document.createElement("div");
    card.className = "ochreshift-proof";
    card.style.setProperty("--match", match + "%");

    var meta = document.createElement("div");
    meta.className = "ochreshift-proof-meta";

    var fileSpan = document.createElement("span");
    fileSpan.className = "ochreshift-proof-file";
    fileSpan.innerHTML = ICON_FILE;
    var fileNameSpan = document.createElement("span");
    fileNameSpan.textContent = src.file || "document";
    fileSpan.appendChild(fileNameSpan);
    meta.appendChild(fileSpan);

    var matchWrap = document.createElement("span");
    matchWrap.className = "ochreshift-proof-match";
    matchWrap.innerHTML = '<span class="ochreshift-proof-bar"><span class="ochreshift-proof-bar-fill"></span></span>';
    var pct = document.createElement("span");
    pct.className = "ochreshift-proof-pct";
    pct.textContent = match + "% match";
    matchWrap.appendChild(pct);
    meta.appendChild(matchWrap);

    card.appendChild(meta);

    var snip = document.createElement("div");
    snip.className = "ochreshift-proof-snip";
    appendHighlighted(snip, src.snip || "", src.highlight || "");
    card.appendChild(snip);

    wrap.appendChild(card);
    return wrap;
  }

  function buildLeadTicket(onDone) {
    var el = document.createElement("div");
    el.className = "ochreshift-ticket-wrap";
    el.innerHTML =
      '<div class="ochreshift-ticket" id="zt-card">' +
      '<span class="ochreshift-ticket-stamp">WARM LEAD</span>' +
      '<h4 class="ochreshift-ticket-title">' + escapeHtml(state.name) + " · handoff</h4>" +
      '<div class="ochreshift-ticket-sub">Leave your details and the team will reach out.</div>' +
      '<div class="ochreshift-ticket-fields" id="zt-fields"></div>' +
      '<button type="button" class="ochreshift-ticket-submit" id="zt-submit" disabled>Hand me to the team →</button>' +
      '<div class="ochreshift-ticket-error" id="zt-error" hidden></div>' +
      "</div>";

    var card = el.querySelector("#zt-card");
    var fieldsWrap = el.querySelector("#zt-fields");
    var submitBtn = el.querySelector("#zt-submit");
    var errorEl = el.querySelector("#zt-error");
    var phase = "idle"; // idle | sending | sent | gone | error
    var inputEls = {};

    var schema = state.formSchema && state.formSchema.length > 0 ? state.formSchema : [
      { id: "name", label: "Your name", type: "text", required: true },
      { id: "email", label: "Email", type: "email", required: true },
      { id: "phone", label: "Phone (optional)", type: "tel", required: false },
      { id: "message", label: "What do you need? (optional)", type: "text", required: false }
    ];

    function refresh() {
      var can = true;
      for (var i = 0; i < schema.length; i++) {
        var f = schema[i];
        if (f.required && inputEls[f.id]) {
          var val = inputEls[f.id].value || "";
          if (val.trim().length === 0) can = false;
        }
      }
      submitBtn.disabled = !can || phase === "sending" || phase === "sent" || phase === "gone";
    }

    for (var i = 0; i < schema.length; i++) {
      var f = schema[i];
      var inputEl;
      if (f.type === "dropdown" && Array.isArray(f.options) && f.options.length > 0) {
        inputEl = document.createElement("select");
        inputEl.className = "ochreshift-ticket-input";
        var defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = "-- Select " + f.label + " --";
        inputEl.appendChild(defaultOpt);
        for (var j = 0; j < f.options.length; j++) {
          var opt = document.createElement("option");
          opt.value = f.options[j];
          opt.textContent = f.options[j];
          inputEl.appendChild(opt);
        }
      } else if (f.type === "textarea") {
        inputEl = document.createElement("textarea");
        inputEl.className = "ochreshift-ticket-input";
        inputEl.rows = 2;
        inputEl.placeholder = f.label + (f.required ? "" : " (optional)");
      } else {
        inputEl = document.createElement("input");
        inputEl.className = "ochreshift-ticket-input";
        inputEl.type = f.type || "text";
        inputEl.placeholder = f.label + (f.required ? "" : " (optional)");
      }
      inputEl.id = "zt-" + f.id;
      inputEl.setAttribute("aria-label", f.label);
      inputEl.addEventListener("input", refresh);
      inputEl.addEventListener("change", refresh);
      fieldsWrap.appendChild(inputEl);
      inputEls[f.id] = inputEl;
    }

    function clearError() {
      errorEl.hidden = true;
      errorEl.innerHTML = "";
    }

    // Success is only shown once the /lead POST actually confirms — previously
    // this animated to "Sent ✓" unconditionally (fire-and-forget), so a failed
    // submission looked identical to a successful one and the lead was lost
    // with no signal to the visitor or the business. On failure the entered
    // values are left in place and a retry re-submits the same payload.
    function showError() {
      phase = "error";
      errorEl.hidden = false;
      errorEl.innerHTML = "";
      var strong = document.createElement("b");
      strong.textContent = "Couldn't send — check your connection.";
      errorEl.appendChild(strong);
      var span = document.createElement("span");
      span.textContent = "Your details below are still here. ";
      errorEl.appendChild(span);
      var retryBtn = document.createElement("button");
      retryBtn.type = "button";
      retryBtn.className = "ochreshift-ticket-retry";
      retryBtn.textContent = "Try again";
      retryBtn.addEventListener("click", submitLead);
      errorEl.appendChild(retryBtn);
      submitBtn.textContent = "Hand me to the team →";
      refresh();
    }

    function submitLead() {
      if (phase === "sending" || phase === "sent" || phase === "gone") return;
      clearError();

      var leadName = (inputEls["name"] && inputEls["name"].value.trim()) || "Visitor";
      var emailVal = (inputEls["email"] && inputEls["email"].value.trim()) || "";
      var phoneVal = (inputEls["phone"] && inputEls["phone"].value.trim()) || "";
      var msgVal = (inputEls["message"] && inputEls["message"].value.trim()) || "";
      var customData = {};

      for (var k = 0; k < schema.length; k++) {
        var sid = schema[k].id;
        if (["name", "email", "phone", "message"].indexOf(sid) === -1 && inputEls[sid]) {
          customData[schema[k].label || sid] = inputEls[sid].value.trim();
        }
      }

      if (!HAS_FETCH) {
        showError();
        return;
      }

      phase = "sending";
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      var payload = { name: leadName, email: emailVal, botId: BOT_ID, custom_data: customData };
      if (phoneVal) payload.phone = phoneVal;
      if (msgVal) payload.message = msgVal;

      fetch(API_URL + "/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Lead submit failed (" + res.status + ")");
          var reduce = prefersReducedMotion();
          phase = "sent";
          card.classList.add("ochreshift-sent");
          submitBtn.textContent = "Sent ✓";
          setTimeout(function () {
            phase = "gone";
            card.classList.remove("ochreshift-sent");
            card.classList.add("ochreshift-gone");
            setTimeout(function () { onDone(leadName); }, reduce ? 0 : 420);
          }, reduce ? 0 : 640);
        })
        .catch(function () {
          showError();
        });
    }

    submitBtn.addEventListener("click", submitLead);

    setTimeout(function () { if (inputEls["name"]) inputEls["name"].focus(); }, 60);

    return el;
  }

  function buildLeadStub(name) {
    var el = document.createElement("div");
    el.className = "ochreshift-stub";
    el.innerHTML = '<span class="ochreshift-stub-check">' + ICON_CHECK_BOLD + "</span>" + "<div><b>Handed to the team.</b><small class=\"ochreshift-stub-name\"></small></div>";
    el.querySelector(".ochreshift-stub-name").textContent = (name || "This visitor") + " — marked a warm lead.";
    return el;
  }

  /** @param {boolean} [isRestore] - true when rehydrating from the sessionStorage cache. */
  function addAssistantMessage(payload, isRestore) {
    removeEmptyState();

    var wrap = document.createElement("div");
    wrap.className = "ochreshift-msg-assistant";

    var head = document.createElement("div");
    head.className = "ochreshift-msg-assistant-head";
    // For AI bubbles, we can stick to ICON_LOGO matching the React design which strictly uses OchreshiftLogo for system messages
    head.innerHTML = ICON_LOGO;
    wrap.appendChild(head);

    var textSpan = document.createElement("div");
    textSpan.className = "ochreshift-msg-assistant-text";
    wrap.appendChild(textSpan);

    var hasSource = payload.sources && payload.sources.length > 0;
    var showProof = RAW.sources && hasSource;

    // limitReached = a business/plan-level failure (bot disabled, monthly
    // quota exceeded) — server-distinguished from a normal "no docs matched"
    // guardrail via data.limitReached. Rendered like the /config-unavailable
    // notice, not the friendly guardrail treatment, and with no lead-capture
    // affordance: nobody on the business side can act on a submission right
    // now, so offering the form would just collect details that go nowhere.
    if (payload.limitReached) {
      var la = document.createElement("div");
      la.className = "ochreshift-unavailable";
      la.textContent = payload.text;
      wrap.appendChild(la);
    } else if (payload.isGuardrail) {
      var g = document.createElement("div");
      g.className = "ochreshift-guardrail";
      g.innerHTML = ICON_WARNING;
      var gt = document.createElement("span");
      gt.textContent = "No matching source — routing you to a human.";
      g.appendChild(gt);
      wrap.appendChild(g);
    }

    if (showProof) {
      wrap.appendChild(Object.assign(document.createElement("div"), { className: "ochreshift-connector" }));
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

    if (payload.limitReached) {
      // no lead-capture affordance — see the comment above
    } else if (payload.isGuardrail) {
      mountTicket();
    } else if (hasSource) {
      var leadBtn = document.createElement("button");
      leadBtn.type = "button";
      leadBtn.className = "ochreshift-lead-btn";
      leadBtn.innerHTML = ICON_USERPLUS + "<span>Book / leave my details</span>";
      leadBtn.addEventListener("click", mountTicket);
      slot.appendChild(leadBtn);
    }

    streamEl.appendChild(wrap);
    scrollToBottom();

    if (!isRestore) {
      appendHistory({
        role: "assistant",
        text: payload.text,
        sources: payload.sources,
        isGuardrail: payload.isGuardrail,
        limitReached: payload.limitReached,
      });
    }

    if (isRestore) {
      // Rehydrating from cache: render instantly, no typing animation and no
      // screen-reader announcement (nothing "just happened" on a page load).
      textSpan.textContent = payload.text || "";
    } else {
      typewriter(textSpan, payload.text, function () {
        announceToScreenReader(payload.text);
      });
    }

    if (showProof) {
      setTimeout(function () {
        var cards = wrap.querySelectorAll(".ochreshift-proof");
        for (var i = 0; i < cards.length; i++) cards[i].classList.add("ochreshift-revealed");
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
      body: JSON.stringify({ message: text, botId: BOT_ID, sessionId: SESSION_ID }),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) {
          var err = new Error("Backend responded " + res.status);
          err.status = res.status;
          throw err;
        }
        return res.json();
      })
      .then(function (data) {
        setScanning(false);
        addAssistantMessage({
          text: data.answer || "Sorry, I didn't get a response. Please try again.",
          sources: Array.isArray(data.sources) ? data.sources : [],
          isGuardrail: !!data.isGuardrail,
          limitReached: !!data.limitReached,
        });
      })
      .catch(function (err) {
        if (timer) clearTimeout(timer);
        setScanning(false);
        addAssistantMessage({
          text: classifyChatError(err),
          sources: [],
          isGuardrail: false,
        });
      });
  }

  // A network drop, a slow/timed-out request, a 5xx, and a 429 are different
  // problems with different next steps for the visitor — collapsing them into
  // one "couldn't reach the server" string made a temporary blip and an
  // extended outage indistinguishable, so users had no signal for whether to
  // retry immediately or come back later.
  function classifyChatError(err) {
    if (err && err.name === "AbortError") {
      return "That's taking longer than expected. Please try again in a moment.";
    }
    if (err && typeof err.status === "number") {
      if (err.status === 429) return "You're sending messages a little fast — please wait a moment and try again.";
      if (err.status >= 500) return "We're having trouble on our end right now. Please try again shortly.";
      if (err.status >= 400) return "Sorry, that request couldn't be processed. Please try again.";
    }
    return "Sorry — I couldn't reach the server just now. Please check your connection and try again.";
  }

  // ---- go ------------------------------------------------------------------
  // Invoked last (not right after its definition) so every `var` constant
  // above — icons, RAW, state, GENERIC_SUGGESTIONS — is guaranteed to be
  // assigned before mount() can possibly run, including the synchronous path
  // (whenBodyReady calls back immediately when document.body already exists).
  boot();
  if (typeof WebSocket !== "undefined") connectLiveChat();
})();
