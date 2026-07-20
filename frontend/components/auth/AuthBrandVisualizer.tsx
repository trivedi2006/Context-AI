'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { KnowledgeWaveCanvas } from './KnowledgeWaveCanvas';
import { ShieldCheck } from 'lucide-react';

export const AuthBrandVisualizer: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#0D0D0D] p-10 lg:p-20 flex flex-col justify-between relative overflow-hidden select-none border-r border-white/[0.05]">
      {/* Subtle Atmospheric Light & Wave Animation */}
      <KnowledgeWaveCanvas />

      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none z-1" />

      {/* Top: Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm shadow-md">
            C
          </div>
          <span className="font-medium text-base tracking-tight text-white font-sans">Context AI</span>
        </div>

        {/* Single Minimalist Badge */}
        <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-white/60" />
          <span>Private AI Workspace</span>
        </div>
      </motion.div>

      {/* Middle: Quiet, Emotional Heading & Subtitle */}
      <div className="relative z-10 my-auto py-12 space-y-6 max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-[-0.03em] leading-[1.08] font-sans"
        >
          Understand Every Context of Every Project.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg text-white/50 leading-relaxed font-sans max-w-md font-normal"
        >
          Your intelligent workspace for understanding documents, codebases, and technical knowledge through AI-powered contextual retrieval.
        </motion.p>
      </div>

      {/* Bottom: Empty Spacer for Dramatic Whitespace */}
      <div className="relative z-10 h-6" />
    </div>
  );
};
