'use client';

import React from 'react';
import { UploadResponse, HealthStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { UserDropdown } from '../auth/UserDropdown';
import { LogIn } from 'lucide-react';

interface NavbarProps {
  health: HealthStatus | null;
  uploadedDoc: UploadResponse | null;
  isProcessing?: boolean;
  onOpenAuth?: () => void;
  onLogoClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, uploadedDoc, isProcessing, onOpenAuth, onLogoClick }) => {
  const { user } = useAuth();
  const isBackendOk = health?.backend === 'connected';

  return (
    <header className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-[var(--border)] bg-[#0f0f1a]/70 backdrop-blur-xl sticky top-0 z-50">
      {/* Left: Logo & Product Title */}
      <button
        onClick={onLogoClick}
        className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer border-none bg-transparent p-0 text-left outline-none"
      >
        <div className="logo-mark">C</div>
        <div className="flex items-center gap-1.5">
          <h1 className="font-['Space_Grotesk'] text-base font-semibold tracking-wide text-white m-0">Context AI</h1>
          <span className="badge-pill hidden sm:inline-block">AI workspace</span>
        </div>
      </button>

      {/* Center: Live Pulse Indicator */}
      <div className="status-live font-sans">
        <span className="dot-live" />
        <span className="text-xs text-[var(--text-dim)] font-medium">
          {isProcessing ? 'Processing...' : isBackendOk ? 'Live' : 'Connecting...'}
        </span>
      </div>

      {/* Right: Active Document & User Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {uploadedDoc ? (
          <div className="file-chip">
            <span className="truncate max-w-[130px] sm:max-w-[180px]">📄 {uploadedDoc.document_name}</span>
            <span className="text-[#c9a9ff] font-mono text-[11px]">{uploadedDoc.total_pages} pgs</span>
          </div>
        ) : (
          <div className="file-chip hidden sm:flex text-xs text-[var(--text-faint)]">
            No document loaded
          </div>
        )}

        {/* User Account / Auth Dropdown */}
        {user ? (
          <UserDropdown />
        ) : (
          <button
            onClick={onOpenAuth}
            className="avatar-circle border-none cursor-pointer font-semibold shadow-md hover:scale-105 transition-transform"
            title="Sign In"
          >
            {user ? (user as any).name?.[0]?.toUpperCase() : <LogIn className="w-3.5 h-3.5 text-[#0a0a12]" />}
          </button>
        )}
      </div>
    </header>
  );
};
