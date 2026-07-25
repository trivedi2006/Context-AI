'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadResponse } from '@/types';
import { RefreshCw, Trash2 } from 'lucide-react';

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
      transition={{ duration: 0.3 }}
      className="doc-card-panel space-y-4 select-none"
    >
      {/* Top Header */}
      <div className="flex gap-3 items-start">
        <div className="w-[38px] h-[38px] rounded-xl flex-shrink-0 bg-gradient-to-br from-purple-500/25 to-pink-500/25 flex items-center justify-center text-lg">
          📄
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-white margin-0 truncate" title={uploadedDoc.document_name}>
            {uploadedDoc.document_name}
          </p>
          <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
            {uploadedDoc.total_pages} pages context
          </p>
        </div>
      </div>

      {/* Indexed Tag */}
      <div>
        <span className="indexed-tag">✓ Indexed</span>
      </div>

      {/* Status Row */}
      <div className="flex justify-between items-center text-xs text-[var(--text-dim)] border-t border-[var(--border)] pt-3.5 mt-1">
        <span>Status</span>
        <span className="text-[#7ee8c7] font-medium">● Indexed &amp; ready</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={onReplaceClick}
          className="flex-1 text-xs font-medium py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--panel-2)] text-[var(--text)] hover:border-white/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Replace</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 text-xs font-medium py-2 rounded-xl border border-pink-500/25 bg-pink-500/10 text-[#ff9bb8] hover:border-pink-500/40 hover:shadow-[0_0_18px_rgba(236,72,153,0.18)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </motion.div>
  );
};
