# Integrating the Zeva Chat Widget

The Zeva widget is a single `<script>` tag. It works on any website — plain
HTML, a framework-built site, or a store on Shopify/WordPress/PrestaShop —
because it's a self-contained script that injects its own UI, not a package
you build into your app. No npm install, no build step, no framework
required.

Everything about how the widget looks and behaves is controlled by `data-*`
attributes on that one script tag. If you generated your snippet from the
Zeva Studio, you can copy it as-is. This document explains what each piece
means and how to drop it into common setups.

> **Placeholder URLs.** Two URLs in the examples below are placeholders
> because there is no live CDN or production API yet:
> `https://YOUR-ZEVA-DOMAIN/widget.js` (where `widget.js` is hosted) and
> `https://YOUR-ZEVA-API-DOMAIN` (the deployed backend API). Replace both
> with your real URLs once they're deployed. Until then, the snippet will
> not work on a real, live website.

---

## Quick start (plain HTML)

Paste this immediately before the closing `</body>` tag of every page you
want the widget on:

```html
<script
  src="https://YOUR-ZEVA-DOMAIN/widget.js"
  data-bot-id="acme-salon"
  data-name="Acme Salon"
  data-accent="#4f46e5"
  data-surface="auto"
  data-corners="soft"
  data-font="system"
  data-launcher="pill"
  data-position="bottom-right"
  data-glass="on"
  data-sources="on"
  data-api-url="https://YOUR-ZEVA-API-DOMAIN"
  async></script>
```

That's it — no CSS or extra JS files to include. The widget draws its own
launcher bubble and chat panel and positions itself with `position: fixed`,
so it floats over your existing page content.

### Attribute reference

| Attribute | Required? | Values | What it does |
| --- | --- | --- | --- |
| `data-bot-id` | **Yes** | e.g. `"acme-salon"` | Which tenant/bot this widget talks to. You're given this when your bot is set up. |
| `data-api-url` | **Yes** (in the current build) | full origin, e.g. `"https://api.yourdomain.com"` | Where the widget sends chat requests. Without this it defaults to `http://127.0.0.1:8000`, which only works on the developer's own machine — **a live site needs this set to the real deployed backend URL.** |
| `data-name` | Recommended | e.g. `"Acme Salon"` | Assistant name shown in the panel header. |
| `data-accent` | Recommended | hex, e.g. `"#4f46e5"` | Brand color used throughout the widget. |
| `data-position` | Recommended | `top-left` / `top-right` / `bottom-left` / `bottom-right` | Which corner the widget anchors to. |
| `data-surface` | Optional | `auto` / `light` / `dark` | Theme mode. `auto` follows the visitor's OS preference. |
| `data-corners` | Optional | `sharp` / `soft` / `round` | Border-radius style. |
| `data-font` | Optional | `system` / `rounded` / `serif` / `mono` / `google:<Family>` / `inherit` | Widget font. `inherit` picks up your page's font. |
| `data-font-family` / `data-font-url` | Optional | custom name / `.woff2` URL | Only used with a fully custom font. |
| `data-launcher` | Optional | `pill` / `bubble` / `bar` | Launcher button style. |
| `data-glass` | Optional | `on` / `off` | Frosted-glass panel background. |
| `data-sources` | Optional | `on` / `off` | Show the "answered from this document" source card under each answer. |
| `data-offset-x` / `data-offset-y` | Optional | px, e.g. `"24"` | Nudges the widget away from its anchored corner. |
| `data-whitelabel` | Optional | `on` | Hides the "Powered by Zeva" footer. |

**Honesty note:** the core attributes (`bot-id`, `name`, `accent`, `position`,
`api-url`) are confirmed live and working. The visual-styling attributes
(`surface`, `corners`, `font`, `launcher`, `glass`, `sources`, offsets,
`whitelabel`) are the documented widget contract and match what the Studio's
live preview shows — it's safe to set them now — but the widget script is
still being finished, so if one of them doesn't visibly change anything on
your site yet, the core chat (asking a question, getting a grounded answer)
is unaffected. Set them anyway so the snippet is ready as the rollout
finishes.

---

## Frameworks

The pattern is the same everywhere: get that one `<script>` tag into the
rendered HTML, once, on every page (or just the root layout/shell if your
app is a single-page app). Below is the idiomatic way to do that in each.

### React (Create React App / Vite / general SPA)

Inject the script in a `useEffect` on mount, and remove it on unmount if the
component can unmount:

