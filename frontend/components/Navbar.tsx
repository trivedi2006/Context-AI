'use client';

import React from 'react';
import { HealthStatus, UploadResponse } from '@/types';
import { Brain, Cpu, Database, Trash2, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface NavbarProps {
  health: HealthStatus | null;
  uploadedDoc: UploadResponse | null;
  onClearDocument: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, uploadedDoc, onClearDocument }) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ProjectBrain <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">v1.0</span>
            </h1>
            <p className="text-xs text-slate-400">Production-Ready Single-PDF Grounded RAG</p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-4">
          {/* Service Health Pills */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50">
              <span className="text-slate-400">Backend:</span>
              <span className={`w-2 h-2 rounded-full ${health?.backend === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Groq:</span>
              <span className={`w-2 h-2 rounded-full ${health?.groq.status === 'ok' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Qdrant:</span>
              <span className={`w-2 h-2 rounded-full ${health?.qdrant.status === 'ok' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            </div>
          </div>

          {/* Active Document Badge / Reset Button */}
          {uploadedDoc && (
            <div className="flex items-center gap-3 bg-blue-950/40 border border-blue-800/40 rounded-lg px-3 py-1.5">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-200 font-medium max-w-[150px] truncate" title={uploadedDoc.document_name}>
                {uploadedDoc.document_name}
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                {uploadedDoc.total_pages} pgs
              </span>
              <button
                onClick={onClearDocument}
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                title="Remove Document & Clear Vectors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
