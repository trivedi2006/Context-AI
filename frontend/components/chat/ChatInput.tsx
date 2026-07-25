'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Paperclip, Square, Sparkles } from 'lucide-react';
import { UploadResponse } from '@/types';

interface ChatInputProps {
  onSendMessage: (question: string) => void;
  isStreaming: boolean;
  onStopStreaming?: () => void;
  uploadedDoc: UploadResponse | null;
  initialValue?: string;
  onUploadClick?: () => void;
}

const QUICK_PILLS = [
  { label: 'Explain', query: 'Explain the main concepts in this document simply.' },
  { label: 'Summarize', query: 'Summarize the document into key bullet points.' },
  { label: 'Key Takeaways', query: 'What are the top 5 key takeaways?' },
  { label: 'Translate', query: 'Translate the main summary into English.' },
  { label: 'Page Count', query: 'How many pages are in this document?' },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  uploadedDoc,
  initialValue = '',
  onUploadClick,
}) => {
  const [input, setInput] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
      if (textareaRef.current) textareaRef.current.focus();
    }
  }, [initialValue]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming || !uploadedDoc) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePillClick = (query: string) => {
    if (uploadedDoc && !isStreaming) {
      onSendMessage(query);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5 select-none space-y-2.5">
      {/* Horizontally Scrollable Quick Action Pills */}
      <AnimatePresence>
        {uploadedDoc && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 touch-pan-x px-1"
          >
            {QUICK_PILLS.map((pill) => (
              <button
                key={pill.label}
                onClick={() => handlePillClick(pill.query)}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[36px] flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{pill.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating ChatGPT / Claude Style Input Shell */}
      <form
        onSubmit={handleSubmit}
        className="input-floating-shell p-2.5 sm:p-3 flex items-end gap-2.5 sm:gap-3 transition-all rounded-2xl sm:rounded-3xl border border-white/15 bg-[#18181c]/90 backdrop-blur-xl shadow-2xl"
      >
        {/* Attachment Button */}
        <button
          type="button"
          onClick={onUploadClick}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-105 min-h-[44px] min-w-[44px]"
          title="Upload new PDF document"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            uploadedDoc
              ? 'Ask anything about your document...'
              : 'Click 📎 attachment to upload a PDF...'
          }
          rows={1}
          disabled={!uploadedDoc || isStreaming}
          className="flex-1 bg-transparent text-white text-xs sm:text-sm placeholder:text-white/35 resize-none outline-none max-h-36 py-2.5 leading-relaxed font-sans"
        />

        {/* Submit / Stop Action */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-block text-[11px] font-mono text-white/30 pr-1">
            Enter ↵
          </span>

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all shadow-sm cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Stop Generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || !uploadedDoc}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px] ${
                input.trim() && uploadedDoc
                  ? 'bg-white text-black hover:bg-white/90 shadow-md active:scale-95'
                  : 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
