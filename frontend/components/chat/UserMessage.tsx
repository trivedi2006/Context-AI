'use client';

import React from 'react';
import { ChatMessage } from '@/types';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';

interface UserMessageProps {
  message: ChatMessage;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="w-full flex justify-end mb-6 select-text"
    >
      <div className="flex gap-3 max-w-[85%] sm:max-w-[65%] md:max-w-[55%] flex-row-reverse">
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
          <User className="w-4 h-4" />
        </div>

        {/* Bubble Content */}
        <div className="space-y-1">
          <div className="flex items-center justify-end gap-2 px-1">
            <span className="text-[11px] font-mono text-white/40">{message.timestamp || 'Just now'}</span>
            <span className="text-xs font-semibold text-white/90">You</span>
          </div>

          <div className="user-bubble p-4 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {message.content}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
