'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadResponse, ChatMessage, UploadProgressState, DocumentData } from '@/types';
import { chatService, ChatSessionData } from '@/services/chat';
import { documentService } from '@/services/document';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Loader2 } from 'lucide-react';

export default function WorkspacePage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [sessions, setSessions] = useState<ChatSessionData[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ChatSessionData | null>(null);
  const [uploadedDoc, setUploadedDoc] = useState<UploadResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressState, setProgressState] = useState<UploadProgressState>({
    step: 'idle',
    progressPercent: 0,
    message: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Data Fetch (Documents & Sessions) - Only run if user is logged in
  const refreshWorkspace = useCallback(async () => {
    if (!user) return;
    try {
      const [fetchedDocs, fetchedSessions] = await Promise.all([
        chatService.getUserDocuments(),
        chatService.listChatSessions(),
      ]);

      setDocuments(fetchedDocs);
      setSessions(fetchedSessions);

      // Auto-select latest active session if none selected
      if (!activeSessionId && fetchedSessions.length > 0) {
        const latestSession = fetchedSessions[0];
        setActiveSessionId(latestSession.id);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    }
  }, [user, activeSessionId]);

  useEffect(() => {
    if (user) {
      refreshWorkspace();
    }
  }, [user, refreshWorkspace]);

  // 2. Load Session Detail & Messages on Session Select
  useEffect(() => {
    if (!user || !activeSessionId) {
      setActiveSession(null);
      setMessages([]);
      setUploadedDoc(null);
      return;
    }

    let isMounted = true;
    chatService.getChatSession(activeSessionId)
      .then((sessionData) => {
        if (!isMounted) return;
        setActiveSession(sessionData);
        setMessages(sessionData.messages || []);
        setProgressState({ step: 'ready', progressPercent: 100, message: '' });

        if (sessionData.document) {
          setUploadedDoc({
            status: 'success',
            document_id: sessionData.document.id,
            chat_session_id: sessionData.id,
            document_name: sessionData.document.display_name || sessionData.document.filename,
            total_pages: sessionData.document.page_count,
            total_chunks: 0,
            document_status: sessionData.document.processing_status,
          });
        }
      })
      .catch((err) => console.error('Failed to load session details:', err));

    return () => {
      isMounted = false;
    };
  }, [user, activeSessionId]);

  // 3. Background Processing Poller
  const startPollingDocumentStatus = useCallback((documentId: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const docStatus = await chatService.getDocumentStatus(documentId);
        if (docStatus.processing_status === 'ready' || docStatus.processing_status === 'error') {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setIsProcessing(false);
          setProgressState({ step: 'ready', progressPercent: 100, message: 'PDF Ready' });
          refreshWorkspace();
        }
      } catch (err) {
        console.error('Polling document status error:', err);
      }
    }, 2500);
  }, [refreshWorkspace]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  // 4. File Upload Handler (SHA-256 Deduplication & Reuse)
  const handleFileSelected = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgressState({
        step: 'extracting',
        progressPercent: 30,
        message: 'Uploading PDF & checking SHA-256 hash...',
      });

      const response = await documentService.uploadPDF(file, (percent) => {
        setProgressState((prev) => ({
          ...prev,
          progressPercent: Math.min(percent, 90),
        }));
      });

      setUploadedDoc(response);
      refreshWorkspace();

      if (response.chat_session_id) {
        setActiveSessionId(response.chat_session_id);
      }

      if (response.document_status === 'processing') {
        startPollingDocumentStatus(response.document_id);
      } else {
        setIsProcessing(false);
        setProgressState({ step: 'ready', progressPercent: 100, message: 'PDF Ready' });
      }
    } catch (err: any) {
      setIsProcessing(false);
      const errDetail = err?.response?.data?.detail || 'Failed to upload PDF file.';
      setProgressState({
        step: 'error',
        progressPercent: 0,
        message: 'Upload Failed',
        error: errDetail,
      });
    }
  };

  // 5. Create New Chat Session for Existing Document
  const handleNewChatForDocument = async (documentId: string) => {
    try {
      const newSession = await chatService.createDocumentChatSession(documentId);
      await refreshWorkspace();
      setActiveSessionId(newSession.id);
      setProgressState({ step: 'ready', progressPercent: 100, message: '' });
    } catch (err) {
      console.error('Failed to create new chat session for document:', err);
    }
  };

  // 6. Delete Scoped Chat Session
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await chatService.deleteChatSession(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
      refreshWorkspace();
    } catch (err) {
      console.error('Failed to delete chat session:', err);
    }
  };

  // 7. Delete Cascading Document
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await chatService.deleteDocument(documentId);
      if (activeSession?.document_id === documentId) {
        setActiveSessionId(null);
      }
      refreshWorkspace();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // 8. Send Question & Stream Llama Response
  const handleSendMessage = async (question: string) => {
    if (!activeSessionId || isStreaming) return;

    setProgressState({ step: 'ready', progressPercent: 100, message: '' });

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    await chatService.sendQuestionStream(
      activeSessionId,
      question,
      (token) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + token }
              : msg
          )
        );
      },
      (metadata) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, citations: metadata.citations }
              : msg
          )
        );
      },
      (finalContent, timingMs) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: finalContent || msg.content,
                  timingMs: timingMs
                    ? {
                        retrievalTime: timingMs.retrieval_time,
                        totalResponseTime: timingMs.total_response_time,
                      }
                    : undefined,
                }
              : msg
          )
        );
        setIsStreaming(false);
        refreshWorkspace();
      },
      (errorMessage) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: `⚠️ Error: ${errorMessage}` }
              : msg
          )
        );
        setIsStreaming(false);
      },
      abortControllerRef.current.signal
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  // Auth Loading State
  if (isAuthLoading) {
    return (
      <div className="w-screen h-screen bg-[#08090b] flex flex-col items-center justify-center space-y-4 text-white font-sans">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-pulse">
          <Sparkles className="w-5 h-5 text-black" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-white/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <span>Initializing Context AI...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Render Production Landing & Auth Page
  if (!user) {
    return <AuthScreen />;
  }

  // Authenticated -> Render AI Workspace
  return (
    <ChatLayout
      documents={documents}
      sessions={sessions}
      activeSessionId={activeSessionId}
      activeSession={activeSession}
      uploadedDoc={uploadedDoc}
      messages={messages}
      isStreaming={isStreaming}
      isProcessing={isProcessing}
      progressState={progressState}
      onFileSelected={handleFileSelected}
      onSelectSession={(id) => setActiveSessionId(id)}
      onNewChatForDocument={handleNewChatForDocument}
      onDeleteSession={handleDeleteSession}
      onDeleteDocument={handleDeleteDocument}
      onNewChatClick={() => {
        setActiveSessionId(null);
        setUploadedDoc(null);
        setMessages([]);
      }}
      onSendMessage={handleSendMessage}
      onStopStreaming={handleStopStreaming}
    />
  );
}
