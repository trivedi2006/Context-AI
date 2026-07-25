'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadResponse, DocumentData } from '@/types';
import { ChatSessionData } from '@/services/chat';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Plus,
  MessageSquare,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  PanelLeftClose,
  Search,
  FolderOpen,
  LogOut,
  ChevronUp,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarLeftProps {
  documents: DocumentData[];
  sessions: ChatSessionData[];
  activeSessionId: string | null;
  uploadedDoc: UploadResponse | null;
  onSelectSession: (sessionId: string) => void;
  onNewChatForDocument: (documentId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onNewChatUpload: () => void;
  onToggleSidebar: () => void;
  onCloseMobileDrawer?: () => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  documents,
  sessions,
  activeSessionId,
  uploadedDoc,
  onSelectSession,
  onNewChatForDocument,
  onDeleteSession,
  onDeleteDocument,
  onNewChatUpload,
  onToggleSidebar,
  onCloseMobileDrawer,
}) => {
  const { user, logout } = useAuth();
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleExpand = (docId: string) => {
    setExpandedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
    onCloseMobileDrawer?.();
  };

  const handleNewChatForDocument = (documentId: string) => {
    onNewChatForDocument(documentId);
    onCloseMobileDrawer?.();
  };

  const handleNewChatUpload = () => {
    onNewChatUpload();
    onCloseMobileDrawer?.();
  };

  // Group sessions by document_id
  const sessionsByDoc: Record<string, ChatSessionData[]> = {};
  sessions.forEach((s) => {
    if (!sessionsByDoc[s.document_id]) {
      sessionsByDoc[s.document_id] = [];
    }
    sessionsByDoc[s.document_id].push(s);
  });

  const filteredDocs = documents.filter((doc) =>
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userName = user?.name || 'Daksh Trivedi';
  const userEmail = user?.email || 'daksh@contextai.com';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full md:w-72 h-full bg-[#0d0d0f] border-r border-white/[0.08] flex flex-col justify-between shrink-0 select-none overflow-hidden font-sans relative">
      {/* Header & Primary Action */}
      <div className="p-4 border-b border-white/[0.06] space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold text-sm text-white font-['Space_Grotesk'] tracking-wide">
              Context AI
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onCloseMobileDrawer ? (
              <button
                onClick={onCloseMobileDrawer}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center md:hidden"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors hidden md:block"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* New Document Chat Button */}
        <button
          onClick={handleNewChatUpload}
          className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-white text-black font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-white/5 hover:bg-white/90 active:scale-[0.98] transition-all cursor-pointer font-['Space_Grotesk']"
        >
          <Plus className="w-4 h-4" />
          <span>Upload PDF / New Chat</span>
        </button>

        {/* Workspace Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search documents & chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* Document & Conversation Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-mono text-white/40 uppercase tracking-wider">
          <span>Documents & Conversations</span>
          <span>{documents.length}</span>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-2 text-white/40">
            <FolderOpen className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs">No documents uploaded yet.</p>
            <p className="text-[11px]">Upload a PDF to start multi-chat sessions.</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExpanded = expandedDocs[doc.id] !== false;
            const docSessions = sessionsByDoc[doc.id] || [];
            const isProcessing = doc.processing_status === 'processing';

            return (
              <div key={doc.id} className="space-y-1 rounded-xl bg-white/[0.02] border border-white/[0.04] p-1.5">
                {/* Document Parent Node */}
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
                  <div
                    onClick={() => toggleExpand(doc.id)}
                    className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer py-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    )}
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white/90 truncate font-['Space_Grotesk']">
                        {doc.display_name || doc.filename}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-mono">
                        <span>{doc.page_count} pgs</span>
                        <span>•</span>
                        {isProcessing ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
                          </span>
                        ) : (
                          <span className="text-emerald-400">Ready</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions on Document */}
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleNewChatForDocument(doc.id)}
                      className="p-2 rounded text-white/60 hover:text-emerald-400 hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="New conversation for this document"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-2 rounded text-white/60 hover:text-red-400 hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Delete document and all conversations"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Nested Conversation List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="pl-5 space-y-0.5 overflow-hidden"
                    >
                      {docSessions.length === 0 ? (
                        <div className="py-1 px-3 text-[11px] text-white/30 italic">
                          No active chats
                        </div>
                      ) : (
                        docSessions.map((session) => {
                          const isActive = session.id === activeSessionId;
                          return (
                            <div
                              key={session.id}
                              onClick={() => handleSelectSession(session.id)}
                              className={`group/session flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-all min-h-[40px] ${
                                isActive
                                  ? 'bg-white/10 text-white font-medium shadow-sm'
                                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-white/30'}`} />
                                <span className="truncate">{session.title}</span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                                className="p-1.5 rounded text-white/40 hover:!text-red-400 hover:bg-white/10 transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                                title="Delete this conversation"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Profile & Signout Menu */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0d0d0f] shrink-0">
        <AnimatePresence>
          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-2 bg-[#18181b] border border-white/10 rounded-xl p-3 space-y-2.5 shadow-2xl overflow-hidden"
            >
              <div className="pb-2 border-b border-white/[0.08]">
                <p className="text-xs font-semibold text-white truncate font-['Space_Grotesk']">{userName}</p>
                <p className="text-[11px] text-white/50 truncate font-mono">{userEmail}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Authenticated Session</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onCloseMobileDrawer?.();
                  logout();
                }}
                className="w-full min-h-[40px] py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowProfileMenu((prev) => !prev)}
          className="w-full min-h-[44px] flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] transition-all cursor-pointer border border-white/[0.04] hover:border-white/10"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={userName}
                className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {userInitials}
              </div>
            )}
            <div className="text-xs text-left min-w-0">
              <p className="font-medium text-white/90 truncate max-w-[140px] font-['Space_Grotesk']">{userName}</p>
              <p className="text-[10px] text-white/40 truncate max-w-[140px] font-mono">{userEmail}</p>
            </div>
          </div>

          <ChevronUp className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${showProfileMenu ? 'rotate-180 text-emerald-400' : ''}`} />
        </button>
      </div>
    </div>
  );
};
