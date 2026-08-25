import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUp, SearchX } from "lucide-react";
import { OchreshiftLogo } from "@/components/ui/OchreshiftLogo";

export const metadata: Metadata = {
  title: "Page not found · OchreShift",
  description:
    "This route doesn't exist. Head back to the OchreShift homepage, browse the docs, or try the live demo.",
};

const NF_CSS = `
.nf-shell{position:relative;min-height:100vh;display:flex;flex-direction:column;background:var(--bg);color:var(--text);overflow:hidden}
.nf-stage{position:absolute;inset:-20% -10% auto -10%;height:130%;z-index:0;pointer-events:none;filter:blur(60px) saturate(1.2);opacity:.55;background:radial-gradient(38% 55% at 78% 12%,color-mix(in srgb,var(--accent) 50%,transparent),transparent 70%),radial-gradient(34% 50% at 18% 8%,color-mix(in srgb,var(--good) 30%,transparent),transparent 72%),radial-gradient(50% 60% at 60% 78%,color-mix(in srgb,var(--accent-strong) 38%,transparent),transparent 74%);background-size:180% 180%;animation:aurora-shift 22s ease-in-out infinite}
.nf-dots{position:absolute;inset:0;z-index:0;pointer-events:none;background-image:radial-gradient(color-mix(in srgb,var(--fg) 9%,transparent) 1px,transparent 1px);background-size:30px 30px;-webkit-mask-image:radial-gradient(75% 65% at 50% 32%,#000 0%,transparent 80%);mask-image:radial-gradient(75% 65% at 50% 32%,#000 0%,transparent 80%);opacity:.5}
.nf-topbar,.nf-content,.nf-footerbar{position:relative;z-index:2}
.nf-grid{width:100%;max-width:1240px;margin:0 auto;padding:56px 24px 72px;display:grid;grid-template-columns:1fr;gap:64px;align-items:center}
@media(min-width:1024px){.nf-grid{grid-template-columns:1.02fr .98fr;gap:72px;padding:48px 48px 88px}}
@keyframes nf-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.nf-rise{animation:nf-rise .8s cubic-bezier(.16,1,.3,1) both}
.nf-code{font-family:var(--font-display);font-weight:700;font-size:clamp(112px,17vw,196px);line-height:.92;letter-spacing:-.05em;background:linear-gradient(100deg,var(--accent) 0%,color-mix(in srgb,var(--accent) 55%,var(--good)) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;background-size:220% 100%;animation:sweep 6s linear infinite;margin:0 0 10px}
.nf-title{font-family:var(--font-display);font-weight:700;font-size:clamp(32px,4.6vw,52px);line-height:1.06;letter-spacing:-.038em;color:var(--text);margin:0 0 18px}
.nf-sub{font-size:16.5px;line-height:1.65;color:var(--muted);max-width:520px;margin:0 0 32px}
.nf-btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 30px;border-radius:12px;background:var(--accent);color:#08111F;font-size:15px;font-weight:650;text-decoration:none;white-space:nowrap;transition:all .2s cubic-bezier(.16,1,.3,1);box-shadow:inset 0 1px 1px rgba(255,255,255,.35),0 4px 16px color-mix(in srgb,var(--accent) 22%,transparent)}
.nf-btn-primary:hover{transform:translateY(-2px);background:#ffb71a;box-shadow:inset 0 1px 1px rgba(255,255,255,.45),0 8px 26px color-mix(in srgb,var(--accent) 36%,transparent)}
.nf-btn-primary:active{transform:scale(.98)}
.nf-btn-primary svg{transition:transform .2s ease}
.nf-btn-primary:hover svg{transform:translateX(3px)}
.nf-btn-ghost{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 26px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:15px;font-weight:600;text-decoration:none;white-space:nowrap;transition:all .15s ease}
.nf-btn-ghost:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--accent) 45%,var(--border))}
.nf-btn-ghost:active{transform:scale(.98)}
.nf-try{display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-family:var(--mono);font-size:12px;color:var(--faint);margin-top:30px}
.nf-try a{color:var(--muted);text-decoration:none;padding:2px 8px;border-radius:6px;border:1px dashed var(--border);transition:all .15s ease}
.nf-try a:hover{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
.nf-side{position:relative;display:flex;justify-content:center}
.nf-ghost{position:absolute;top:50%;left:50%;transform:translate(-50%,-58%);font-family:var(--font-display);font-weight:800;font-size:min(34vw,380px);line-height:1;color:transparent;-webkit-text-stroke:1.5px color-mix(in srgb,var(--accent) 16%,transparent);pointer-events:none;user-select:none;z-index:0}
.nf-cardwrap{position:relative;z-index:1;width:100%;max-width:432px;border-radius:20px}
.nf-cardwrap.grad-border::before{border-radius:inherit}
.nf-failchip{display:inline-flex;align-items:center;gap:6px;padding:8px 12px;border-radius:9px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.16);font-size:11.5px;font-weight:600;letter-spacing:.02em;color:#FCA5A5;align-self:flex-start}
.nf-failchip svg{flex-shrink:0}
.nf-chips{display:flex;flex-wrap:wrap;gap:8px}
.nf-chip{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:999px;font-family:var(--mono);font-size:11.5px;font-weight:600;letter-spacing:.02em;color:#FFC94D;background:rgba(245,169,0,.08);border:1px solid rgba(245,169,0,.18);text-decoration:none;transition:all .15s ease}
.nf-chip:hover{background:rgba(245,169,0,.17);transform:translateY(-1px)}
.nf-hex{position:absolute;z-index:1;pointer-events:none;opacity:.5}
.nf-footerbar{border-top:1px solid var(--border)}
@media(max-width:1023px){.nf-grid{gap:56px}}
`;

