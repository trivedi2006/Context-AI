'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Paperclip, Square } from 'lucide-react';
import { UploadResponse } from '@/types';

interface ChatInputProps {
  onSendMessage: (question: string) => void;
  isStreaming: boolean;
  onStopStreaming?: () => void;
  uploadedDoc: UploadResponse | null;
  initialValue?: string;
  onUploadClick?: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Explain first page',
  'Summarize document',
  'Extract action items',
  'List key dates & numbers',
  'What are the conclusions?',
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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-5 select-none space-y-3">
      {/* Prompt Suggestion Chips */}
      <AnimatePresence>
        {uploadedDoc && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 touch-pan-x"
          >
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Input Shell */}
      <form
        onSubmit={handleSubmit}
        className="input-floating-shell p-3 flex items-end gap-3 transition-all opacity-100"
      >
        {/* Attachment Icon */}
        <button
          type="button"
          onClick={onUploadClick}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-all hover:scale-105"
          title="Upload new PDF document"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            uploadedDoc
              ? 'Ask anything about your document...'
              : 'Click 📎 attachment to upload a PDF or ask...'
          }
          rows={1}
          disabled={!uploadedDoc || isStreaming}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/35 resize-none outline-none max-h-40 py-2 leading-relaxed font-sans"
        />

        {/* Submit / Stop Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="hidden sm:inline-block text-[11px] font-mono text-white/30 pr-1">
            Press Enter ↵
          </span>

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all shadow-sm cursor-pointer"
              title="Stop Generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || !uploadedDoc}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                input.trim() && uploadedDoc
                  ? 'bg-white text-black hover:bg-white/90 shadow-md'
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
