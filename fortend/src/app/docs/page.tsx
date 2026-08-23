import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation | Ochreshift",
  description: "Learn how to build, customize, and integrate AI agents with Ochreshift.",
};

/* ──────── Table of Contents ──────── */
const TOC = [
  { id: "getting-started", label: "Getting Started" },
  { id: "creating-agent", label: "Creating an Agent" },
  { id: "custom-instructions", label: "Custom Instructions" },
  { id: "ai-models", label: "AI Models" },
  { id: "appearance", label: "Appearance & Studio" },
  { id: "installation", label: "Widget Installation" },
  { id: "allowed-domains", label: "Allowed Domains" },
  { id: "knowledge-base", label: "Knowledge Base & Sitemap Crawler" },
  { id: "leads", label: "Leads & Lead Scoring" },
  { id: "lead-form", label: "Custom Lead Forms" },
  { id: "conversations", label: "Conversations" },
  { id: "live-helpdesk", label: "Live Helpdesk (Human Takeover)" },
  { id: "email-notifications", label: "Email Notifications" },
  { id: "webhooks", label: "Webhooks" },
  { id: "google-sheets", label: "Google Sheets Integration" },
  { id: "whatsapp", label: "WhatsApp Integration" },
  { id: "analytics", label: "Analytics" },
  { id: "billing", label: "Billing & Plans" },
  { id: "data-privacy", label: "Data Privacy & GDPR" },
];

function CodeBlock({ children, lang = "json" }: { children: string; lang?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 mt-4 font-mono text-[12px] text-muted overflow-x-auto">
      <pre className="text-fg whitespace-pre-wrap">{children}</pre>
    </div>
  );
}

function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-6 text-2xl font-[700] tracking-tight border-b border-border pb-3">{title}</h2>
      <div className="space-y-4 text-[14px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function Callout({ type = "info", children }: { type?: "info" | "tip" | "warning"; children: React.ReactNode }) {
  const styles = {
    info: "bg-accent/5 border-accent/20 text-accent",
    tip: "bg-good/5 border-good/20 text-good",
    warning: "bg-bad/5 border-bad/20 text-bad",
  };
  const icons = { info: "💡", tip: "✅", warning: "⚠️" };
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 mt-4 ${styles[type]}`}>
      <span className="text-base mt-0.5">{icons[type]}</span>
      <div className="text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">

        {/* ── Header ── */}
        <header className="mb-12">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[13px] font-[600] text-muted hover:text-fg transition-colors mb-8">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-[800] tracking-tight">Documentation</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted max-w-2xl">
            Everything you need to configure, embed, and integrate your AI agents with Ochreshift.
          </p>
        </header>

        <div className="flex gap-12 lg:gap-16">

          {/* ── Sticky Sidebar TOC (desktop) ── */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-8 space-y-1">
              <p className="text-[11px] font-[700] uppercase tracking-wider text-muted mb-3">On this page</p>
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-[13px] font-[500] text-muted py-1 hover:text-fg transition-colors truncate"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0 space-y-16">

            {/* 1. Getting Started */}
            <DocSection id="getting-started" title="Getting Started">
              <p>
                Welcome to <strong className="text-fg">Ochreshift</strong> — your platform for building AI-powered chat agents that capture leads, answer questions, and hand off to your sales team automatically.
              </p>
              <p>Here is the typical workflow to go from zero to live agent:</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li><strong className="text-fg">Create an agent</strong> — give it a name and choose a template (or start from scratch).</li>
                <li><strong className="text-fg">Customize its instructions</strong> — tell it who it is, what it knows, and how it should behave.</li>
                <li><strong className="text-fg">Design its look</strong> — set colors, welcome message, and suggested questions in the Appearance studio.</li>
                <li><strong className="text-fg">Train it</strong> — upload documents or crawl your website so it can answer questions from your actual content.</li>
                <li><strong className="text-fg">Install the widget</strong> — paste a single script tag onto your website.</li>
                <li><strong className="text-fg">Connect integrations</strong> — set up email alerts, webhooks, Google Sheets, or WhatsApp.</li>
              </ol>
            </DocSection>

            {/* 2. Creating an Agent */}
            <DocSection id="creating-agent" title="Creating an Agent">
              <p>
                From your dashboard, click <strong className="text-fg">"Create Agent"</strong> to open the creation modal. You can:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-fg">Start from a template</strong> — pre-built agents for common use cases like Salon, Real Estate, Restaurant, or E-commerce.</li>
                <li><strong className="text-fg">Start from scratch</strong> — a blank agent that you fully configure yourself.</li>
              </ul>
              <p>
                Each agent gets a unique <strong className="text-fg">Bot ID</strong> (e.g., <code className="bg-surface px-1.5 py-0.5 rounded text-[12px] border border-border text-fg">acme-support</code>). This ID is used in the embed script and API calls.
              </p>
              <Callout type="info">
                Your plan determines how many agents you can create. If you hit the limit, you can upgrade your plan or delete unused agents.
              </Callout>
            </DocSection>

            {/* 3. Custom Instructions */}
            <DocSection id="custom-instructions" title="Custom Instructions">
              <p>
                The <strong className="text-fg">Custom Prompt Style</strong> is the most critical setting for your agent's quality. It tells the AI <em>who it is</em>, <em>what it knows</em>, and <em>how to respond</em>.
              </p>
              <p>Navigate to <strong className="text-fg">Settings → General → Custom Prompt Style</strong> to edit.</p>
              <p className="mt-2"><strong className="text-fg">Writing effective instructions:</strong></p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-fg">Define the persona</strong> — "You are a friendly customer support assistant for Acme Salon."</li>
                <li><strong className="text-fg">Set boundaries</strong> — "Do not discuss pricing for services we don't offer."</li>
                <li><strong className="text-fg">Provide knowledge</strong> — "Our services include haircuts ($30), coloring ($80), and spa treatments ($120)."</li>
                <li><strong className="text-fg">Guide lead capture</strong> — "If the user wants to book, ask for their name, phone number, and preferred date."</li>
              </ul>
              <CodeBlock lang="text">{`Example prompt:

