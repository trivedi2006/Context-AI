'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UploadResponse, ChatMessage, UploadProgressState, DocumentData } from '@/types';
import { ChatSessionData } from '@/services/chat';
import { SidebarLeft } from './SidebarLeft';
import { EmptyChatState } from '../chat/EmptyChatState';
import { ChatMessageItem } from '../chat/ChatMessageItem';
import { ChatInput } from '../chat/ChatInput';
import { PanelLeft, Loader2, FileCheck } from 'lucide-react';

interface ChatLayoutProps {
  documents: DocumentData[];
  sessions: ChatSessionData[];
  activeSessionId: string | null;
  activeSession: ChatSessionData | null;
  uploadedDoc: UploadResponse | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  isProcessing: boolean;
  progressState: UploadProgressState;
  onFileSelected: (file: File) => void;
  onSelectSession: (sessionId: string) => void;
  onNewChatForDocument: (documentId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onNewChatClick: () => void;
  onSendMessage: (question: string) => void;
  onStopStreaming: () => void;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  documents,
  sessions,
  activeSessionId,
  activeSession,
  uploadedDoc,
  messages,
  isStreaming,
  isProcessing,
  progressState,
  onFileSelected,
  onSelectSession,
  onNewChatForDocument,
  onDeleteSession,
  onDeleteDocument,
  onNewChatClick,
  onSendMessage,
  onStopStreaming,
}) => {
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const currentDocument = activeSession?.document || null;

  return (
    <div className="w-full h-full flex overflow-hidden relative font-sans bg-[#0f0f11] text-[#f3f3f5]">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Column 1: Left Sidebar Workspace */}
      <div className={`${showLeftSidebar ? 'flex' : 'hidden'} lg:flex`}>
        <SidebarLeft
          documents={documents}
          sessions={sessions}
          activeSessionId={activeSessionId}
          uploadedDoc={uploadedDoc}
          onSelectSession={onSelectSession}
          onNewChatForDocument={onNewChatForDocument}
          onDeleteSession={onDeleteSession}
          onDeleteDocument={onDeleteDocument}
          onNewChatUpload={triggerFilePicker}
          onToggleSidebar={() => setShowLeftSidebar(false)}
        />
      </div>

      {/* Column 2: Center Conversation Panel */}
      <div className="flex-1 h-full flex flex-col justify-between overflow-hidden relative bg-[#111114]">
        {/* Center Header */}
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/[0.08] bg-[#141417]/80 backdrop-blur-md shrink-0 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="text-xs font-semibold text-white font-['Space_Grotesk'] truncate">
                {currentDocument ? currentDocument.display_name : 'Context AI Workspace'}
              </span>

              {activeSession && (
                <>
                  <span className="text-white/30 text-xs">•</span>
                  <span className="text-xs text-white/70 font-normal truncate">
                    {activeSession.title}
                  </span>
                </>
              )}

              {currentDocument && (
                currentDocument.processing_status === 'processing' ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 animate-pulse shrink-0">
                    <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    {currentDocument.page_count} pgs Ready
                  </span>
                )
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-block text-[11px] font-mono text-white/40">
              Llama 3.3 70B Grounded QA
            </span>
          </div>
        </div>

        {/* Conversation Stream / Upload Notification State */}
        {messages.length > 0 ? (
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
            {messages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                onRegenerate={() => {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUserMsg) onSendMessage(lastUserMsg.content);
                }}
              />
            ))}
          </div>
        ) : (progressState.step === 'extracting' || progressState.step === 'chunking' || progressState.step === 'embedding' || progressState.step === 'indexing') ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="surface-card p-6 text-center space-y-3 max-w-sm border border-white/10">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white font-['Space_Grotesk']">PDF Uploaded Successfully</h3>
              <p className="text-xs text-white/50">Your document is ready. Ask any question below to begin!</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <EmptyChatState
              uploadedDoc={uploadedDoc}
              sessions={sessions}
              onSelectSession={onSelectSession}
              onNewChat={triggerFilePicker}
            />
          </div>
        )}

        {/* Floating Input Shell */}
        <div className="shrink-0 pt-2">
          <ChatInput
            onSendMessage={onSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={onStopStreaming}
            uploadedDoc={uploadedDoc}
            onUploadClick={triggerFilePicker}
          />
        </div>
      </div>
    </div>
  );
};
