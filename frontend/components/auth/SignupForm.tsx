'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleButton } from './GoogleButton';
import { User as UserIcon, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSuccessRedirect: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onSuccessRedirect }) => {
  const { signup, googleLogin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.');
      triggerErrorShake();
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify password.');
      triggerErrorShake();
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      triggerErrorShake();
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      onSuccessRedirect();
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || 'Failed to create account.';
      setErrorMessage(detail);
      triggerErrorShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      key="signup-form"
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
      <h2 className="font-space text-[1.5rem] font-semibold text-[#f2f3f5] mb-1.5 leading-tight">Create account</h2>
      <p className="text-[0.86rem] text-[#9298a3] mb-5">Start analyzing documents with Context AI.</p>

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
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-[0.74rem] text-[#9298a3] mb-1.5 font-medium tracking-wide">Full Name</label>
          <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.10] rounded-[11px] px-3.5 py-2.5 transition-all focus-within:border-white/30 focus-within:ring-4 focus-within:ring-white/[0.05] focus-within:bg-white/[0.05]">
            <UserIcon className="w-4 h-4 text-[#9298a3] shrink-0" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivers"
              className="bg-transparent border-none outline-none text-[#f2f3f5] text-[0.9rem] w-full font-sans placeholder:text-[#5b606c]"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-[0.74rem] text-[#9298a3] mb-1.5 font-medium tracking-wide">Email</label>
          <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.10] rounded-[11px] px-3.5 py-2.5 transition-all focus-within:border-white/30 focus-within:ring-4 focus-within:ring-white/[0.05] focus-within:bg-white/[0.05]">
            <Mail className="w-4 h-4 text-[#9298a3] shrink-0" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acme.com"
              className="bg-transparent border-none outline-none text-[#f2f3f5] text-[0.9rem] w-full font-sans placeholder:text-[#5b606c]"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[0.74rem] text-[#9298a3] mb-1.5 font-medium tracking-wide">Password</label>
          <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.10] rounded-[11px] px-3.5 py-2.5 transition-all focus-within:border-white/30 focus-within:ring-4 focus-within:ring-white/[0.05] focus-within:bg-white/[0.05]">
            <Lock className="w-4 h-4 text-[#9298a3] shrink-0" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="bg-transparent border-none outline-none text-[#f2f3f5] text-[0.9rem] w-full font-sans placeholder:text-[#5b606c]"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[0.74rem] text-[#9298a3] mb-1.5 font-medium tracking-wide">Confirm Password</label>
          <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.10] rounded-[11px] px-3.5 py-2.5 transition-all focus-within:border-white/30 focus-within:ring-4 focus-within:ring-white/[0.05] focus-within:bg-white/[0.05]">
            <Lock className="w-4 h-4 text-[#9298a3] shrink-0" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="bg-transparent border-none outline-none text-[#f2f3f5] text-[0.9rem] w-full font-sans placeholder:text-[#5b606c]"
            />
          </div>
        </div>

        {/* Create Account CTA Button */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3.5 px-4 mt-2 rounded-[11px] bg-white text-[#0a0a0b] font-semibold text-[0.92rem] flex items-center justify-center gap-2 hover:shadow-[0_14px_34px_rgba(255,255,255,0.18)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-4 text-[#565b66] text-[0.68rem] font-mono tracking-[0.08em]">
        <div className="w-full border-t border-white/[0.10]" />
        <span className="absolute px-3 bg-[#111318] text-[#565b66] uppercase">OR</span>
      </div>

      {/* Google OAuth Button */}
      <GoogleButton onClick={googleLogin} isLoading={isSubmitting} />

      {/* Footer Switch */}
      <div className="text-center mt-4 text-[0.82rem] text-[#9298a3]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-white font-medium hover:underline underline-offset-4 cursor-pointer ml-1"
        >
          Sign in
        </button>
      </div>
    </motion.div>
  );
};
