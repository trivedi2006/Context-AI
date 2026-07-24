'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UploadResponse, HealthStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { UserDropdown } from '../auth/UserDropdown';
import { FileText, LogIn } from 'lucide-react';
import { Badge } from '../common/Badge';

interface NavbarProps {
  health: HealthStatus | null;
  uploadedDoc: UploadResponse | null;
  isProcessing?: boolean;
  onOpenAuth?: () => void;
  onLogoClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, uploadedDoc, isProcessing, onOpenAuth, onLogoClick }) => {
  const { user } = useAuth();
  const isBackendOk = health?.backend === 'ok';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="h-[60px] sm:h-[68px] w-full px-3 sm:px-6 flex items-center justify-between border-b border-white/[0.06] bg-[#111111]/80 backdrop-blur-md relative z-40 select-none"
    >
      {/* Left: Logo & Product Name */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-2 sm:gap-3 hover:opacity-85 transition-opacity cursor-pointer text-left border-none bg-transparent p-0 outline-none"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
          <svg
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs sm:text-sm tracking-tight text-white heading-display">Context AI</span>
          <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/60">
            AI Workspace
          </span>
        </div>
      </button>

      {/* Center: Soft Connection Status Indicator */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[#171717]">
        <span
          className={`w-2 h-2 rounded-full transition-all ${
            isProcessing
              ? 'bg-amber-400 animate-pulse'
              : isBackendOk
              ? 'bg-[#D9FFD6]'
              : 'bg-rose-500'
          }`}
        />
        <span className="text-xs font-mono text-white/60">
          {isProcessing ? '● Processing' : isBackendOk ? '● Ready' : '● Offline'}
        </span>
      </div>

      {/* Right: Active Document Indicator & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {uploadedDoc ? (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/5 border border-white/10 max-w-[140px] sm:max-w-[200px]">
            <FileText className="w-3.5 h-3.5 text-white/60 shrink-0" />
            <span className="text-[11px] sm:text-xs text-white/80 truncate">{uploadedDoc.document_name}</span>
            <Badge variant="success" size="sm" className="hidden sm:inline-flex">
              {uploadedDoc.total_pages} pgs
            </Badge>
          </div>
        ) : (
          <div className="hidden sm:block">
            <Badge variant="outline" size="sm">
              No Document
            </Badge>
          </div>
        )}

        {/* User Account / Auth Button */}
        {user ? (
          <UserDropdown />
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white text-black text-xs font-medium hover:bg-white/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </motion.header>
  );
};
