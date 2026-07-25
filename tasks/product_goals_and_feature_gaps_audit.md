# Zeva Platform: Product Goals, End-to-End Experience & Feature Gaps Audit

This document contrasts the core commercial product goals of the **Zeva AI Chatbot Platform** against the current engineering state of `zeva-backend` and `fortend`. It details significant feature gaps, disconnected customizations, and roadmap milestones required to deliver a state-of-the-art enterprise conversational AI product.

---

## 1. AI Persona & Custom System Instructions (The Abandoned Style Bug)
A prominent value proposition of customized AI bots is adapting conversational style, brand tone, and exact operational rules to individual businesses.

### Current Architecture & Limitations
- **Backend Dead Code**: While `zeva-backend/templates.py` explicitly maps customized operational personalities for each industry vertical (`system_prompt_style`: e.g., *"Courteous, reassuring, clear clinic assistant"* or *"Professional real-estate property consultant"*), this parameter is ignored during live execution.
- **Hardcoded Inference**: In `main.py` -> `POST /chat` ([L1166](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/main.py#L1166)), the system instructions are rigidly locked to a single generic prompt:  
  `"You are the friendly, helpful AI assistant for {bot['name']}. Answer strictly using the CONTEXT below..."`

### Action Item Checklist
- [ ] **Connect Template Personas**: Modify `POST /admin/create-bot` and the `bots` PostgreSQL table to accept and store an explicit `custom_prompt_style` field, hydrating it directly from selected Industry Templates upon instantiation.
- [ ] **Studio AI Instruction Editor**: Expose a multi-line text textarea in the Studio & Bot Settings UI titled *"Custom System Instructions & Behavioral Rules"* where clients can insert firm constraints (e.g., *"Never mention competitor pricing"*, *"Always ask if they prefer an in-person walkthrough"*).
- [ ] **Dynamic Prompt Builder**: Inject the bot's custom instructions into `call_llm()` system messages dynamically prior to appending retrieved RAG document context.

---

## 2. Real-Time Helpdesk Intervention vs. Static Handoff Fallback
When visitors experience high-intent purchase scenarios or unresolved technical hurdles, modern chat widget platforms allow smooth transition from automated AI to live human agents.

### Current Architecture & Limitations
- **Static Form Redirection**: When a visitor requests a human (*"I want to speak to an agent"*), `main.py` intercepts the intent ([L1141](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/main.py#L1141)) by asking them to complete a standard contact lead form and logging a timestamped record inside the `handoffs` table.
- **Missing Live Chat UI**: There is no live messaging operational helpdesk console. An account owner logging into the dashboard can only view historical handoff requests rather than communicating directly with website visitors in real time.

### Action Item Checklist
- [ ] **Bi-Directional WebSockets / SSE Transport**: Implement FastAPI WebSockets or Server-Sent Events (SSE) connections inside `widget.js` and `main.py` (`/ws/live-chat/{session_id}`).
- [ ] **Live Agent Console**: Upgrade the dashboard **Handoffs / Live Chats** section into a responsive, real-time Helpdesk interface featuring desktop push notification triggers when new high-intent conversations request intervention.
- [ ] **AI Override Switch**: Enable support reps to click an inline `"Take Over Conversation"` toggle in the dashboard, instantly disabling RAG automated inference for that specific customer session until the human agent concludes the ticket.

---

## 3. Autonomous Site Crawler & Sitemap RAG Ingestion
Reducing onboarding friction requires rapid, hands-off ingestion of enterprise customer knowledge bases.

### Current Architecture & Limitations
- **Single-Page Fetching**: Endpoint `@app.post("/demo/ingest-url")` ([L1298](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/main.py#L1298)) processes exclusively the single HTML webpage target provided in the HTTP input string.
- **Manual Labor Overhead**: To onboard a commercial website with dozens of information pages (`/about`, `/pricing`, `/faq`, `/services`, `/blog`), an admin must manually type and invoke every separate URL link independently.

### Action Item Checklist
- [ ] **Sitemap.xml Auto-Discovery**: Build a recursive background ingestion tool that parses standard domain `/sitemap.xml` indices, extracts up to 50 active internal page URLs, and queues automated asynchronous scraping.
- [ ] **Visual URL Scraping Progress Console**: Provide an interactive crawler checklist in the onboarding Studio showing real-time text extraction metrics and character counts across discovered sub-pages.
- [ ] **Markdown Table & OCR Enhancement**: Integrate structured table-preserving markdown extraction and Deepgram/Tesseract OCR processing for multi-column PDF brochures and catalog images.

---

## 4. Dynamic Lead Capture Schema & Custom Form Builders
Lead capturing needs to scale across diverse business verticals by allowing flexible qualification parameters.

### Current Architecture & Limitations
- **Static Database Fields**: Lead tables and widget presentation components strictly enforce four rigid inputs: Name, Email, Phone Number, and Notes.
- **Inflexible Customization**: A real estate broker cannot prompt visitors for *"Desired Budget"* or *"Property Location"*; an auto service center cannot solicit *"Vehicle Year & Make"*; a health clinic cannot collect *"Insurance Provider ID"*.

### Action Item Checklist
- [ ] **JSONB Custom Fields Column**: Expand the `leads` table in `schema.sql` by adding an indexed `custom_data JSONB DEFAULT '{}'::jsonb` column.
- [ ] **Lead Form Builder UI**: Embed an interactive visual form builder inside Bot Settings allowing owners to toggle mandatory fields, establish custom dropdown option lists, and insert specialized text labels.
- [ ] **Dynamic Widget Renderer**: Update `widget.js` to render form input DOM nodes dynamically based on the configuration array returned by `GET /config`.

---

## 5. Visitor Quality Feedback Loop & Hallucination Diagnostics
Maintaining continuous accuracy across generative RAG answers requires direct user verification.

### Current Architecture & Limitations
- **Absence of User Review Metrics**: Once an LLM answer generates inside the website widget, visitors cannot signify whether the response solved their problem or produced an inaccurate hallucinated answer.
- **Blind Diagnostics**: Dashboard analytics record chat volumes and unanswered queries, but cannot highlight misleading AI outputs for administrative corrections.

### Action Item Checklist
- [ ] **Widget Evaluation Buttons**: Render discreet helpfulness verification icons (👍 Thumbs Up / 👎 Thumbs Down) beneath generated chat messages in the widget interface.
- [ ] **Quality Feedback API Endpoint**: Create `@app.post("/chat/feedback")` to record customer confidence score integers (`+1`, `-1`) and optional user text explanations directly into the `chats` table.
- [ ] **Hallucination Review Dashboard**: Construct an exception-handling dashboard card under admin Analytics displaying low-rated messages side-by-side with retrieved document chunks, allowing owners to rapidly correct underlying textual training omissions.

---

## 6. Omni-Channel Deployment Expansion
While Zeva offers a robust website Javascript snippet and foundational Meta WhatsApp integration, enterprise platforms must meet customers across diverse ecosystem messaging clients.

### Action Item Checklist
- [ ] **Unified Message Abstraction Layer**: Refactor inbound webhook processing into a standardized abstract `IncomingMessage` schema (`sender_id`, `tenant_id`, `text`, `media_payload`, `channel_type`) targeting unified RAG answering functions.
- [ ] **Telegram Bot API Linkage**: Add webhook registration support for automated Telegram TelegramBot tokens (`/telegram/webhook`).
- [ ] **Slack Workspace & Discord Embed Modules**: Build conversational webhook listeners supporting Slack Events API and Discord Interaction endpoints for enterprise software docs assistance.
