'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Database, Server, Sliders, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#181818] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <Sliders className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">System Settings</h3>
                  <p className="text-xs text-white/50">Architecture & Model parameters</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="py-5 space-y-4">
              <div className="p-3.5 bg-[#202020] rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-white/70" />
                  <div>
                    <div className="text-xs font-medium text-white">LLM Provider</div>
                    <div className="text-[11px] text-white/50">Groq API (`llama-3.3-70b-versatile`)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Active
                </span>
              </div>

              <div className="p-3.5 bg-[#202020] rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-white/70" />
                  <div>
                    <div className="text-xs font-medium text-white">Embedding Model</div>
                    <div className="text-[11px] text-white/50">`BAAI/bge-small-en-v1.5` (384 Dimensions)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/15">
                  Local CPU
                </span>
              </div>

              <div className="p-3.5 bg-[#202020] rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-white/70" />
                  <div>
                    <div className="text-xs font-medium text-white">Vector Store</div>
                    <div className="text-[11px] text-white/50">Qdrant Cloud (Cosine Similarity, Top K = 5)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Connected
                </span>
              </div>

              <div className="p-3.5 bg-[#202020] rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-white/70" />
                  <div>
                    <div className="text-xs font-medium text-white">Grounded Assurance</div>
                    <div className="text-[11px] text-white/50">Zero-hallucination page level citation system</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/15">
                  Enforced
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium bg-white text-black hover:bg-white/90 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
