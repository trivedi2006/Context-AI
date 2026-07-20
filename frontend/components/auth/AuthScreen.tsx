'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeLinesCanvas } from './KnowledgeLinesCanvas';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Shield } from 'lucide-react';

interface AuthScreenProps {
  onSuccessRedirect: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccessRedirect }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full min-h-screen bg-[#08090b] text-[#f2f3f5] overflow-hidden relative select-none font-sans flex flex-col justify-between"
    >
      {/* Fullscreen Canvas Animation */}
      <KnowledgeLinesCanvas />

      {/* Top Bar */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-7xl mx-auto px-6 sm:px-12 pt-8 flex items-center justify-between relative z-20 shrink-0"
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-white text-[#08090b] grid place-items-center font-space font-bold text-sm shadow-md">
            C
          </div>
          <span className="font-space font-semibold text-lg tracking-tight text-[#f2f3f5]">
            Context AI
          </span>
        </div>

        {/* Minimal Pill Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.045] border border-white/[0.10] text-[0.78rem] text-[#cfd2d8] backdrop-blur-md shadow-sm">
          <Shield className="w-3.5 h-3.5 text-white/70" />
          <span>Private AI Workspace</span>
        </div>
      </motion.header>

      {/* Main Content Grid */}
      <main className="w-full max-w-7xl mx-auto px-6 sm:px-12 flex-1 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 relative z-20 py-8">
        {/* Left Copy Column */}
        <div className="max-w-xl space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="font-space font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.04] tracking-tight text-[#f2f3f5]"
          >
            Understand Every Context of Every Project.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-[#9298a3] text-base sm:text-lg leading-[1.6] max-w-[46ch] font-normal"
          >
            Upload your documents. Ask natural questions. Receive grounded answers with citations powered by Retrieval-Augmented Generation.
          </motion.p>
        </div>

        {/* Right Glass Card Column */}
        <div className="flex justify-center lg:justify-end items-center">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-[380px] max-w-full p-8 sm:p-10 rounded-[22px] bg-gradient-to-b from-white/[0.055] to-white/[0.02] border border-white/[0.10] backdrop-blur-[24px] shadow-[0_40px_100px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] relative z-20"
          >
            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <LoginForm
                  onSwitchToSignup={() => setMode('signup')}
                  onSuccessRedirect={onSuccessRedirect}
                />
              ) : (
                <SignupForm
                  onSwitchToLogin={() => setMode('login')}
                  onSuccessRedirect={onSuccessRedirect}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Bottom-Left Fixed Avatar Circle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="fixed left-7 bottom-7 z-30 w-10 h-10 rounded-full bg-[#111318] border border-white/[0.10] grid place-items-center font-space font-semibold text-sm text-white shadow-lg"
      >
        C
      </motion.div>
    </motion.div>
  );
};
