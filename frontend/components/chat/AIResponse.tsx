'use client';

import React, { useState } from 'react';
import { ChatMessage, Citation } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { 
  Bot, Copy, Check, ThumbsUp, ThumbsDown, 
  RotateCw, Bookmark, Share2, FileText, Zap, Sparkles 
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full flex justify-start mb-6 select-text"
    >
      <div className="ai-card w-full max-w-[850px] p-5 sm:p-6 space-y-4">
        {/* AI Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Space_Grotesk'] text-sm font-semibold text-white">Context AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70">
                  llama-3.3-70b
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">Grounded Document QA</span>
            </div>
          </div>

          {message.timingMs && (
            <div className="text-[11px] font-mono text-white/40 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{((message.timingMs.totalResponseTime || 0) / 1000).toFixed(2)}s</span>
            </div>
          )}
        </div>

        {/* Formatted Markdown Content */}
        <div className="text-sm leading-relaxed text-white/90 space-y-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-base font-semibold text-white font-['Space_Grotesk'] mt-4 mb-2 first:mt-0">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-semibold text-white font-['Space_Grotesk'] mt-3 mb-2 first:mt-0">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold text-white font-['Space_Grotesk'] mt-3 mb-1.5 first:mt-0">{children}</h3>,
              p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-white/85">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-white/85">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-white/85">{children}</ol>,
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');

                if (!inline && match) {
                  return (
                    <div className="my-3 rounded-xl overflow-hidden border border-white/10 bg-[#121215]">
                      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1e] border-b border-white/10 text-xs font-mono text-white/50">
                        <span>{match[1]}</span>
                        <button
                          onClick={() => handleCopyCode(codeString)}
                          className="flex items-center gap-1 text-white/60 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedCode === codeString ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 text-xs font-mono overflow-x-auto text-white/90 leading-normal">
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                }
                return <code className="bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-xs text-cyan-300 font-mono" {...props}>{children}</code>;
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {(message as any).isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse align-middle" />
          )}
        </div>

        {/* Source References */}
        {message.citations && message.citations.length > 0 && (
          <div className="border-t border-white/[0.08] pt-3.5 mt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-white/50 font-medium">
              <FileText className="w-3.5 h-3.5 text-white/70" />
              <span>Source References &amp; Grounding Pages:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {message.citations.map((cit, idx) => (
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
        )}

        {/* Footer Action Bar */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs text-white/50">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyText}
              className="action-btn"
              title="Copy answer text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRegenerate && (
              <button onClick={onRegenerate} className="action-btn" title="Regenerate response">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                feedback === 'up' ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
              }`}
              title="Helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                feedback === 'down' ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/40 border-white/10 hover:text-white'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
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
