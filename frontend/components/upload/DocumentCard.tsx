'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadResponse } from '@/types';
import { FileText, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { Badge } from '../common/Badge';

interface DocumentCardProps {
  uploadedDoc: UploadResponse;
  onClearDocument: () => void;
  onReplaceClick: () => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  uploadedDoc,
  onClearDocument,
  onReplaceClick,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onClearDocument();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full bg-[#171717] border border-white/[0.06] rounded-2xl p-6 space-y-5 shadow-sm select-none"
    >
      {/* Active Document Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
            <FileText className="w-5 h-5 text-white/80" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate max-w-[180px] heading-display" title={uploadedDoc.document_name}>
              {uploadedDoc.document_name}
            </h3>
            <p className="text-xs text-white/40">{uploadedDoc.total_pages} Pages Context</p>
          </div>
        </div>
        <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-[#D9FFD6]" />}>
          Indexed
        </Badge>
      </div>

      {/* Simplified Clean Document Info */}
      <div className="p-3 bg-[#1d1d1d] rounded-xl flex items-center justify-between text-xs font-mono">
        <span className="text-white/50">Status</span>
        <span className="text-[#D9FFD6] font-medium">● Indexed & Ready</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onReplaceClick}
          className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Replace</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          title="Remove Document"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </motion.div>
  );
};
