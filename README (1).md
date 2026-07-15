# Zeva Chat Widget — Next.js drop-in

A polished RAG chatbot widget component. Pure Tailwind, light + dark mode,
per-client brand color, and wired to your FastAPI `/chat` and `/lead` endpoints.

## 1. Copy the file

Put `ZevaWidget.jsx` into your Next.js app:

```
zeva-frontend/
└── components/
    └── ZevaWidget.jsx
```

Requires: Next.js (App Router) + Tailwind CSS. Both are already in your
`create-next-app` setup — **no Tailwind config change needed to run.**

## 2. Use it on any page

```jsx
import ZevaWidget from "@/components/ZevaWidget";

export default function Home() {
  return (
    <main>
      {/* ...your page... */}
      <ZevaWidget
        botId="acme-salon-123"
        botName="Acme Salon"
        accent="#4f46e5"
        apiUrl={process.env.NEXT_PUBLIC_API_URL}
        welcome="Hi! Ask me anything about Acme Salon."
        suggestions={["What are your hours?", "Do you take walk-ins?", "Pricing?"]}
      />
    </main>
  );
}
```

For the **iframe embed** (`app/widget/page.js`), just render `<ZevaWidget />`
full-bleed and let `widget.js` load it in the iframe.

## 3. Props

| Prop          | Type       | Default                         | Notes                                            |
| ------------- | ---------- | ------------------------------- | ------------------------------------------------ |
| `botId`       | `string`   | `"demo"`                        | Sent with every `/chat` and `/lead` call.        |
| `botName`     | `string`   | `"Zeva Assistant"`              | Shown in the header.                             |
| `accent`      | `string`   | `"#4f46e5"`                     | Any hex — the whole theme recolors from this.    |
| `apiUrl`      | `string`   | `NEXT_PUBLIC_API_URL`           | Your backend base URL.                           |
| `welcome`     | `string`   | greeting                        | First bot message.                               |
| `suggestions` | `string[]` | 3 sample questions              | Quick-reply chips shown at the start.            |
| `position`    | `string`   | `"right"`                       | `"right"` or `"left"`.                           |

## 4. Theming

The brand color is applied through a CSS variable (`--zeva-accent`), so each
client's bot can have its own color with **zero code changes** — just pass a
different `accent`. This is exactly the multi-tenant model from the tech plan
(one `botId` = one config/color).

### Optional: lock the brand into Tailwind

If you'd rather use `bg-brand` classes instead of the `accent` prop, add this
to `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4f46e5",
          strong: "#4338ca",
        },
      },
    },
  },
};
```

Then swap `style={{ backgroundColor: "var(--zeva-accent)" }}` for
`className="bg-brand"` wherever you want the fixed brand color.

## 5. Backend contract (matches your build phases)

- **POST `/chat`** → body `{ message, botId }` → returns `{ answer, sources: string[] }`
- **POST `/lead`** → body `{ name, email, phone, botId }` → returns `{ ok }`

If your field names differ, edit the two `fetch(...)` calls in `ZevaWidget.jsx`.

## 6. Dark mode

Uses Tailwind `dark:` variants. It follows whatever dark-mode strategy your app
already uses (`class` or `media`). No extra setup.
