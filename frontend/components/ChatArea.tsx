'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType, Citation } from '@/types';
import { ChatMessage } from './ChatMessage';
import { CitationPanel } from './CitationPanel';
import { Send, Sparkles, MessageSquare, Loader2, StopCircle } from 'lucide-react';

interface ChatAreaProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
  onSendMessage: (question: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isStreaming, onSendMessage }) => {
  const [inputQuestion, setInputQuestion] = useState('');
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isStreaming) return;

    onSendMessage(inputQuestion.trim());
    setInputQuestion('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const sampleQuestions = [
    'Summarize the core findings of this document.',
    'What are the key methodologies described?',
    'List all main sections with page citations.',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto w-full">
      {/* Scrollable Message History */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">PDF Successfully Processed!</h3>
            <p className="text-xs text-slate-400 max-w-md mb-6">
              Ask any question about your document. ProjectBrain AI uses dense vector retrieval to answer exclusively from your PDF text with page citations.
            </p>

            {/* Prompt Suggestions */}
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl w-full">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(q)}
                  className="flex-1 text-left p-3 rounded-xl glass-card hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-all hover:scale-[1.02] flex items-start gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onCitationClick={(c) => setActiveCitation(c)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 glass-panel border-t border-slate-800/80 rounded-t-2xl">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your uploaded document... (Shift+Enter for newline)"
            disabled={isStreaming}
            className="w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-4 py-3 border border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[46px] max-h-32 transition-all"
          />

          <button
            type="submit"
            disabled={!inputQuestion.trim() || isStreaming}
            className="h-[46px] w-[46px] shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20"
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-2">
          <span>Zero-hallucination mode active</span>
          <span>Groq llama-3.3-70b-versatile</span>
        </div>
      </div>

      {/* Citation Inspector Modal */}
      <CitationPanel citation={activeCitation} onClose={() => setActiveCitation(null)} />
    </div>
  );
};
