'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';

export const UserDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={dropdownRef} className="relative select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
      >
        {user.profile_picture ? (
          <img
            src={user.profile_picture}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center text-[10px] font-semibold">
            {initials}
          </div>
        )}
        <span className="text-xs text-white font-medium max-w-[100px] truncate">{user.name}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-56 bg-[#181818] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 space-y-1"
          >
            <div className="p-3 border-b border-white/[0.08]">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-white/50 truncate font-mono">{user.email}</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Account</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full p-2.5 rounded-xl hover:bg-rose-500/10 text-rose-300 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
