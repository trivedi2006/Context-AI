'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConstellationCanvas } from './ConstellationCanvas';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { X, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onSuccessRedirect?: () => void;
  onEnterWorkspace?: () => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onSuccessRedirect = () => {}, 
  onEnterWorkspace = () => {},
  isAuthenticated = false,
  onLogout = () => {}
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleTiltChange = useCallback((x: number, y: number) => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--tilt-x', `${y * 4}deg`);
      containerRef.current.style.setProperty('--tilt-y', `${x * -6}deg`);
    }
  }, []);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
  };

  const closeAuth = () => {
    setAuthMode(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#08080a] text-[#f2f3f5] overflow-hidden flex flex-col font-sans selection:bg-[#55FF9E] selection:text-black"
    >
      {/* Background Interactive Constellation Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-auto opacity-50">
        <ConstellationCanvas onTiltChange={handleTiltChange} />
      </div>

      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-[#55FF9E]/[0.05] to-[#FFD155]/[0.03] blur-[140px] rounded-full pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[#55FF9E] text-black font-black text-sm flex items-center justify-center font-mono shadow-[2px_2px_0px_#FFD155]">
            [=]
          </div>
          <span className="font-['Space_Grotesk'] font-bold text-lg text-white tracking-tight">Context AI</span>
        </div>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-sans text-white/60 font-medium">
          <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
        </nav>

        {/* Right Auth Action Buttons */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onEnterWorkspace}
                className="px-5 py-2.5 rounded-xl bg-[#55FF9E] text-black font-bold text-xs tracking-tight shadow-[3px_3px_0px_#FFD155] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] transition-all font-['Space_Grotesk']"
              >
                <span>Enter Workspace</span>
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2.5 rounded-xl bg-[#1c1c1e] border border-white/10 text-white/70 hover:text-white font-medium text-xs transition-all font-['Space_Grotesk']"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => openAuth('login')}
                className="px-4 py-2 text-xs font-medium text-white/80 hover:text-white transition-colors font-['Space_Grotesk'] cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs tracking-tight hover:bg-white/90 transition-all font-['Space_Grotesk'] cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-12">
        {/* Left Column (Hero Content) */}
        <div className="lg:col-span-7 space-y-8 text-left">
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]"
          >
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-[#55FF9E]" />
              <span className="w-2 h-2 rounded-sm bg-[#FF6542]" />
              <span className="w-2 h-2 rounded-sm bg-[#FFD155]" />
            </div>
            <span className="text-[11px] font-mono font-extrabold tracking-widest text-white/90 uppercase">
              GROUNDED ANSWERS FROM YOUR PDFS
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight font-['Space_Grotesk'] leading-[1.05] text-white"
          >
            Ask every <br />
            document<span className="text-[#55FF9E]">.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg text-white/60 leading-relaxed font-sans max-w-xl"
          >
            Upload your files, let intent-based retrieval find the exact context, and get clear answers backed by precise page-level citations instead of guesswork.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-4 pt-2"
          >
            <button
              onClick={() => {
                if (isAuthenticated) {
                  onEnterWorkspace();
                } else {
                  openAuth('signup');
                }
              }}
              className="px-7 py-3.5 rounded-xl bg-[#55FF9E] text-black font-bold font-['Space_Grotesk'] text-sm shadow-[4px_4px_0px_#FFD155] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] transition-all cursor-pointer"
            >
              Launch app
            </button>
            <button
              onClick={() => openAuth('login')}
              className="px-7 py-3.5 rounded-xl bg-[#1c1c1e] text-white border border-white/15 font-medium font-['Space_Grotesk'] text-sm hover:bg-white/10 transition-all cursor-pointer"
            >
              See retrieval
            </button>
          </motion.div>

          {/* Feature Bullets */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex items-center gap-6 text-xs font-mono text-white/50 pt-4"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#55FF9E]" />
              PDF parsing
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6542]" />
              Vector search
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD155]" />
              Cited answers
            </span>
          </motion.div>
        </div>

        {/* Right Column (Stacked 3D PDF Document Cards Visual) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 relative flex items-center justify-center"
        >
          <div className="relative w-[340px] sm:w-[400px] h-[460px]">
            {/* Floating Tag: chunk (Yellow) */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-44 -left-6 z-30 bg-[#FFD155] text-black font-mono text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-xl"
            >
              chunk
            </motion.div>

            {/* Floating Tag: embed (Cyan) */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-20 -right-6 z-30 bg-[#55F0FF] text-black font-mono text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-xl"
            >
              embed
            </motion.div>

            {/* Layer 3: Back Document Sheet */}
            <div className="absolute inset-0 bg-[#D8D4C8] rounded-2xl transform rotate-[-6deg] translate-x-[-12px] translate-y-[12px] shadow-xl border border-white/20" />

            {/* Layer 2: Middle Document Sheet */}
            <div className="absolute inset-0 bg-[#EBE7DC] rounded-2xl transform rotate-[-3deg] translate-x-[-6px] translate-y-[6px] shadow-xl border border-white/30" />

            {/* Layer 1: Front Main PDF Sheet */}
            <div className="absolute inset-0 bg-[#F7F5EE] text-[#1c1c1e] rounded-2xl p-7 shadow-2xl flex flex-col justify-between border border-white/40 z-20">
              {/* Document Header Badges */}
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <span className="bg-[#FF6542] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase font-mono shadow-sm">
                  PDF
                </span>
                <span className="bg-[#55FF9E] text-black font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase font-mono shadow-sm">
                  rank
                </span>
              </div>

              {/* Skeleton Lines & Highlight Bar */}
              <div className="space-y-3 py-4 flex-1">
                <div className="h-3 bg-black/15 rounded-full w-3/4" />
                <div className="h-2.5 bg-black/10 rounded-full w-full" />
                <div className="h-2.5 bg-black/10 rounded-full w-5/6" />

                {/* Mint Highlighted Paragraph Box */}
                <div className="my-4 p-3 bg-[#55FF9E]/30 border-l-4 border-[#55FF9E] rounded-r-xl space-y-1.5">
                  <div className="h-2.5 bg-black/70 rounded-full w-full" />
                  <div className="h-2.5 bg-black/70 rounded-full w-4/5" />
                </div>

                <div className="h-2.5 bg-black/10 rounded-full w-full" />
                <div className="h-2.5 bg-black/10 rounded-full w-2/3" />
              </div>

              {/* Document Footer */}
              <div className="pt-3 border-t border-black/10 flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>Page 1 of 9</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Modal Auth Dialog (Login / Signup) */}
      <AnimatePresence>
        {authMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAuth}
              className="absolute inset-0 bg-black/85 backdrop-blur-xl"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-[#121316] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={closeAuth}
                className="absolute top-5 right-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Form Content */}
              {authMode === 'login' ? (
                <LoginForm
                  onSuccessRedirect={() => {
                    closeAuth();
                    onSuccessRedirect();
                  }}
                  onSwitchToSignup={() => setAuthMode('signup')}
                />
              ) : (
                <SignupForm
                  onSuccessRedirect={() => {
                    closeAuth();
                    onSuccessRedirect();
                  }}
                  onSwitchToLogin={() => setAuthMode('login')}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
