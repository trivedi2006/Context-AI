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
        <div className="flex flex-col items-center gap-4 relative z-10">
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

      {/* Main Split Layout: Workspace 28% / Conversation 72% */}
      <main className="flex-1 w-full flex overflow-hidden relative z-10">
        {/* Workspace Panel (28%) */}
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="w-[28%] min-w-[280px] max-w-[360px] h-full border-r border-white/[0.06] bg-[#141414]/70 backdrop-blur-md flex flex-col p-6 overflow-y-auto space-y-6 shrink-0"
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

          {/* Upload Workspace Render: Progress OR Upload Zone / Document Card */}
          {progressState.step !== 'idle' && progressState.step !== 'ready' && progressState.step !== 'error' ? (
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

        {/* Conversation Hero Panel (72%) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 h-full flex flex-col justify-between bg-[#111111]/90 backdrop-blur-sm overflow-hidden"
        >
          {/* Chat Stream Area */}
          {messages.length === 0 ? (
            <EmptyChatState />
          ) : (
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} message={msg} />
              ))}
            </div>
          )}

          {/* Pinned Input Area at Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
