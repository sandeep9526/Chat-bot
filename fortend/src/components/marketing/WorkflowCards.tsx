"use client";

import { Reveal } from "./Reveal";
import { Link, Database, CheckCircle2 } from "lucide-react";

/* ────────────────────────────────────────────────────────────────
   Section 5 — Workflow Cards
   ──────────────────────────────────────────────────────────────── */

export function WorkflowCards() {
  return (
    <section className="workflow-cards-section">
      <div className="marketing-container">
        
        {/* Header */}
        <div className="workflow-cards-header">
          <Reveal>
            <div className="workflow-cards-eyebrow">HOW IT WORKS</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="workflow-cards-headline">
              Turn the content you already have into answers.
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="workflow-cards-subtext">
              Connect your existing knowledge, keep it grounded, and give your team instant answers without building everything from scratch.
            </p>
          </Reveal>
        </div>

        {/* 3-Step Workflow Grid */}
        <div className="workflow-cards-grid">
          
          {/* Card 1 */}
          <Reveal delay={200} className="workflow-cards-item-wrapper">
            <div className="workflow-cards-item">
              <div className="workflow-cards-icon-wrapper">
                <Link size={18} className="workflow-cards-icon" />
              </div>
              <div className="workflow-cards-number">01</div>
              <h3 className="workflow-cards-title">Connect your content</h3>
              <p className="workflow-cards-desc">
                Upload policies, docs, help articles, and internal knowledge.
              </p>
            </div>
            {/* Arrow/Line connecting to next card */}
            <div className="workflow-cards-connector">
              <div className="workflow-cards-line" />
              <div className="workflow-cards-arrow" />
            </div>
          </Reveal>

          {/* Card 2 */}
          <Reveal delay={300} className="workflow-cards-item-wrapper">
            <div className="workflow-cards-item">
              <div className="workflow-cards-icon-wrapper">
                <Database size={18} className="workflow-cards-icon" />
              </div>
              <div className="workflow-cards-number">02</div>
              <h3 className="workflow-cards-title">Let OchreShift learn</h3>
              <p className="workflow-cards-desc">
                Your content is organized and made searchable for accurate answers.
              </p>
            </div>
            {/* Arrow/Line connecting to next card */}
            <div className="workflow-cards-connector">
              <div className="workflow-cards-line" />
              <div className="workflow-cards-arrow" />
            </div>
          </Reveal>

          {/* Card 3 */}
          <Reveal delay={400} className="workflow-cards-item-wrapper workflow-cards-item-wrapper--last">
            <div className="workflow-cards-item">
              <div className="workflow-cards-icon-wrapper">
                <CheckCircle2 size={18} className="workflow-cards-icon" />
              </div>
              <div className="workflow-cards-number">03</div>
              <h3 className="workflow-cards-title">Answer with confidence</h3>
              <p className="workflow-cards-desc">
                Customers get concise answers grounded in your actual business content.
              </p>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
