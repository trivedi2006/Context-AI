'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Citation } from '@/types';
import { FileText, X, BookOpen } from 'lucide-react';

interface CitationPopoverProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationPopover: React.FC<CitationPopoverProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#181818] border border-white/15 rounded-2xl p-5 shadow-2xl z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-white/80" />
              <h4 className="text-xs font-semibold text-white">
                Citation Excerpt — Page {citation.page_number}
              </h4>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-white/40 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Source Info */}
          <div className="flex items-center justify-between text-xs text-white/50">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-white/70" />
              <span className="truncate max-w-[200px]">{citation.source}</span>
            </div>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10">
              Chunk #{citation.chunk_id}
            </span>
          </div>

          {/* Excerpt Content Box */}
          <div className="p-3.5 bg-[#202020] rounded-xl border border-white/10 text-xs text-white/90 leading-relaxed max-h-60 overflow-y-auto font-mono">
            "{citation.excerpt}"
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-1">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-colors"
            >
              Close Citation
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