You are the virtual assistant for Acme Salon, located at 123 Main Street.
Our hours are Mon-Sat 9am-7pm. We offer:
- Haircut: ₹500
- Hair coloring: ₹1,500
- Spa treatment: ₹2,000

When a customer wants to book, ask for their name, phone, and preferred time.
Be friendly, concise, and never make up services we don't offer.`}</CodeBlock>
            </DocSection>

            {/* 4. AI Models */}
            <DocSection id="ai-models" title="AI Models">
              <p>
                Navigate to <strong className="text-fg">Settings → General → AI Model</strong> to choose which LLM powers your agent.
              </p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-[13px] border border-border rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="text-left p-3 font-[650] text-fg">Model</th>
                      <th className="text-left p-3 font-[650] text-fg">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-3 font-[600] text-fg">Automatic (default)</td>
                      <td className="p-3">We pick the best model — recommended for most users.</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-[600] text-fg">LLaMA 3.3 70B</td>
                      <td className="p-3">Best reasoning quality. Ideal for complex Q&A.</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-[600] text-fg">Gemini 2.0 Flash Lite</td>
                      <td className="p-3">Fastest reply speed. Best for high-volume, simple queries.</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-[600] text-fg">Mistral Nemo 12B</td>
                      <td className="p-3">Best multilingual support. Great for Hindi, Spanish, etc.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-[600] text-fg">Qwen 2.5 32B</td>
                      <td className="p-3">Best for technical and developer-oriented questions.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <Callout type="tip">
                If you're unsure, leave it on <strong>Automatic</strong>. The platform will select the best model based on the query type.
              </Callout>
            </DocSection>

            {/* 5. Appearance & Studio */}
            <DocSection id="appearance" title="Appearance & Studio">
              <p>
                The <strong className="text-fg">Appearance</strong> tab in your dashboard is a visual studio where you configure how your chat widget looks and feels to visitors.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-fg">Agent Name</strong> — the name shown at the top of the chat widget.</li>
                <li><strong className="text-fg">Accent Color</strong> — your brand color used for the header, send button, and links.</li>
                <li><strong className="text-fg">Welcome Message</strong> — the first message visitors see when they open the chat (e.g., "Hi! How can I help you today?").</li>
                <li><strong className="text-fg">Suggested Questions</strong> — clickable prompt chips shown below the welcome message to guide the conversation (e.g., "What are your prices?", "Book an appointment").</li>
              </ul>
              <p>Changes are live-previewed in real time before you save.</p>
            </DocSection>

            {/* 6. Installation */}
            <DocSection id="installation" title="Widget Installation">
              <p>
                To embed your AI agent on any website, go to the <strong className="text-fg">Install</strong> tab and copy the embed script. Paste it into the <code className="bg-surface px-1.5 py-0.5 rounded text-[12px] border border-border text-fg">&lt;head&gt;</code> or just before the closing <code className="bg-surface px-1.5 py-0.5 rounded text-[12px] border border-border text-fg">&lt;/body&gt;</code> tag of your HTML.
              </p>
              <CodeBlock lang="html">{`<script
  src="https://ochreshift.com/widget.js"
  data-bot-id="YOUR_BOT_ID"
  defer
></script>`}</CodeBlock>
              <p>
                The widget will automatically load in the bottom-right corner and use the branding you configured in the Appearance tab.
              </p>
              <Callout type="info">
                Works on any website — WordPress, Shopify, Wix, Squarespace, Next.js, plain HTML, or anything else. Just paste the script.
              </Callout>
            </DocSection>

            {/* 7. Allowed Domains */}
            <DocSection id="allowed-domains" title="Allowed Domains">
              <p>
                For security, you can restrict which domains are allowed to load your chat widget. Navigate to <strong className="text-fg">Settings → General → Allowed Domains</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><code className="bg-surface px-1.5 py-0.5 rounded text-[12px] border border-border text-fg">*</code> — allows all domains (default).</li>
                <li><code className="bg-surface px-1.5 py-0.5 rounded text-[12px] border border-border text-fg">example.com, app.example.com</code> — restricts to specific domains only.</li>
              </ul>
              <Callout type="warning">
                If you set specific domains and someone embeds your widget on an unauthorized site, the widget will not load and chat/lead requests will be rejected.
              </Callout>
            </DocSection>

            {/* 8. Knowledge Base */}
            <DocSection id="knowledge-base" title="Knowledge Base & Sitemap Crawler">
              <p>
                Your agent can answer questions from your actual business content — not just the custom instructions. Go to the <strong className="text-fg">Knowledge</strong> tab to manage your agent's training data.
              </p>
              <p className="mt-2"><strong className="text-fg">Two ways to add knowledge:</strong></p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-fg">Upload Documents</strong> — drag and drop PDF, TXT, or DOCX files. The content is chunked, embedded, and stored for retrieval.</li>
                <li><strong className="text-fg">Sitemap Crawler</strong> — enter your website URL and the crawler will automatically discover and ingest all pages. It follows links recursively and extracts text content from each page.</li>
              </ul>
              <p>The crawled/uploaded content is stored in a vector database (ChromaDB) and used for Retrieval-Augmented Generation (RAG) during chat.</p>
              <Callout type="tip">
                Use the Sitemap Crawler for the best results — it automatically keeps your agent in sync with your website content.
              </Callout>
            </DocSection>

            {/* 9. Leads & Lead Scoring */}
            <DocSection id="leads" title="Leads & Lead Scoring">
              <p>
                Every time a visitor submits their contact info through the chat widget, a <strong className="text-fg">lead</strong> is captured and visible in your <strong className="text-fg">Leads</strong> tab.
              </p>
              <p className="mt-2">Leads are automatically scored as <strong className="text-fg">Hot</strong>, <strong className="text-fg">Warm</strong>, or <strong className="text-fg">Cold</strong> based on:</p>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-[13px] border border-border rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="text-left p-3 font-[650] text-fg">Score</th>
                      <th className="text-left p-3 font-[650] text-fg">Criteria</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-3 font-[600] text-fg">🔥 Hot</td>
                      <td className="p-3">Provided a phone number <strong>AND</strong> used buying-intent keywords (price, book, appointment, demo, buy, order, quote, interested, urgent, today).</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-3 font-[600] text-fg">🟡 Warm</td>
                      <td className="p-3">Provided a phone number <strong>OR</strong> used buying-intent keywords (but not both).</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-[600] text-fg">🔵 Cold</td>
                      <td className="p-3">No phone number and no buying-intent keywords detected.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                Hot and Warm leads automatically trigger a <strong className="text-fg">handoff</strong> — an AI-generated summary is created for your sales team, and notifications are sent via your configured email and webhook.
              </p>
              <p>You can export all leads as a CSV file from the Leads tab.</p>
            </DocSection>

            {/* 10. Custom Lead Forms */}
            <DocSection id="lead-form" title="Custom Lead Forms">
              <p>
                By default, the chat widget collects Name, Email, and Phone. You can customize the lead capture form to collect additional fields using the <strong className="text-fg">Lead Form Builder</strong>.
              </p>
              <p>
                Add custom fields like "Company", "Budget Range", "Preferred Date", or any other data you need for your sales process.
              </p>
            </DocSection>

            {/* 11. Conversations */}
            <DocSection id="conversations" title="Conversations">
              <p>
                The <strong className="text-fg">Conversations</strong> tab lets you review all past chat sessions between visitors and your AI agent.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>View full message transcripts.</li>
                <li>See visitor feedback (thumbs up/down) on individual AI responses.</li>
                <li>Use conversation history to refine your custom instructions and improve agent quality.</li>
              </ul>
            </DocSection>

            {/* 12. Live Helpdesk */}
            <DocSection id="live-helpdesk" title="Live Helpdesk (Human Takeover)">
              <p>
                The <strong className="text-fg">Live Helpdesk</strong> feature allows you or your support team to take over a conversation from the AI in real time.
              </p>
              <p className="mt-2"><strong className="text-fg">How it works:</strong></p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>Monitor active chat sessions from the dashboard.</li>
                <li>Click <strong className="text-fg">"Take Over"</strong> on any session — the AI is paused and the visitor sees a message: <em>"A live human representative has joined."</em></li>
                <li>Type your replies directly. The visitor receives them in real time via WebSocket.</li>
                <li>When done, click <strong className="text-fg">"Return to AI"</strong> — the AI resumes answering automatically.</li>
              </ol>
              <Callout type="tip">
                This is perfect for complex sales queries or sensitive issues where a human touch is needed. The AI handles routine questions 24/7; you step in only when it matters.
              </Callout>
            </DocSection>

            {/* 13. Email Notifications */}
            <DocSection id="email-notifications" title="Email Notifications">
              <p>
                Get instant email alerts whenever a hot or warm lead is captured. Navigate to <strong className="text-fg">Settings → Integrations → Email Notifications</strong> and enter your email address.
              </p>
              <p>
                You will receive an email containing the lead's name, contact info, and an AI-generated summary of their inquiry.
              </p>
              <Callout type="info">
                You can also test this by clicking the <strong>"Send test alert"</strong> button in the Integrations tab to verify your email is configured correctly.
              </Callout>
            </DocSection>

            {/* 14. Webhooks */}
            <DocSection id="webhooks" title="Webhooks">
              <p>
                Ochreshift can send real-time events to your server whenever a lead is captured or a chat finishes. Configure your Webhook URL in <strong className="text-fg">Settings → Integrations → Webhook URL</strong>.
              </p>
              <p className="mt-2">When an event occurs, we send a <code className="bg-surface px-1.5 py-0.5 rounded text-[12px] border border-border text-fg">POST</code> request with a JSON body:</p>
              <CodeBlock>{`{
  "event": "lead_captured",
  "bot_id": "bot_123abc",
  "lead": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "score": "hot"
  },
  "summary": "Jane is interested in booking a hair coloring appointment for Saturday.",
  "timestamp": "2026-08-23T12:00:00Z"
}`}</CodeBlock>
              <p className="mt-4">
                Use webhooks to connect Ochreshift to your CRM (HubSpot, Salesforce), Slack channels, Zapier, Make, or any custom backend.
              </p>
            </DocSection>

            {/* 15. Google Sheets */}
            <DocSection id="google-sheets" title="Google Sheets Integration">
              <p>
                Sync captured leads directly into a Google Spreadsheet — no Zapier or Make needed.
              </p>
              <p className="mt-2"><strong className="text-fg">Setup steps:</strong></p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>Create a new Google Sheet with column headers: <code className="bg-surface px-1.5 py-0.5 rounded text-[12px] border border-border text-fg">Name, Email, Phone, Message, Score, Date</code>.</li>
                <li>Go to <strong className="text-fg">Extensions → Apps Script</strong>.</li>
                <li>Paste the Ochreshift Apps Script (provided in your dashboard).</li>
                <li>Click <strong className="text-fg">Deploy → New Deployment</strong>, set type to "Web App", and ensure access is set to "Anyone".</li>
                <li>Copy the generated Web App URL.</li>
                <li>Paste the URL into <strong className="text-fg">Settings → Integrations → Google Sheets</strong> in your dashboard.</li>
              </ol>
              <Callout type="warning">
                Make sure the Apps Script URL starts with <code className="text-[11px]">https://script.google.com/</code>. Other URLs will not work.
              </Callout>
            </DocSection>

            {/* 16. WhatsApp */}
            <DocSection id="whatsapp" title="WhatsApp Integration">
              <p>
                Connect your WhatsApp Business account to allow seamless handoffs from the chat widget to WhatsApp.
              </p>
              <p className="mt-2"><strong className="text-fg">Requirements:</strong></p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>A <strong className="text-fg">Meta Business Account</strong> with WhatsApp Business API access.</li>
                <li>A registered <strong className="text-fg">Phone Number ID</strong> from the Meta Developer Dashboard.</li>
              </ul>
              <p className="mt-2"><strong className="text-fg">Setup:</strong></p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">developers.facebook.com</a> and navigate to your WhatsApp app.</li>
                <li>Find your <strong className="text-fg">Phone Number ID</strong> under WhatsApp → Getting Started.</li>
                <li>Paste it into <strong className="text-fg">Settings → Integrations → WhatsApp Integration</strong>.</li>
              </ol>
              <p className="mt-2">
                Once configured, incoming WhatsApp messages will be handled by your AI agent, and replies are sent back via the WhatsApp Business API.
              </p>
            </DocSection>

            {/* 17. Analytics */}
            <DocSection id="analytics" title="Analytics">
              <p>
                The <strong className="text-fg">Analytics</strong> tab provides insights into your agent's performance:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-fg">Total conversations</strong> — how many chat sessions have occurred.</li>
                <li><strong className="text-fg">Leads captured</strong> — total leads collected by the agent.</li>
                <li><strong className="text-fg">Hot/Warm/Cold breakdown</strong> — distribution of lead quality.</li>
                <li><strong className="text-fg">Handoffs triggered</strong> — how many times a lead was escalated to your team.</li>
              </ul>
              <p>
                Use these metrics to understand your agent's ROI and optimize your custom instructions for better lead conversion.
              </p>
            </DocSection>

            {/* 18. Billing */}
            <DocSection id="billing" title="Billing & Plans">
              <p>
                Manage your subscription from the <strong className="text-fg">Billing</strong> section in your dashboard. Plans determine:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Number of agents you can create.</li>
                <li>Access to premium features like white-labeling (removing Ochreshift branding).</li>
              </ul>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-[13px] border border-border rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="text-left p-3 font-[650] text-fg">Plan</th>
                      <th className="text-left p-3 font-[650] text-fg">White-label</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border"><td className="p-3 text-fg">Trial</td><td className="p-3">❌</td></tr>
                    <tr className="border-b border-border"><td className="p-3 text-fg">Starter</td><td className="p-3">❌</td></tr>
                    <tr className="border-b border-border"><td className="p-3 text-fg">Pro</td><td className="p-3">✅</td></tr>
                    <tr className="border-b border-border"><td className="p-3 text-fg">Business</td><td className="p-3">✅</td></tr>
                    <tr><td className="p-3 text-fg">Enterprise</td><td className="p-3">✅</td></tr>
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* 19. Data Privacy */}
            <DocSection id="data-privacy" title="Data Privacy & GDPR">
              <p>
                Ochreshift provides tools for GDPR compliance and data sovereignty. These are found under <strong className="text-fg">Settings → Account & Privacy</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong className="text-fg">Export Data</strong> — download all your account data (agents, leads, conversations) as a single file. This is your GDPR "right to data portability."</li>
                <li><strong className="text-fg">Subject Erasure (Right to be Forgotten)</strong> — enter an email address or phone number to permanently delete all data associated with that individual. This cannot be undone.</li>
                <li><strong className="text-fg">Delete Account</strong> — permanently deletes your entire account, all agents, leads, and associated data.</li>
              </ul>
              <Callout type="warning">
                Subject erasure and account deletion are <strong>irreversible</strong>. Make sure to export your data first if you need a backup.
              </Callout>
            </DocSection>

          </main>
        </div>

        {/* ── Footer ── */}
        <div className="mt-20 pt-8 border-t border-border flex justify-between items-center">
          <Link href="/dashboard" className="text-[13.5px] font-[600] text-muted hover:text-fg transition-colors">
            ← Back to Dashboard
          </Link>
          <a href="mailto:support@ochreshift.com" className="text-[13.5px] font-[600] text-muted hover:text-accent transition-colors">
            Contact Support
          </a>
        </div>

      </div>
    </div>
  );
}
