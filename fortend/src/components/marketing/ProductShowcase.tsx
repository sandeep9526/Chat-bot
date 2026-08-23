"use client";

import { Reveal } from "./Reveal";
import { Check, ArrowRight, Bot, CheckCircle2, ArrowUp } from "lucide-react";
import Link from "next/link";

/* ────────────────────────────────────────────────────────────────
   Section 6 — Product Showcase
   ──────────────────────────────────────────────────────────────── */

export function ProductShowcase() {
  return (
    <section className="product-showcase-section">
      <div className="marketing-container">
        
        <div className="product-showcase-layout">
          
          {/* Left: Copy & Features */}
          <div className="product-showcase-content">
            <Reveal>
              <div className="product-showcase-eyebrow">THE PRODUCT</div>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="product-showcase-headline">
                Answers that feel like they came from your team.
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="product-showcase-subtext">
                OchreShift gives customers instant, grounded answers while giving your team the control and context behind every response.
              </p>
            </Reveal>

            <Reveal delay={200}>
              <ul className="product-showcase-features">
                <li>
                  <div className="product-showcase-feature-icon">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span>Grounded in your knowledge</span>
                </li>
                <li>
                  <div className="product-showcase-feature-icon">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span>Clear, conversational answers</span>
                </li>
                <li>
                  <div className="product-showcase-feature-icon">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span>Always available to customers</span>
                </li>
              </ul>
            </Reveal>

            <Reveal delay={300}>
              <Link href="#" className="product-showcase-link">
                <span>Explore the product</span>
                <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>

          {/* Right: Browser Mockup / Product UI */}
          <div className="product-showcase-graphic">
            <Reveal delay={250} className="product-showcase-mockup-wrapper">
              
              <div className="product-showcase-mockup">
                {/* Mac-style Window Controls */}
                <div className="product-showcase-mockup-header">
                  <div className="mockup-dot mockup-dot-red" />
                  <div className="mockup-dot mockup-dot-yellow" />
                  <div className="mockup-dot mockup-dot-green" />
                </div>

                {/* Chat App UI */}
                <div className="product-showcase-chat">
                  
                  {/* Chat Header */}
                  <div className="product-showcase-chat-header">
                    <div className="product-showcase-chat-avatar">
                      <Bot size={16} />
                    </div>
                    <div className="product-showcase-chat-title">
                      <span className="product-showcase-chat-name">OchreShift Support</span>
                      <div className="product-showcase-chat-status">
                        <div className="product-showcase-chat-dot" />
                        <span>Online</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Body */}
                  <div className="product-showcase-chat-body">
                    <div className="product-showcase-chat-sequence">
                      
                      {/* Customer Question */}
                      <div className="product-showcase-chat-bubble product-showcase-chat-bubble--q">
                        What's your refund policy?
                      </div>

                      {/* AI Answer */}
                      <div className="product-showcase-chat-bubble product-showcase-chat-bubble--a">
                        You can return any unused item within 30 days of purchase for a full refund.
                        
                        {/* Grounded Indicator */}
                        <div className="product-showcase-chat-grounded">
                          <div className="product-showcase-chat-grounded-primary">
                            <CheckCircle2 size={12} className="product-showcase-chat-grounded-icon" />
                            <span>Grounded in your content</span>
                          </div>
                          <div className="product-showcase-chat-grounded-secondary">
                            Return Policy — Help Center
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Chat Input */}
                  <div className="product-showcase-chat-input">
                    <div className="product-showcase-chat-input-box">
                      <span className="product-showcase-chat-input-placeholder">Ask a question...</span>
                      <div className="product-showcase-chat-send">
                        <ArrowUp size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}
