'use client';

import React from 'react';
import { UploadResponse } from '@/types';
import { FileText, Layers, Cpu, CheckCircle2, Clock, HardDrive } from 'lucide-react';
import { Badge } from '../common/Badge';

interface LiveSystemStatusProps {
  uploadedDoc: UploadResponse | null;
  isProcessing?: boolean;
}

export const LiveSystemStatus: React.FC<LiveSystemStatusProps> = ({
  uploadedDoc,
  isProcessing,
}) => {
  return (
    <div className="w-full bg-[#181818] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl select-none">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-white/80" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Live System Status
          </h3>
        </div>
        {uploadedDoc ? (
          <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-emerald-400" />}>
            Ready
          </Badge>
        ) : isProcessing ? (
          <Badge variant="warning" size="sm">
            Processing
          </Badge>
        ) : (
          <Badge variant="outline" size="sm" icon={<Clock className="w-3 h-3 text-white/50" />}>
            Waiting
          </Badge>
        )}
      </div>

      <div className="space-y-2.5 text-xs font-mono">
        <div className="flex items-center justify-between py-1 border-b border-white/5">
          <span className="text-white/50 flex items-center gap-1.5 font-sans">
            <FileText className="w-3.5 h-3.5 text-white/70" /> Document
          </span>
          <span className="text-white font-medium truncate max-w-[170px]" title={uploadedDoc?.document_name || 'Not Loaded'}>
            {uploadedDoc ? uploadedDoc.document_name : 'Not Loaded'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-white/5">
          <span className="text-white/50 flex items-center gap-1.5 font-sans">
            <FileText className="w-3.5 h-3.5 text-white/70" /> Total Pages
          </span>
          <span className="text-white font-medium">
            {uploadedDoc ? uploadedDoc.total_pages : '--'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-white/5">
          <span className="text-white/50 flex items-center gap-1.5 font-sans">
            <Layers className="w-3.5 h-3.5 text-white/70" /> Text Chunks
          </span>
          <span className="text-white font-medium">
            {uploadedDoc ? uploadedDoc.total_chunks : '--'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-white/5">
          <span className="text-white/50 flex items-center gap-1.5 font-sans">
            <Cpu className="w-3.5 h-3.5 text-white/70" /> Embeddings
          </span>
          <span className="text-white font-medium">
            {uploadedDoc ? 'bge-small-en-v1.5 (384d)' : '--'}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-white/50 flex items-center gap-1.5 font-sans">
            <Clock className="w-3.5 h-3.5 text-white/70" /> Index Status
          </span>
          <span className={uploadedDoc ? 'text-emerald-300 font-medium' : 'text-white/40'}>
            {uploadedDoc ? 'Indexed in Qdrant' : 'Waiting for PDF'}
          </span>
        </div>
      </div>
    </div>
  );
};
