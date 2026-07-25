'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, MessageSquare, CheckCircle2 } from 'lucide-react';
import { UploadResponse } from '@/types';
import { ChatSessionData } from '@/services/chat';
import { useAuth } from '@/contexts/AuthContext';

interface EmptyChatStateProps {
  uploadedDoc?: UploadResponse | null;
  sessions?: ChatSessionData[];
  onSelectSession?: (sessionId: string) => void;
  onNewChat?: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  uploadedDoc,
  sessions = [],
  onSelectSession,
  onNewChat,
}) => {
  const { user } = useAuth();
  const userName = user?.name ? user.name.split(' ')[0] : 'Daksh';

  if (uploadedDoc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 select-none max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-cyan-500/20 border border-[var(--border-strong)] flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Sparkles className="w-7 h-7 text-[var(--cyan)]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white tracking-tight font-['Space_Grotesk']">
              {uploadedDoc.document_name} Ready
            </h2>
            <p className="text-xs text-[var(--text-dim)] leading-relaxed max-w-sm mx-auto">
              Indexed {uploadedDoc.total_pages} pages into vector store. Ask any question below to start.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 text-xs text-[#7ee8c7] bg-[rgba(34,211,238,0.08)] border border-[rgba(34,211,238,0.25)] px-3 py-1.5 rounded-full font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Indexed &amp; Grounded QA Active</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 select-none max-w-xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <h2 className="text-2xl font-bold text-white tracking-tight font-['Space_Grotesk']">
          👋 Welcome back {userName}
        </h2>
        <p className="text-sm text-white/50 leading-relaxed max-w-md mx-auto">
          Start a new conversation with your documents or select a past session.
        </p>
      </motion.div>

      {/* New Chat Drop Zone Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onClick={onNewChat}
        className="w-full py-6 px-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/[0.08] transition-all text-center group cursor-pointer space-y-2"
      >
        <div className="w-10 h-10 mx-auto rounded-xl bg-white text-black font-bold flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
          <Plus className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-white font-['Space_Grotesk']">
          + New Chat
        </p>
        <p className="text-xs text-white/40">
          Click or drag a PDF document here to upload
        </p>
      </motion.button>

      {/* Recent Sessions Launcher */}
      {sessions.length > 0 && (
        <div className="w-full space-y-3 text-left">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40 font-['Space_Grotesk']">
            Recent Conversations
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sessions.slice(0, 4).map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSession?.(s.id)}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all flex items-center gap-3 cursor-pointer group"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate">
                    📄 {s.document?.filename || s.title}
                  </p>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">
                    {s.message_count || 0} Messages
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
