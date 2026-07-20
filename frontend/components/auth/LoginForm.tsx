'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleButton } from './GoogleButton';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSuccessRedirect: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onSuccessRedirect }) => {
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const triggerErrorShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      triggerErrorShake();
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password, remember_me: rememberMe });
      onSuccessRedirect();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Invalid email or password.';
      setErrorMessage(detail);
      triggerErrorShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      key="login-form"
      initial={{ opacity: 0, scale: 0.99 }}
      animate={
        isShaking
          ? { x: [0, -6, 6, -6, 6, 0], opacity: 1, scale: 1 }
          : { x: 0, opacity: 1, scale: 1 }
      }
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full select-none font-sans"
    >
      {/* Form Heading */}
      <h2 className="font-space text-2xl font-semibold text-[#f2f3f5] mb-1 leading-tight">Welcome to Context AI</h2>
      <p className="text-xs text-[#9298a3] mb-6">Understand Every Context of Every Project.</p>

      {/* Error Alert */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-[0.74rem] text-[#9298a3] mb-1.5 font-medium tracking-wide">Email</label>
          <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.10] rounded-[11px] px-3.5 py-3 transition-all focus-within:border-white/30 focus-within:ring-4 focus-within:ring-white/[0.05] focus-within:bg-white/[0.05]">
            <Mail className="w-4 h-4 text-[#9298a3] shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acme.com"
              className="bg-transparent border-none outline-none text-[#f2f3f5] text-sm w-full font-sans placeholder:text-[#5b606c]"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-[0.74rem] text-[#9298a3] mb-1.5 font-medium tracking-wide">Password</label>
          <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.10] rounded-[11px] px-3.5 py-3 transition-all focus-within:border-white/30 focus-within:ring-4 focus-within:ring-white/[0.05] focus-within:bg-white/[0.05]">
            <Lock className="w-4 h-4 text-[#9298a3] shrink-0" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="bg-transparent border-none outline-none text-[#f2f3f5] text-sm w-full font-sans placeholder:text-[#5b606c]"
            />
          </div>
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between gap-2 text-xs pt-1 pb-2">
          <label className="flex items-center gap-2 text-[#9298a3] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-white/[0.03] border-white/20 text-white focus:ring-0 cursor-pointer accent-white"
            />
            <span>Remember me for 7 days</span>
          </label>
          <button
            type="button"
            onClick={() => alert('Password reset link has been sent.')}
            className="text-[#cfd2d8] hover:underline underline-offset-4 cursor-pointer text-xs shrink-0"
          >
            Forgot password?
          </button>
        </div>

        {/* Continue CTA Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3.5 px-4 rounded-[11px] bg-white text-[#0a0a0b] font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-[0_14px_34px_rgba(255,255,255,0.18)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-5 text-[#565b66] text-[0.68rem] font-mono tracking-[0.08em]">
        <div className="w-full border-t border-white/[0.10]" />
        <span className="absolute px-3 bg-[#0d0f14] text-[#565b66] uppercase">OR</span>
      </div>

      {/* Google OAuth Button */}
      <GoogleButton onClick={googleLogin} isLoading={isSubmitting} />

      {/* Footer Switch */}
      <div className="text-center mt-5 text-xs text-[#9298a3]">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-white font-medium hover:underline underline-offset-4 cursor-pointer ml-1"
        >
          Create account
        </button>
      </div>
    </motion.div>
  );
};
