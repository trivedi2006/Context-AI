'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { Navbar } from '@/components/navbar/Navbar';
import { FooterStatusBar } from '@/components/status/FooterStatusBar';
import { BackgroundCanvas } from '@/components/common/BackgroundCanvas';
import { UploadZone } from '@/components/upload/UploadZone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { DocumentCard } from '@/components/upload/DocumentCard';
import { EmptyChatState } from '@/components/chat/EmptyChatState';
import { ChatMessageItem } from '@/components/chat/ChatMessageItem';
import { ChatInput } from '@/components/chat/ChatInput';
import { HealthStatus, UploadResponse, ChatMessage, Citation, UploadProgressState } from '@/types';
import { systemService } from '@/services/system';
import { documentService } from '@/services/document';
import { chatService } from '@/services/chat';

function DashboardContent() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [viewMode, setViewMode] = useState<'landing' | 'workspace'>('workspace');
  const [mobileTab, setMobileTab] = useState<'workspace' | 'chat'>('workspace');

  // Automatically transition to workspace whenever user is authenticated
  useEffect(() => {
    if (user) {
      setViewMode('workspace');
    } else {
      setViewMode('landing');
    }
  }, [user]);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<UploadResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const [progressState, setProgressState] = useState<UploadProgressState>({
    step: 'idle',
    percentage: 0,
    currentStepMessage: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Poll system health
  useEffect(() => {
    let isMounted = true;
    const checkSystemHealth = async () => {
      const status = await systemService.getHealthStatus();
      if (isMounted) setHealth(status);
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, health?.backend === 'ok' ? 12000 : 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [health?.backend]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Handle PDF Upload flow with animated steps
  const handleFileSelected = async (file: File) => {
    setProgressState({
      step: 'extracting',
      percentage: 15,
      currentStepMessage: 'Extracting text from PDF...',
    });

    try {
      const timer1 = setTimeout(() => {
        setProgressState({
          step: 'chunking',
          percentage: 40,
          currentStepMessage: 'Generating 700-token chunks...',
        });
      }, 800);

      const timer2 = setTimeout(() => {
        setProgressState({
          step: 'embedding',
          percentage: 70,
          currentStepMessage: 'Encoding local embeddings...',
        });
      }, 1600);

      const response = await documentService.uploadPDF(file, (percent) => {
        if (percent > 80) {
          setProgressState({
            step: 'indexing',
            percentage: 90,
            currentStepMessage: 'Indexing in Qdrant...',
          });
        }
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      setProgressState({
        step: 'ready',
        percentage: 100,
        currentStepMessage: 'Indexing complete.',
      });

      setUploadedDoc(response);
      setMessages([]);
      // Automatically switch to chat tab on mobile after successful upload
      setMobileTab('chat');
    } catch (err: any) {
      setProgressState({
        step: 'error',
        percentage: 0,
        currentStepMessage: 'Upload failed',
        error: err.response?.data?.detail || err.message || 'Failed to process PDF file.',
      });
    }
  };

  const handleClearDocument = async () => {
    try {
      await documentService.deleteDocument();
    } catch (e) {
      console.error('Failed to delete collection from Qdrant:', e);
    } finally {
      setUploadedDoc(null);
      setMessages([]);
      setProgressState({
        step: 'idle',
        percentage: 0,
        currentStepMessage: '',
      });
      setMobileTab('workspace');
    }
  };

  const handleSendMessage = async (question: string) => {
    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `assistant_${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      citations: [],
      isStreaming: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();
    let accumulatedTokens = '';

    await chatService.streamChat(
      question,
      {
        onMetadata: (citations: Citation[], retrievalTimeMs: number) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    citations,
                    timing_ms: { ...msg.timing_ms, retrieval_time: retrievalTimeMs },
                  }
                : msg
            )
          );
        },
        onToken: (token: string) => {
          accumulatedTokens += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: accumulatedTokens }
                : msg
            )
          );
        },
        onDone: (timingMs: any) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    isStreaming: false,
                    timing_ms: {
                      retrieval_time: timingMs.retrieval_time,
                      llm_response_time: timingMs.llm_response_time,
                      total_response_time: timingMs.total_response_time,
                    },
                  }
                : msg
            )
          );
          setIsStreaming(false);
        },
        onError: (errorMsg: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: accumulatedTokens || `⚠️ ${errorMsg}`,
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsStreaming(false);
        },
      },
      abortControllerRef.current.signal
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
      );
    }
  };

  const isProcessing = progressState.step !== 'idle' && progressState.step !== 'ready';

  // 1. Loading screen while authenticating session
  if (isAuthLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#111111] text-white">
        <BackgroundCanvas />
        <div className="flex flex-col items-center gap-4 relative z-10 px-4 text-center">
          <div className="w-9 h-9 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-mono text-white/50 tracking-wider">Loading Context AI Session...</p>
        </div>
      </div>
    );
  }

  // 2. Render landing page if unauthenticated OR if explicitly viewing landing page
  if (!user || viewMode === 'landing') {
    return (
      <AuthScreen
        onSuccessRedirect={() => setViewMode('workspace')}
        onEnterWorkspace={() => setViewMode('workspace')}
        isAuthenticated={!!user}
        onLogout={logout}
      />
    );
  }

  // 3. Render Main Workspace when authenticated
  return (
    <div className="w-full h-screen flex flex-col bg-[#111111] text-white overflow-hidden relative select-none font-sans">
      {/* Subtle Background */}
      <BackgroundCanvas />

      {/* Navbar */}
      <Navbar
        health={health}
        uploadedDoc={uploadedDoc}
        isProcessing={isProcessing}
        onOpenAuth={() => setShowAuthOverlay(true)}
        onLogoClick={() => setViewMode('landing')}
      />

      {/* Mobile / Tablet Tab Switcher (Visible only on < lg screens) */}
      <div className="flex lg:hidden w-full border-b border-white/[0.08] bg-[#141414] shrink-0 relative z-20">
        <button
          onClick={() => setMobileTab('workspace')}
          className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer text-center ${
            mobileTab === 'workspace'
              ? 'text-white border-b-2 border-[#65f4a6] bg-white/[0.04]'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          📄 Workspace
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer text-center ${
            mobileTab === 'chat'
              ? 'text-[#65f4a6] border-b-2 border-[#65f4a6] bg-white/[0.04]'
              : 'text-white/50 hover:text-white/80'
          }`}
        >
          💬 Conversation {messages.length > 0 && `(${messages.length / 2})`}
        </button>
      </div>

      {/* Main Split Layout: Mobile Tab OR Responsive Desktop 28%/72% Grid */}
      <main className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden relative z-10">
        {/* Workspace Panel (Mobile: Tab controlled / Desktop: Always visible left column) */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`${
            mobileTab === 'workspace' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-[320px] xl:w-[360px] h-full border-r border-white/[0.06] bg-[#141414]/70 backdrop-blur-md flex-col p-4 sm:p-6 overflow-y-auto space-y-6 shrink-0`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-white/40 heading-display">
              Workspace
            </h2>
            {uploadedDoc && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                1 Document
              </span>
            )}
          </div>

          {/* Upload Workspace Render: Progress (including Error state) OR Upload Zone / Document Card */}
          {progressState.step !== 'idle' && progressState.step !== 'ready' ? (
            <UploadProgress progressState={progressState} />
          ) : uploadedDoc ? (
            <DocumentCard
              uploadedDoc={uploadedDoc}
              onClearDocument={handleClearDocument}
              onReplaceClick={() => {
                setUploadedDoc(null);
                setProgressState({ step: 'idle', percentage: 0, currentStepMessage: '' });
              }}
            />
          ) : (
            <UploadZone
              onFileSelected={handleFileSelected}
              isProcessing={isProcessing}
            />
          )}
        </motion.section>

        {/* Conversation Hero Panel (Mobile: Tab controlled / Desktop: Always visible right hero panel) */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`${
            mobileTab === 'chat' ? 'flex' : 'hidden'
          } lg:flex flex-1 w-full h-full flex-col justify-between bg-[#111111]/90 backdrop-blur-sm overflow-hidden`}
        >
          {/* Chat Stream Area */}
          {messages.length === 0 ? (
            <EmptyChatState />
          ) : (
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 space-y-6">
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}
            </div>
          )}

          {/* Pinned Input Area at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ChatInput
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              uploadedDoc={uploadedDoc}
            />
          </motion.div>
        </motion.section>
      </main>

      {/* Footer Status Bar */}
      <FooterStatusBar health={health} />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
