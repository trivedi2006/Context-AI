'use client';

import React from 'react';
import { Citation } from '@/types';
import { X, FileText, BookOpen, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CitationPanelProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationPanel: React.FC<CitationPanelProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card max-w-lg w-full rounded-2xl border border-slate-700 p-6 shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">Source Citation Details</h3>
                <p className="text-xs text-slate-400">Verified document context chunk</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Citation Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="font-medium truncate max-w-[200px]">{citation.source}</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 font-mono font-semibold">
                Page {citation.page_number}
              </span>
            </div>

            {/* Content Chunk Excerpt */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
                <Quote className="w-3.5 h-3.5 text-blue-400" /> Retrieved Context Chunk Excerpt:
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                {citation.snippet || (citation as any).excerpt}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
