"use client";

import { motion } from "framer-motion";
import { Settings, Book, Users, Zap, BarChart3, MessageSquare } from "lucide-react";

const FEATURES_DATA = [
  {
    icon: MessageSquare,
    title: "Custom AI Chatbot",
    description: "Trained on your content to provide accurate, relevant answers."
  },
  {
    icon: Zap,
    title: "Easy Training",
    description: "Add or sync content in minutes. Keep your bot up-to-date."
  },
  {
    icon: Book,
    title: "Source Citations",
    description: "Every answer includes sources so your users can verify instantly."
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track conversations, leads, and performance in real-time."
  },
  {
    icon: Users,
    title: "Lead Capture",
    description: "Collect visitor details and turn conversations into qualified leads."
  },
  {
    icon: Settings,
    title: "Multi-channel",
    description: "Embed on your website or connect on WhatsApp and more."
  }
];

export function LightFeatures() {
  return (
    <section className="bg-white w-full font-sans">
      <div className="max-w-7xl mx-auto px-6 py-24 text-slate-900">
        
        {/* Section Header (Left-Aligned) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-xs font-bold text-[#FFB800] uppercase tracking-wider mb-4 block">
            POWERFUL FEATURES
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 max-w-2xl leading-tight">
            Everything you need to automate customer interactions
          </h2>
        </motion.div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {FEATURES_DATA.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx, duration: 0.6 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-[#FFB800] flex-shrink-0 mt-1">
                <feature.icon size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
