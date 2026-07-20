'use client';

import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, Citation } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, FileText, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: Citation) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCitationClick }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`py-4 px-4 sm:px-6 rounded-2xl transition-all ${
        isUser
          ? 'bg-blue-600/10 border border-blue-500/20 ml-auto max-w-[85%]'
          : 'glass-card border border-slate-800/80 mr-auto w-full'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div
          className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isUser
              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 text-cyan-400'
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-400">
              {isUser ? 'You' : 'ProjectBrain Assistant'}
            </span>

            {!isUser && message.content && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
                title="Copy Answer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {/* Message Markdown Body */}
          <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                code: ({ node, className, children, ...props }) => (
                  <code
                    className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-blue-300 font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                ),
                ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              }}
            >
              {message.content}
            </ReactMarkdown>

            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse align-middle" />
            )}
          </div>

          {/* Citations Footer */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Citations:
              </span>
              {message.citations.map((c, i) => (
                <button
                  key={i}
                  onClick={() => onCitationClick?.(c)}
                  className="text-xs bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800/40 px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 font-mono"
                >
                  <span>Page {c.page_number}</span>
                </button>
              ))}
            </div>
          )}

          {/* Response Timing Metrics */}
          {!isUser && message.timing_ms && (
            <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Total: {message.timing_ms.total_response_time}ms
              </span>
              {message.timing_ms.retrieval_time && (
                <span>Retrieval: {message.timing_ms.retrieval_time}ms</span>
              )}
              {message.timing_ms.llm_response_time && (
                <span>Groq LLM: {message.timing_ms.llm_response_time}ms</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
