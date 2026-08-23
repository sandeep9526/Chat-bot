"use client";

import { useState, useEffect } from "react";
import { Reveal } from "./Reveal";
import { CheckCircle2, Bot, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────────
   Section 4 — Customer Questions Showcase
   ──────────────────────────────────────────────────────────────── */

interface QuestionDef {
  id: string;
  category: string;
  question: string;
  answer: string;
  source: string;
}

const QUESTIONS: QuestionDef[] = [
  {
    id: "returns",
    category: "RETURNS",
    question: "What's your return policy?",
    answer: "You can return any unused item within 30 days of purchase for a full refund.",
    source: "Return Policy — Help Center",
  },
  {
    id: "shipping",
    category: "SHIPPING",
    question: "How long does delivery take?",
    answer: "Standard delivery takes 3–5 business days. Express delivery usually arrives within 1–2 business days.",
    source: "Shipping Policy — Help Center",
  },
  {
    id: "account",
    category: "ACCOUNT",
    question: "How do I reset my password?",
    answer: "You can reset your password by clicking 'Forgot Password' on the login page. We'll send a secure reset link to your email address.",
    source: "Account Settings — Docs",
  },
  {
    id: "orders",
    category: "ORDERS",
    question: "Can I change my order?",
    answer: "Orders can be modified within 1 hour of placement. After that, they enter processing and cannot be changed.",
    source: "Order Management — Help Center",
  },
  {
    id: "billing",
    category: "BILLING",
    question: "Can I change my plan?",
    answer: "Yes, you can upgrade or downgrade your plan at any time from your billing dashboard.",
    source: "Pricing & Billing — Help Center",
  }
];

export function CustomerQuestions() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate questions unless hovered
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % QUESTIONS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isHovered]);

  const activeQ = QUESTIONS[activeIndex];

  return (
    <section className="questions-section" id="use-cases">
      <div className="marketing-container">
        
        {/* Header */}
        <div className="questions-header">
          <Reveal>
            <div className="questions-eyebrow">REAL SUPPORT QUESTIONS</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="questions-headline">
              Answer the questions your team gets every day.
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="questions-subtext">
              From policies to product questions, OchreShift gives customers useful answers from the content your business already has.
            </p>
          </Reveal>
        </div>

        {/* Interactive Showcase */}
        <Reveal delay={250}>
          <div 
            className="questions-showcase"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Left: Question List */}
            <div className="questions-list">
              {QUESTIONS.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`questions-list-item ${idx === activeIndex ? "active" : ""}`}
                >
                  <span className="questions-list-category">{q.category}</span>
                  <span className="questions-list-text">"{q.question}"</span>
                </button>
              ))}
            </div>

            {/* Right: Assistant UI (The Payoff) */}
            <div className="questions-chat-wrapper">
              <div className="questions-chat-ui">
                
                {/* Chat Header */}
                <div className="questions-chat-header">
                  <div className="questions-chat-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="questions-chat-title">
                    <span className="questions-chat-name">OchreShift Support</span>
                    <span className="questions-chat-status">
                      <span className="questions-chat-dot" /> Online
                    </span>
                  </div>
                </div>

                {/* Chat Body */}
                <div className="questions-chat-body">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeQ.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="questions-chat-sequence"
                    >
                      {/* Customer Bubble */}
                      <div className="questions-chat-bubble questions-chat-bubble--q">
                        {activeQ.question}
                      </div>
                      
                      {/* AI Bubble */}
                      <div className="questions-chat-bubble questions-chat-bubble--a">
                        {activeQ.answer}
                        <div className="questions-chat-grounded">
                          <div className="questions-chat-grounded-primary">
                            <CheckCircle2 size={11} className="questions-chat-grounded-icon" />
                            <span>Grounded in your content</span>
                          </div>
                          <div className="questions-chat-grounded-secondary">
                            {activeQ.source}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                
                {/* Chat Input Bar */}
                <div className="questions-chat-input">
                  <div className="questions-chat-input-box">
                    <span className="questions-chat-input-placeholder">Ask a question...</span>
                    <div className="questions-chat-send">
                      <ArrowUp size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
