"use client";

import { Reveal } from "./Reveal";
import {
  Globe,
  Book,
  FileText,
  CheckCircle2,
  Settings2,
  MessageSquare,
  Bot,
  Database,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";

/* ────────────────────────────────────────────────────────────────
   Section 3 — How it works · Workflow
   ──────────────────────────────────────────────────────────────── */

function Step1Visual() {
  return (
    <div className="workflow-visual">
      <div className="workflow-sources">
        <div className="workflow-source-item">
          <Globe size={14} className="workflow-source-icon" />
          <span>Website</span>
        </div>
        <div className="workflow-source-item">
          <Book size={14} className="workflow-source-icon" />
          <span>Help Center</span>
        </div>
        <div className="workflow-source-item">
          <FileText size={14} className="workflow-source-icon" />
          <span>Docs</span>
        </div>
        <div className="workflow-source-item">
          <MessageSquare size={14} className="workflow-source-icon" />
          <span>FAQs</span>
        </div>
      </div>
    </div>
  );
}

function Step2Visual() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setReady((prev) => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="workflow-visual">
      <div className="workflow-process-panel">
        <div className="workflow-process-header">
          <Database size={14} className="workflow-process-icon" />
          <span>Knowledge Base</span>
        </div>
        <div className="workflow-process-body">
          <div className="workflow-process-row">
            <div className="workflow-process-doc">
              <FileText size={12} /> policy.pdf
            </div>
            <ArrowRight size={12} className="workflow-process-arrow" />
            <div className="workflow-process-db" />
          </div>
          <div className="workflow-process-status">
            {ready ? (
              <div className="workflow-status-ready">
                <CheckCircle2 size={13} />
                <span>Knowledge ready</span>
              </div>
            ) : (
              <div className="workflow-status-sync">
                <Loader2 size={13} className="workflow-spinner" />
                <span>Organizing content...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3Visual() {
  return (
    <div className="workflow-visual">
      <div className="workflow-config-panel">
        <div className="workflow-config-header">
          <Settings2 size={13} />
          <span>Assistant Settings</span>
        </div>
        <div className="workflow-config-fields">
          <div className="workflow-config-field">
            <label>Name</label>
            <div className="workflow-config-input">OchreShift Support</div>
          </div>
          <div className="workflow-config-row">
            <div className="workflow-config-field">
              <label>Tone</label>
              <div className="workflow-config-select">Professional</div>
            </div>
            <div className="workflow-config-field">
              <label>Theme</label>
              <div className="workflow-config-color">
                <span className="workflow-color-swatch" />
                #F5A900
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4Visual() {
  return (
    <div className="workflow-visual workflow-visual--payoff">
      <div className="workflow-chat-preview">
        <div className="workflow-chat-window">
          <div className="workflow-chat-header">
            <div className="workflow-chat-avatar">
              <Bot size={12} />
            </div>
            <div className="workflow-chat-title">
              <span>Support</span>
              <span className="workflow-chat-online">Online</span>
            </div>
          </div>
          <div className="workflow-chat-body">
            <div className="workflow-chat-bubble workflow-chat-bubble--q">
              How do I reset my password?
            </div>
            <div className="workflow-chat-bubble workflow-chat-bubble--a">
              You can reset it in your account settings.
              <div className="workflow-chat-grounded">
                <CheckCircle2 size={9} /> Grounded in your content
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductOverview() {
  return (
    <section className="workflow-section" id="how-it-works">
      <div className="marketing-container">
        {/* Header */}
        <div className="workflow-header">
          <Reveal>
            <div className="workflow-eyebrow">HOW IT WORKS</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="workflow-headline">From your content to conversations.</h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="workflow-subtext">
              Connect the knowledge you already have, let OchreShift build your assistant, and start helping customers in minutes.
            </p>
          </Reveal>
        </div>

        {/* Workflow Grid */}
        <div className="workflow-grid-container">
          <div className="workflow-connection-line" />
          
          <div className="workflow-grid">
            {/* Step 1 */}
            <Reveal delay={200}>
              <div className="workflow-step">
                <div className="workflow-node">01</div>
                <div className="workflow-card">
                  <h3 className="workflow-step-title">Bring your knowledge</h3>
                  <p className="workflow-step-desc">
                    Connect your website, help center, docs, FAQs, or other approved content.
                  </p>
                  <Step1Visual />
                </div>
              </div>
            </Reveal>

            {/* Step 2 */}
            <Reveal delay={300}>
              <div className="workflow-step">
                <div className="workflow-node">02</div>
                <div className="workflow-card">
                  <h3 className="workflow-step-title">Make your knowledge ready</h3>
                  <p className="workflow-step-desc">
                    OchreShift organizes your content into a knowledge source your assistant can use when answering customers.
                  </p>
                  <Step2Visual />
                </div>
              </div>
            </Reveal>

            {/* Step 3 */}
            <Reveal delay={400}>
              <div className="workflow-step">
                <div className="workflow-node">03</div>
                <div className="workflow-card">
                  <h3 className="workflow-step-title">Make it yours</h3>
                  <p className="workflow-step-desc">
                    Customize your assistant's behavior, appearance, and experience before putting it on your site.
                  </p>
                  <Step3Visual />
                </div>
              </div>
            </Reveal>

            {/* Step 4 */}
            <Reveal delay={500}>
              <div className="workflow-step">
                <div className="workflow-node">04</div>
                <div className="workflow-card">
                  <h3 className="workflow-step-title">Start helping customers</h3>
                  <p className="workflow-step-desc">
                    Add the assistant to your website and let customers get answers whenever they need them.
                  </p>
                  <Step4Visual />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
