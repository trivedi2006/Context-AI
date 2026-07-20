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
}

const SUGGESTED_QUESTIONS = [
  'Summarize this document',
  'Explain key concepts',
  'Extract action items',
  'Generate interview questions',
  'List important dates',
  'Compare sections',
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  uploadedDoc,
  initialValue = '',
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
    <div className="w-full max-w-4xl mx-auto px-4 pb-4 select-none space-y-3">
      {/* Suggested Question Chips (Appears ONLY AFTER Indexing) */}
      <AnimatePresence>
        {uploadedDoc && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-2 px-1"
          >
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <motion.button
                key={q}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2, backgroundColor: '#232323' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(q)}
                className="px-3 py-1.5 rounded-xl bg-[#171717] border border-white/[0.06] text-xs font-medium text-white/75 hover:text-white transition-colors cursor-pointer shadow-sm"
              >
                {q}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-end gap-3 p-3 bg-[#171717] border rounded-2xl transition-all ${
          uploadedDoc
            ? 'border-white/[0.08] focus-within:border-white/25 shadow-sm'
            : 'border-white/[0.04] opacity-50 pointer-events-none'
        }`}
      >
        {/* Attachment Icon */}
        <div
          className="p-2.5 rounded-xl bg-[#1D1D1D] text-white/50 hover:text-white border border-white/[0.06] flex items-center justify-center shrink-0 cursor-default"
          title={uploadedDoc ? `Document active: ${uploadedDoc.document_name}` : 'Waiting for document...'}
        >
          <Paperclip className="w-4 h-4" />
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            uploadedDoc
              ? 'Ask anything about your document...'
              : 'Waiting for document...'
          }
          rows={1}
          disabled={!uploadedDoc || isStreaming}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/38 resize-none outline-none max-h-40 py-2 leading-relaxed font-sans"
        />

        {/* Submit / Stop Button */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-block text-[10px] font-mono text-white/38 pr-1">
            Press Enter ↵
          </span>

          {isStreaming ? (
            <button
              type="button"
              onClick={onStopStreaming}
              className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all shadow-sm"
              title="Stop Generating"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || !uploadedDoc}
              className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
                input.trim() && uploadedDoc
                  ? 'bg-white text-black hover:bg-white/90 cursor-pointer shadow-sm'
                  : 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
