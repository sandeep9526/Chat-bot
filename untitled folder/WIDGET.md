# Zeva Widget — Configuration & Embed

## ZevaConfig Props

| Prop       | Type                      | Default         | Description                                                |
| ---------- | ------------------------- | --------------- | ---------------------------------------------------------- |
| `name`     | `string`                  | `"Acme Salon"`  | Assistant name shown in the panel header.                  |
| `label`    | `string`                  | `"Ask Acme Salon"` | Launcher button text.                                   |
| `welcome`  | `string`                  | (greeting)      | First bot message in the empty state.                      |
| `accent`   | `string` (hex)            | `"#4f46e5"`     | Brand accent — recolors the entire widget.                 |
| `surface`  | `"auto" \| "light" \| "dark"` | `"auto"`    | Theme mode. `auto` follows system preference.              |
| `corners`  | `"sharp" \| "soft" \| "round"` | `"soft"`    | Border-radius scale for all widget elements.              |
| `launcher` | `"pill" \| "bubble" \| "bar"` | `"pill"`     | Launcher button visual style.                              |
| `anchor`   | `Anchor`                  | `"bottom-right"`| Corner the widget is anchored to.                          |
| `offX`     | `number`                  | `24`            | Horizontal offset in px from the anchored corner.          |
| `offY`     | `number`                  | `24`            | Vertical offset in px from the anchored corner.            |
| `glass`    | `boolean`                 | `true`          | Frosted-glass (translucent + blurred) panel background.    |
| `sources`  | `boolean`                 | `true`          | Show the proof card with source file + match %.            |
| `brand`    | `boolean`                 | `true`          | Show "Powered by Zeva" in the footer.                      |
| `fontSrc`  | `FontSrc`                 | `"preset"`      | Font source mode (see below).                              |
| `font`     | `PresetFont`              | `"system"`      | Preset font when `fontSrc = "preset"`.                     |
| `gFont`    | `string`                  | `"Poppins"`     | Google Font family name when `fontSrc = "google"`.         |
| `cFam`     | `string`                  | `""`            | Custom font-family when `fontSrc = "custom"`.              |
| `cUrl`     | `string`                  | `""`            | Custom font file URL (.woff2/.woff) when `fontSrc = "custom"`. |

### Font source modes

- **`preset`** — Built-in system/rounded/serif/mono stacks. Fastest, no network.
- **`google`** — Loads the named family from Google Fonts at runtime.
- **`custom`** — Injects an `@font-face` from a user-supplied URL.
- **`inherit`** — Sets `font-family: inherit`. Only meaningful in inline/Shadow-DOM embed.

### Anchor values

`"top-left"` · `"top-right"` · `"bottom-left"` · `"bottom-right"`

The panel open-direction flips automatically: anchors on the bottom open upward, top anchors open downward.

## Embed code mapping

The Studio generates a `<script>` snippet. Each config prop maps to a `data-*` attribute:

| Config prop | `data-*` attribute | Values              |
| ----------- | ------------------ | ------------------- |
| botId       | `data-bot-id`      | `"acme-salon"`      |
| name        | `data-name`        | e.g. `"Acme Salon"` |
| accent      | `data-accent`      | hex, e.g. `"#4f46e5"` |
| surface     | `data-surface`     | `auto` / `light` / `dark` |
| corners     | `data-corners`     | `sharp` / `soft` / `round` |
| font        | `data-font`        | `system` / `rounded` / `serif` / `mono` / `google:Poppins` / `inherit` |
| font-family | `data-font-family` | Custom font name (only when `fontSrc = "custom"`) |
| font-url    | `data-font-url`    | Custom font file URL |
| launcher    | `data-launcher`    | `pill` / `bubble` / `bar` |
| position    | `data-position`    | anchor value, e.g. `"bottom-right"` |
| glass       | `data-glass`       | `on` / `off` |
| sources     | `data-sources`     | `on` / `off` |
| offset-x    | `data-offset-x`    | px (only if != 24)  |
| offset-y    | `data-offset-y`    | px (only if != 24)  |
| whitelabel  | `data-whitelabel`  | `on` (only when `brand = false`) |
| draggable   | `data-draggable`   | `on` / `off` (default `off`) — lets a visitor drag the closed launcher bubble to any corner; it snaps to the nearest of the 4 corners on release, same as Studio's design-time drag. Most chat widgets deliberately leave this off so the launcher stays in a predictable spot page-to-page — opt in only if you specifically want visitors to be able to move it. |