```jsx
import { useEffect } from "react";

export function ZevaWidget() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://YOUR-ZEVA-DOMAIN/widget.js";
    script.async = true;
    script.dataset.botId = "acme-salon";
    script.dataset.name = "Acme Salon";
    script.dataset.accent = "#4f46e5";
    script.dataset.position = "bottom-right";
    script.dataset.apiUrl = "https://YOUR-ZEVA-API-DOMAIN";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
```

Mount `<ZevaWidget />` once near the root of your app (e.g. in `App.jsx`).
Note `dataset.botId` → renders as `data-bot-id`, `dataset.apiUrl` → renders
as `data-api-url` — the DOM automatically converts camelCase `dataset` keys
to kebab-case attributes.

**Next.js** apps should use `next/script` instead of raw DOM manipulation,
placed in the root layout (`app/layout.tsx`) or `_app.tsx`:

```jsx
import Script from "next/script";

<Script
  src="https://YOUR-ZEVA-DOMAIN/widget.js"
  strategy="afterInteractive"
  data-bot-id="acme-salon"
  data-name="Acme Salon"
  data-accent="#4f46e5"
  data-position="bottom-right"
  data-api-url="https://YOUR-ZEVA-API-DOMAIN"
/>
```

`strategy="afterInteractive"` loads it after the page becomes interactive,
which is the right tradeoff for a widget that isn't part of your critical
content. Any `data-*` prop you pass to `next/script` is forwarded straight
onto the underlying `<script>` tag, so this maps 1:1 to the plain HTML
snippet.

### Angular

The simplest and most reliable option is to add the script directly to
`src/index.html`, right before `</body>` — exactly like the plain HTML
version. This avoids any component-lifecycle edge cases and works whether or
not you're using server-side rendering (Angular Universal).

If you need to load it conditionally from a component/service instead, use
`Renderer2` with the `DOCUMENT` injection token (the SSR-safe way to touch
the DOM in Angular, rather than referencing `document` directly):

```ts
import { Component, OnInit, Renderer2, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";

@Component({ selector: "app-root", templateUrl: "./app.component.html" })
export class AppComponent implements OnInit {
  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const script = this.renderer.createElement("script");
    script.src = "https://YOUR-ZEVA-DOMAIN/widget.js";
    script.async = true;
    script.setAttribute("data-bot-id", "acme-salon");
    script.setAttribute("data-name", "Acme Salon");
    script.setAttribute("data-accent", "#4f46e5");
    script.setAttribute("data-position", "bottom-right");
    script.setAttribute("data-api-url", "https://YOUR-ZEVA-API-DOMAIN");
    this.renderer.appendChild(this.document.body, script);
  }
}
```

### Vue

For a Vue CLI or Vite project, either add the script to `public/index.html`
/ `index.html` directly (simplest), or inject it from your root component's
lifecycle hook.

Options API (`App.vue`):

```js
export default {
  mounted() {
    const script = document.createElement("script");
    script.src = "https://YOUR-ZEVA-DOMAIN/widget.js";
    script.async = true;
    script.setAttribute("data-bot-id", "acme-salon");
    script.setAttribute("data-name", "Acme Salon");
    script.setAttribute("data-accent", "#4f46e5");
    script.setAttribute("data-position", "bottom-right");
    script.setAttribute("data-api-url", "https://YOUR-ZEVA-API-DOMAIN");
    document.body.appendChild(script);
  },
};
```

Composition API equivalent:

```js
import { onMounted } from "vue";

onMounted(() => {
  const script = document.createElement("script");
  script.src = "https://YOUR-ZEVA-DOMAIN/widget.js";
  script.async = true;
  script.setAttribute("data-bot-id", "acme-salon");
  script.setAttribute("data-name", "Acme Salon");
  script.setAttribute("data-accent", "#4f46e5");
  script.setAttribute("data-position", "bottom-right");
  script.setAttribute("data-api-url", "https://YOUR-ZEVA-API-DOMAIN");
  document.body.appendChild(script);
});
```

### Plain JavaScript (no framework)