function HexMark({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden>
      <polygon points="16,2 3.88,9 3.88,23 16,30 16,22.4 10.8,19.4 10.8,11 16,8" fill="var(--accent)" />
      <polygon points="16,2 16,8 21.2,11 21.2,19.4 16,22.4 16,30 28.12,23 28.12,9" fill="var(--good)" opacity="0.55" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main className="nf-shell">
      <style>{NF_CSS}</style>

      <div className="nf-stage" aria-hidden />
      <div className="nf-dots" aria-hidden />

      <header className="nf-topbar">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-12 py-5 flex items-center justify-between">
          <Link href="/" aria-label="OchreShift home" className="shrink-0">
            <OchreshiftLogo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="text-sm font-[500] text-muted hover:text-fg transition-colors">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="bg-accent text-[#08111F] font-[600] text-sm rounded-md px-5 py-2.5 hover:bg-accent-strong transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <div className="nf-content flex-1 flex items-center">
        <div className="nf-grid">
          <HexMark className="nf-hex float-a w-16 h-16 hidden md:block" style={{ top: "-4%", right: "6%" }} />
          <HexMark className="nf-hex float-c w-24 h-24 hidden lg:block" style={{ bottom: "2%", left: "-3%", opacity: 0.3 }} />

          <section className="nf-side-order min-w-0">
            <span className="badge-pill nf-rise" style={{ animationDelay: "40ms" }}>
              <span className="eyebrow-dot" />
              Error 404 · Route not found
            </span>

            <div className="nf-code nf-rise" role="presentation" style={{ animationDelay: "120ms", marginTop: "26px" }}>
              404
            </div>

            <h1 className="nf-title nf-rise" style={{ animationDelay: "220ms" }}>
              Well, this page <span className="gradient-text">shifted</span> away.
            </h1>

            <p className="nf-sub nf-rise" style={{ animationDelay: "320ms" }}>
              The link may be broken, moved, or never existed. Our answer engine
              searched every source it has and came back empty-handed.
            </p>

            <div className="flex flex-wrap items-center gap-4 nf-rise" style={{ animationDelay: "420ms" }}>
              <Link href="/" className="nf-btn-primary">
                Back to homepage
                <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
              <Link href="/demo" className="nf-btn-ghost">
                Try the live demo
              </Link>
            </div>

            <div className="nf-try nf-rise" style={{ animationDelay: "520ms" }}>
              <span>quick jumps:</span>
              <Link href="/">~/home</Link>
              <Link href="/docs">~/docs</Link>
              <Link href="/sign-up">~/start-free</Link>
              <a href="mailto:hello@ochreshift.com">~support</a>
            </div>
          </section>

          <section className="nf-side min-w-0" aria-label="What happened, as a chat">
            <div className="nf-ghost" aria-hidden>
              404
            </div>

            <div className="nf-cardwrap grad-border nf-rise" style={{ animationDelay: "300ms" }}>
              <div className="hero-chat-ui">
                <div className="hero-chat-header">
                  <div className="hero-chat-header-left">
                    <div className="hero-chat-avatar">
                      <svg viewBox="0 0 32 32" fill="none" className="hero-chat-avatar-icon" aria-hidden>
                        <polygon points="16,2 3.88,9 3.88,23 16,30 16,22.4 10.8,19.4 10.8,11 16,8" fill="#08111F" />
                        <polygon points="16,2 16,8 21.2,11 21.2,19.4 16,22.4 16,30 28.12,23 28.12,9" fill="#08111F" opacity="0.55" />
                      </svg>
                    </div>
                    <div>
                      <div className="hero-chat-name">OchreShift</div>
                      <div className="hero-chat-status">
                        <span className="hero-chat-status-dot" />
                        online
                      </div>
                    </div>
                  </div>
                  <div className="hero-chat-header-actions" aria-hidden>
                    <span className="hero-chat-header-dot" />
                    <span className="hero-chat-header-dot" />
                    <span className="hero-chat-header-dot" />
                  </div>
                </div>

                <div className="hero-chat-messages">
                  <div className="hero-chat-row hero-chat-row--customer">
                    <div className="hero-chat-bubble hero-chat-bubble--customer">
                      <div className="hero-chat-bubble-avatar hero-chat-bubble-avatar--customer">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
                        </svg>
                      </div>
                      <div className="hero-chat-bubble-content">
                        <span className="hero-chat-bubble-label">Visitor</span>
                        <p>hey, take me to /super-secret-dashboard</p>
                      </div>
                    </div>
                  </div>

                  <div className="hero-chat-row hero-chat-row--ai">
                    <div className="hero-chat-bubble hero-chat-bubble--ai">
                      <div className="hero-chat-bubble-avatar hero-chat-bubble-avatar--ai">
                        <svg viewBox="0 0 32 32" width="14" height="14" fill="none" aria-hidden>
                          <polygon points="16,2 3.88,9 3.88,23 16,30 16,22.4 10.8,19.4 10.8,11 16,8" fill="currentColor" />
                          <polygon points="16,2 16,8 21.2,11 21.2,19.4 16,22.4 16,30 28.12,23 28.12,9" fill="currentColor" opacity="0.55" />
                        </svg>
                      </div>
                      <div className="hero-chat-bubble-content">
                        <span className="hero-chat-bubble-label">OchreShift</span>
                        <p>
                          I swept every source docs, pages, FAQs. Nothing lives
                          at that address. Even I can&apos;t ground an answer out
                          of thin air.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="nf-failchip nf-rise" style={{ animationDelay: "900ms" }}>
                    <SearchX size={14} />
                    0 sources matched · HTTP 404
                  </div>

                  <div className="nf-chips" style={{ marginTop: "2px" }}>
                    <Link href="/" className="nf-chip">
                      ← go home
                    </Link>
                    <Link href="/docs" className="nf-chip">
                      read the docs
                    </Link>
                    <a href="mailto:hello@ochreshift.com" className="nf-chip">
                      talk to a human
                    </a>
                  </div>
                </div>

                <div className="hero-chat-input-bar">
                  <div className="hero-chat-input-field">
                    <span className="hero-chat-input-placeholder type-caret">Ask me anything…</span>
                  </div>
                  <button type="button" className="hero-chat-send-btn" tabIndex={-1} aria-hidden>
                    <ArrowUp size={18} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="nf-footerbar">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-12 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <OchreshiftLogo variant="mark" className="h-5 w-5" />
            <span className="text-[13px] text-faint">
              © {new Date().getFullYear()} Ochreshift every route leads somewhere, this one didn&apos;t.
            </span>
          </div>
          <span className="font-mono text-[11px] text-faint type-caret">
            status: route_not_found · code 404
          </span>
        </div>
      </footer>
    </main>
  );
}