### Example snippet

```html
<script
  src="https://cdn.zeva.app/widget.js"
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
  async></script>
```

## Backend contract

- **POST `/chat`** → `{ message: string, botId?: string }` → `{ answer: string, sources: ChatSource[], isGuardrail: boolean }`
- **POST `/lead`** → `{ name: string, email: string, phone?: string, botId?: string }` → `{ ok: boolean }`

The demo/studio run in **mock mode**: `src/lib/api.ts` (`sendChat`, `submitLead`)
resolves answers locally against the injected `DEMO_KB`. It's the single swap
point — replace the mock block with a `fetch` to the real endpoint and nothing
else changes.

## Architecture

### Component tree

```
components/widget/      the Answer Engine
  ZevaWidget            root: open state + placement + self-theming (useZevaTheme)
  Launcher              pill / bubble / bar (cva), breathe, drag handle
  Panel                 dialog shell (open/close transform, header, footer)
  Composer              command input + SuggestionChips
  MessageStream         scroll region, empty state, scan indicator
  AnswerEntry           user bubble OR assistant answer + proof + lead flow
  ProofCard             source file + highlighted snippet + match-% meter
  ScanIndicator         "searching your knowledge" shimmer
  LeadTicket / LeadStub perforated ticket → WARM LEAD stamp → handoff stub

components/studio/      the customization Studio
  Studio                layout (controls sidebar + live preview + embed)
  Segmented ColorField Switch PlacementMap FontField EmbedCode   controls
  DemoSite              mock Acme Salon page behind the preview widget

lib/     types · defaults (+ BOT_ID) · knowledge (demo KB) · embed · color · api · cn
hooks/   useZevaTheme (accent/surface/corners + 4 font modes) · useDrag ·
         useZevaChat (orchestration) · useZevaApi (React Query) 
stores/  zevaStore (Zustand: config slice + session slice)
```

### State: Zustand (client) vs React Query (server)

> **Rule: Zustand = what the user is configuring/seeing; React Query = what the server owns.**

- **Zustand** (`stores/zevaStore.ts`) owns the `ZevaConfig` (accent, surface,
  corners, fonts, launcher, anchor/offsets, toggles, name/label/welcome), the
  widget open/closed state, drag placement, and the chat **message list**.
  Components subscribe with selectors (`useZevaStore(s => s.config.accent)`).
- **React Query** (`hooks/useZevaApi.ts`) owns server calls: `useSendMessage`
  and `useSubmitLead` are `useMutation`; `useBotConfig` is a `useQuery` for the
  real multi-tenant mode. The scan/typing state is the mutation's `isPending` —
  never a Zustand boolean. `providers.tsx` mounts the single `QueryClientProvider`.

### Rendering strategy

- `/studio`, `/demo` — **SSG** (static shell; all interactivity is client-side).
  Verified static in the build output. Each page is a Server Component that
  renders a client island (`<Studio/>` / `<ZevaWidget/>`).
- `/api/chat` — **dynamic**, per-request, uncached (`force-dynamic`).
- `/api/lead` — **dynamic** mutation, uncached.
- Real per-bot public config would be **ISR** (`fetch(..., { next: { revalidate }})`)
  since it changes rarely — see `useBotConfig`.

### Theming & tokens

All design tokens from the prototype live in `src/styles/globals.css` as
Tailwind v4 `@theme` tokens backed by CSS variables (`bg-surface`, `text-muted`,
`border-border`, `bg-accent`, `rounded-r1/r2/r3`, `shadow-panel`, `font-ui`,
`animate-breathe`, …), theme-aware via `:root[data-theme]` / `[data-corners]` /
`[data-font]`. The **only** runtime `style` usage is for genuinely dynamic values:
the picked accent (`--accent`/`--accent-strong`), drag offsets/position, the
match-% bar (`--match`), and swatch colors. Dark mode is the `data-theme`
strategy driven by React state; `surface: "auto"` follows `prefers-color-scheme`.