If your site is hand-written HTML/CSS/JS with no build step, just use the
[quick start snippet](#quick-start-plain-html) directly in your HTML file —
there's nothing extra to do.

If you're injecting HTML dynamically from JavaScript (e.g. a static site
generator's client hydration script, or a legacy jQuery-based site), inject
it the same way as the React/Vue examples above — create the `<script>`
element, set its attributes, append it to `document.body`.

---

## Platforms

### Shopify

1. In your Shopify admin, go to **Online Store → Themes**.
2. On your live theme, click the **`…`** (actions) menu → **Edit code**.
3. Open **`layout/theme.liquid`**.
4. Paste the widget `<script>` tag right before the closing `</body>` tag.
5. Save. The widget will appear on every page that uses this theme layout.

This edits the theme directly, so it will need to be re-added if you ever
switch to a different theme. Shopify's admin UI does shift over time (menu
wording, "Edit code" location), so if the steps above don't match exactly
what you see, look for **Edit code** under your theme's actions — that's
where `theme.liquid` lives. Shopify's checkout-only "Additional scripts"
setting is *not* the right place for this — it only runs on the checkout
page, not your storefront pages where you want the widget visible.

### WordPress

**No-code option (recommended for most shop owners):** install a plugin
along the lines of "Insert Headers and Footers" (several free plugins in
the WordPress plugin directory do this) and paste the widget `<script>` tag
into its **Footer** scripts box, then save. This survives theme updates and
doesn't require touching any code.

**Developer option:** edit your theme's `footer.php`, and paste the script
right before the closing `</body>` tag. Do this in a **child theme** if
possible — editing the parent theme directly means your change is wiped out
the next time the theme updates.

Page builders (Elementor, Divi, etc.) often have their own "Custom Code" or
"Header & Footer Scripts" setting under their theme/site settings — if
you're using one of those, that's usually the more convenient spot.

### PrestaShop

PrestaShop's back-office menu structure has changed across versions
(1.6 / 1.7 / 8.x), so rather than point you at an exact menu path that may
be out of date, here are the two reliable methods:

1. **Theme file edit (most reliable):** edit your active theme's footer
   template — typically something like
   `themes/<your-theme>/templates/_partials/footer.tpl` (exact path
   depends on your theme) — and add the widget `<script>` tag right before
   the closing `</body>`. Do this via FTP/SFTP or the back-office's theme
   file editor if it has one.
2. **No-code module option:** PrestaShop's Addons marketplace has several
   free "Custom HTML/JS" or "HTML Box" modules that let you paste a script
   into the page footer from the back office, without editing theme files
   directly. Search the module catalog (**Modules → Module Manager**) for
   one and follow its instructions.

If you (or the merchant) have a developer on hand, the theme-file-edit
approach is the most durable one, since it doesn't depend on a third-party
module staying maintained.

---

## Verifying it works

After adding the script, check off each of these on the live page:

- [ ] Open the page in a normal (non-cached) browser tab — a hard refresh
      helps if you're not sure.
- [ ] The chat launcher bubble/pill appears in the corner you configured.
- [ ] Clicking it opens the chat panel.
- [ ] Typing a real question about the business (something answerable from
      the documents that were loaded into the bot) and sending it returns an
      answer.
- [ ] The answer shows a source (the "answered from this document" card),
      assuming `data-sources` wasn't turned off.

If all of those work, the integration is done.

---

## Troubleshooting

**Widget doesn't appear at all.**
Open the browser console (F12 → Console) and check the Network tab for the
`widget.js` request. Common causes: the script `src` still points at a
placeholder/unreachable domain, an ad blocker or the site's Content Security
Policy is blocking the script, or the script tag isn't actually present in
the rendered HTML (view-source the page to confirm — some page builders
strip raw `<script>` tags unless added through their "custom code" field).

**Widget opens, but every answer says "Sorry, I'm having trouble
connecting. Please try again later."**
This is the widget's fallback message when the request to the backend
fails. Check the console for a `Zeva Widget Error` log — it'll show the
underlying failure. Typical causes: `data-bot-id` doesn't match a real bot
(the backend returns 404), the bot exists but `data-api-url` is wrong or
unreachable, or the backend itself is down.

**CORS error in the console** (something like *"has been blocked by CORS
policy"* or *"No 'Access-Control-Allow-Origin' header"*).
This means your site's domain isn't allowed to call the backend yet. There
are two server-side allow-lists involved — a global CORS origin list and a
per-bot `allowed_domains` list — and both are configured on the backend,
not from the embedding site. This is normally set during onboarding: new
bots default to allowing any domain (`"*"`), but get locked down to the
client's real domain when the bot goes live. If you're seeing this on a
domain that's supposed to be allowed, whoever manages the Zeva backend needs
to add that exact domain to the bot's allowed list — this isn't something
that can be fixed from the widget snippet or the client's website code.
