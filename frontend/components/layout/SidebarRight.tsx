'use client';

import React from 'react';
import { UploadResponse } from '@/types';
import { 
  FileText, Sparkles, Database, FileCheck, Layers, 
  HelpCircle, BookOpen, Clock, Tag, ChevronRight 
} from 'lucide-react';

interface SidebarRightProps {
  uploadedDoc: UploadResponse | null;
  onQuickAction?: (actionPrompt: string) => void;
  onToggleSidebar?: () => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  uploadedDoc,
  onQuickAction,
  onToggleSidebar,
}) => {
  const quickActions = [
    { label: 'Summarize Document', prompt: 'Provide a structured summary of this document with bullet points.' },
    { label: 'Key Takeaways', prompt: 'Extract the top 5 key takeaways and conclusions from this text.' },
    { label: 'List Important Dates', prompt: 'Extract all dates, timelines, and deadlines mentioned.' },
    { label: 'Extract Numbers & Amounts', prompt: 'List all financial numbers, invoice amounts, or numeric metrics.' },
    { label: 'Generate Interview Questions', prompt: 'Generate 5 key questions based on the core content of this PDF.' },
  ];

  return (
    <aside className="w-full lg:w-[280px] xl:w-[320px] h-full flex flex-col justify-between bg-[#141417] border-l border-white/[0.08] p-4 text-white select-none shrink-0 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 font-['Space_Grotesk']">
            Document Insights
          </h2>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current Document Summary Card */}
        {uploadedDoc ? (
          <div className="space-y-4">
            <div className="surface-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white shrink-0">
                  <FileText className="w-5 h-5 text-white/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate" title={uploadedDoc.document_name}>
                    {uploadedDoc.document_name}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Grounded RAG Active
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/[0.06] pt-3 text-xs">
                <div className="flex justify-between text-white/50">
                  <span>Page Count</span>
                  <span className="font-mono text-white/90">{uploadedDoc.total_pages} Pages</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Embedding Vector</span>
                  <span className="font-mono text-white/90">BAAI/bge-small (384d)</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>Vector Cluster</span>
                  <span className="font-mono text-white/90">Qdrant Cloud</span>
                </div>
                <div className="flex justify-between text-white/50">
                  <span>LLM Engine</span>
                  <span className="font-mono text-white/90">Llama 3.3 70B</span>
                </div>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2.5">
              <span className="text-[11px] uppercase tracking-wider text-white/40 font-semibold px-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-white/60" /> Quick Actions
              </span>

              <div className="space-y-1.5">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => onQuickAction?.(action.prompt)}
                    className="w-full text-left py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/90 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <span>{action.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="surface-card p-6 text-center space-y-3 text-white/40">
            <Database className="w-8 h-8 mx-auto text-white/20" />
            <p className="text-xs">No active document loaded.</p>
            <p className="text-[11px] text-white/30">Upload a PDF to view extracted document metadata and quick insights.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-[10px] text-white/30 font-mono text-center pt-4 border-t border-white/[0.06]">
        Context AI — Production RAG Engine v1.0
      </div>
    </aside>
  );
};
