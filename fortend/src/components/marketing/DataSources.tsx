"use client";

import { motion } from "framer-motion";
import { Globe, Book, FileText } from "lucide-react";

const DATA_SOURCES = [
  {
    icon: Globe,
    title: "Website Scraper",
    description: "Simply enter your URL and we'll automatically crawl, extract, and sync your public pages. As your website updates, your AI stays up to date.",
  },
  {
    icon: Book,
    title: "Help Center Integration",
    description: "Connect seamlessly with Zendesk, Intercom, Notion, and other platforms to ingest all your existing knowledge base articles instantly.",
  },
  {
    icon: FileText,
    title: "Upload Documents",
    description: "Manually upload PDFs, Word documents, text files, and spreadsheets. We parse the text and add it securely to your custom AI model.",
  }
];

export function DataSources() {
  return (
    <section className="bg-bg w-full font-sans">
      <div className="max-w-7xl mx-auto px-6 py-24">
        
        {/* Part 1: Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold text-yellow-500 uppercase tracking-wider mb-3"
          >
            Integrations
          </motion.h3>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-fg mb-4"
          >
            Turn the content you already have into answers.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-base text-muted"
          >
            No need to rewrite your FAQs or build new databases. Just connect your existing content and let the AI do the heavy lifting.
          </motion.p>
        </div>

        {/* Part 2: The Data Sources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DATA_SOURCES.map((source, idx) => (
            <motion.div 
              key={source.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * idx }}
              className="bg-surface border border-border rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-white/[0.04] flex flex-col"
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-muted mb-6 shrink-0">
                <source.icon size={24} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-fg mb-3">
                {source.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed flex-1">
                {source.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
