'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Citation } from '@/types';
import { User, Bot, Copy, Check, BookOpen, Zap } from 'lucide-react';
import { CitationPopover } from './CitationPopover';

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  const isUser = message.role === 'user';

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(codeText);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <>
      <motion.div
        initial={
          isUser
            ? { scale: 0.98, opacity: 0 }
            : { opacity: 0, y: 12 }
        }
        animate={
          isUser
            ? { scale: 1, opacity: 1 }
            : { opacity: 1, y: 0 }
        }
        transition={{
          duration: isUser ? 0.3 : 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 select-text`}
      >
        <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar Icon */}
          <div
            className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border text-xs font-semibold shadow-sm ${
              isUser
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-[#171717] text-white border-white/10'
            }`}
          >
            {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-white" />}
          </div>

          {/* Message Content Container */}
          <div className="space-y-2.5 min-w-0">
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                isUser
                  ? 'bg-[#1D1D1D] text-white border border-white/[0.08] shadow-sm'
                  : 'bg-[#171717] text-white/90 border border-white/[0.06] shadow-sm'
              }`}
            >
              {isUser ? (
                <div className="whitespace-pre-wrap font-sans">{message.content}</div>
              ) : (
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');

                        if (!inline && match) {
                          return (
                            <div className="relative group my-3 rounded-xl overflow-hidden border border-white/[0.06] bg-[#141414]">
                              <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a1a] border-b border-white/[0.06] text-xs font-mono text-white/40">
                                <span>{match[1]}</span>
                                <button
                                  onClick={() => handleCopyCode(codeString)}
                                  className="flex items-center gap-1 text-white/60 hover:text-white transition-colors"
                                >
                                  {copiedCode === codeString ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-[#D9FFD6]" />
                                      <span className="text-[10px] text-[#D9FFD6]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span className="text-[10px]">Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="p-4 text-xs font-mono overflow-x-auto text-white/90">
                                <code>{children}</code>
                              </pre>
                            </div>
                          );
                        }
                        return <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>

                  {/* Animated typing cursor during streaming */}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse" />
                  )}
                </div>
              )}
            </div>

            {/* Deduplicated Sources List */}
            {!isUser && message.citations && message.citations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="text-[11px] font-mono text-white/50 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-white/60" /> Sources:
                </span>
                {message.citations.map((cit, idx) => (
                  <button
                    key={`${cit.chunk_id}_${idx}`}
                    onClick={() => setActiveCitation(cit)}
                    className="citation-tag"
                  >
                    <span>• Page {cit.page_number}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Latency Timing Badge */}
            {!isUser && message.timing_ms?.total_response_time && (
              <div className="text-[10px] font-mono text-white/38 flex items-center gap-2">
                <Zap className="w-3 h-3 text-amber-300/80" />
                <span>Retrieval: {message.timing_ms.retrieval_time || 0}ms</span>
                <span>•</span>
                <span>Total: {((message.timing_ms.total_response_time || 0) / 1000).toFixed(2)}s</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Citation Popover Modal */}
      <CitationPopover citation={activeCitation} onClose={() => setActiveCitation(null)} />
    </>
  );
};
