'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export const EmptyChatState: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 select-none max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-4"
      >
        {/* Large Centered Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#171717] border border-white/[0.06] flex items-center justify-center shadow-sm">
          <FileText className="w-7 h-7 text-white/70" />
        </div>

        {/* Minimal Editorial Headings */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white tracking-tight heading-display">
            No Document Loaded
          </h2>
          <p className="text-xs text-white/50 leading-relaxed max-w-sm mx-auto">
            Upload a document to begin understanding its context through AI.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
