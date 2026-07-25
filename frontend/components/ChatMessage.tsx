'use client';

import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, Citation } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
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

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="ml-auto max-w-[85%] sm:max-w-[70%] bg-[var(--panel-2)] border border-[var(--border-strong)] text-[var(--text)] py-3 px-4 sm:px-5 rounded-2xl text-sm leading-relaxed"
      >
        <p className="m-0 whitespace-pre-wrap">{message.content}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="ai-msg-card mr-auto w-full max-w-[760px]"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-[#c9a9ff] font-['Space_Grotesk']">
          Context AI Assistant
        </span>

        {message.content && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-[var(--text-dim)] hover:text-white bg-[var(--panel-2)] hover:bg-[var(--panel)] border border-[var(--border)] px-2 py-1 rounded-lg transition-colors cursor-pointer"
            title="Copy Answer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>

      {/* Message Markdown Body */}
      <div className="text-[13.5px] leading-relaxed text-[#d6d6e2]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-sm font-semibold text-[#e4d9ff] font-['Space_Grotesk'] mt-3 mb-1.5 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm font-semibold text-[#e4d9ff] font-['Space_Grotesk'] mt-3 mb-1.5 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold text-[#e4d9ff] font-['Space_Grotesk'] mt-3 mb-1.5 first:mt-0">{children}</h3>,
            p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
            code: ({ node, className, children, ...props }: any) => (
              <code
                className="bg-[#0f0f1a] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs text-[#22d3ee] font-mono"
                {...props}
              >
                {children}
              </code>
            ),
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2.5 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2.5 space-y-1">{children}</ol>,
          }}
        >
          {message.content}
        </ReactMarkdown>

        {(message as any).isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-[var(--cyan)] animate-pulse align-middle" />
        )}
      </div>

      {/* Sources Row */}
      {message.citations && message.citations.length > 0 && (
        <div className="sources-row">
          <span className="text-[11px] text-[var(--text-faint)] flex items-center gap-1">
            📖 Sources
          </span>
          {message.citations.map((c, i) => (
            <button
              key={i}
              onClick={() => onCitationClick?.(c)}
              className="source-pill"
              title={`Page ${c.page_number}`}
            >
              <span className="dot-cyan" />
              <span>Page {c.page_number}</span>
            </button>
          ))}
        </div>
      )}

      {/* Response Timing Metrics */}
      {message.timingMs && (
        <div className="stats-row">
          {message.timingMs.retrievalTime && (
            <span>⚡ retrieval <b>{message.timingMs.retrievalTime}ms</b></span>
          )}
          {message.timingMs.totalResponseTime && (
            <span>total <b>{(message.timingMs.totalResponseTime / 1000).toFixed(2)}s</b></span>
          )}
        </div>
      )}
    </motion.div>
  );
};
