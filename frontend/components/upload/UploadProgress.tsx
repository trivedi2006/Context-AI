'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UploadProgressState, UploadStep } from '@/types';
import { Check, AlertCircle } from 'lucide-react';

interface UploadProgressProps {
  progressState: UploadProgressState;
}

const STEPS: { key: UploadStep; label: string }[] = [
  { key: 'extracting', label: 'Parsing' },
  { key: 'chunking', label: 'Chunking' },
  { key: 'embedding', label: 'Embedding' },
  { key: 'indexing', label: 'Indexing' },
  { key: 'ready', label: 'Ready' },
];

export const UploadProgress: React.FC<UploadProgressProps> = ({ progressState }) => {
  const getStepStatus = (stepKey: UploadStep) => {
    const order: UploadStep[] = ['idle', 'extracting', 'chunking', 'embedding', 'indexing', 'ready'];
    const currentIndex = order.indexOf(progressState.step);
    const stepIndex = order.indexOf(stepKey);

    if (progressState.step === 'error') return 'error';
    if (currentIndex > stepIndex || progressState.step === 'ready') return 'completed';
    if (currentIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-[#171717] border border-white/[0.06] rounded-2xl p-6 space-y-6 shadow-sm"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <span className="text-xs font-semibold text-white tracking-tight heading-display">
          Processing Document
        </span>
        <span className="text-xs font-mono text-white/40">{progressState.percentage}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progressState.percentage}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Sequential Timeline */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const status = getStepStatus(step.key);

          return (
            <div
              key={step.key}
              className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-mono transition-all ${
                status === 'current'
                  ? 'bg-white/10 text-white font-medium'
                  : status === 'completed'
                  ? 'text-white/80'
                  : 'text-white/30'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {status === 'current' && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
                {status === 'completed' && <Check className="w-3.5 h-3.5 text-[#D9FFD6]" />}
                {status === 'upcoming' && <span className="w-1.5 h-1.5 rounded-full bg-white/20 ml-0.5" />}
                <span>{step.label}</span>
              </div>
              <span className="text-[10px] text-white/40 capitalize">{status}</span>
            </div>
          );
        })}
      </div>

      {progressState.error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{progressState.error}</span>
        </div>
      )}
    </motion.div>
  );
};
