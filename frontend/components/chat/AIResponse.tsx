'use client';

import React, { useState } from 'react';
import { ChatMessage, Citation } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Copy, Check, ThumbsUp, ThumbsDown, 
  RotateCw, Bookmark, FileText, Zap, ChevronDown, ChevronUp 
} from 'lucide-react';

interface AIResponseProps {
  message: ChatMessage;
  onCitationClick?: (citation: Citation) => void;
  onRegenerate?: () => void;
}

export const AIResponse: React.FC<AIResponseProps> = ({ message, onCitationClick, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMobileSources, setShowMobileSources] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const citations = message.citations || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full flex justify-start mb-4 sm:mb-6 select-text"
    >
      <div className="ai-card w-full max-w-[88%] sm:max-w-[850px] p-4 sm:p-6 space-y-3.5 rounded-2xl">
        {/* AI Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] text-xs sm:text-sm font-semibold text-white">Context AI</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                  llama-3.3-70b
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono hidden sm:inline">Grounded Document QA</span>
            </div>
          </div>

          {message.timingMs && (
            <div className="text-[10px] sm:text-[11px] font-mono text-white/40 flex items-center gap-1 bg-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-white/10">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
              <span>{((message.timingMs.totalResponseTime || 0) / 1000).toFixed(2)}s</span>
            </div>
          )}
        </div>

        {/* Formatted Markdown Content */}
        <div className="text-xs sm:text-sm leading-relaxed text-white/90 space-y-2.5">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-sm sm:text-base font-semibold text-white font-['Space_Grotesk'] mt-3 mb-1.5 first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xs sm:text-sm font-semibold text-white font-['Space_Grotesk'] mt-2.5 mb-1.5 first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xs sm:text-sm font-semibold text-white font-['Space_Grotesk'] mt-2 mb-1 first:mt-0">{children}</h3>,
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-white/85">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2.5 space-y-1 text-white/85">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2.5 space-y-1 text-white/85">{children}</ol>,
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (!inline && match) {
                  return (
                    <div className="my-2.5 rounded-xl overflow-hidden border border-white/10 bg-[#121215]">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1e] border-b border-white/10 text-[11px] font-mono text-white/50">
                        <span>{match[1]}</span>
                        <button
                          onClick={() => handleCopyCode(codeString)}
                          className="flex items-center gap-1 text-white/60 hover:text-white transition-colors cursor-pointer min-h-[32px]"
                        >
                          {copiedCode === codeString ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 text-[11px] font-mono overflow-x-auto text-white/90 leading-normal">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                }
                return <code className="bg-white/10 border border-white/10 px-1 py-0.5 rounded text-[11px] text-cyan-300 font-mono" {...props}>{children}</code>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {(message as any).isStreaming && (
            <span className="inline-block w-2 h-3.5 ml-1 bg-white animate-pulse align-middle" />
          )}
        </div>

        {/* Mobile & Desktop Collapsible Source References */}
        {citations.length > 0 && (
          <div className="border-t border-white/[0.08] pt-2.5 mt-3 space-y-2">
            {/* Mobile View: Collapsible Bar */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowMobileSources((prev) => !prev)}
                className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white transition-all cursor-pointer min-h-[40px]"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium">Sources ({citations.length})</span>
                </div>
                {showMobileSources ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>

              <AnimatePresence>
                {showMobileSources && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-1.5 overflow-x-auto no-scrollbar py-1"
                  >
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {citations.map((cit, idx) => (
                        <button
                          key={idx}
                          onClick={() => onCitationClick?.(cit)}
                          className="source-pill-card flex items-center gap-2 cursor-pointer shrink-0 py-1.5 px-3 text-xs"
                          title={`Excerpt from page ${cit.page_number}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                          <span>📄 {cit.source || 'PDF'}</span>
                          <span className="font-mono text-white/40">• Pg {cit.page_number}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop View: Full Source Pills */}
            <div className="hidden sm:block space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-white/50 font-medium">
                <FileText className="w-3.5 h-3.5 text-white/70" />
                <span>Source References &amp; Grounding Pages:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {citations.map((cit, idx) => (
                  <button
                    key={idx}
                    onClick={() => onCitationClick?.(cit)}
                    className="source-pill-card flex items-center gap-2 cursor-pointer"
                    title={`Excerpt from ${cit.source} page ${cit.page_number}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>📄 {cit.source || 'PDF'}</span>
                    <span className="font-mono text-white/40">• Page {cit.page_number}</span>
                    <span className="font-mono text-emerald-400 text-[10px]">98% match</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-xs text-white/50">
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyText}
              className="action-btn min-h-[36px] px-2.5"
              title="Copy answer text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRegenerate && (
              <button onClick={onRegenerate} className="action-btn min-h-[36px] px-2.5" title="Retry">
                <RotateCw className="w-3.5 h-3.5" />
                <span className="text-[11px]">Retry</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className={`p-2 rounded-lg border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                feedback === 'up' ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
              }`}
              title="Helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              className={`p-2 rounded-lg border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                feedback === 'down' ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-lg border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                isBookmarked ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
              }`}
              title="Bookmark answer"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
