'use client';

import React, { useState, useRef } from 'react';
import { UploadResponse } from '@/types';
import { uploadPDF } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileUp, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, Layers, Cpu } from 'lucide-react';

interface UploadAreaProps {
  onUploadSuccess: (response: UploadResponse) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file (.pdf)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds maximum limit of 25MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Extracting PDF text & metadata...');

    try {
      setTimeout(() => setUploadProgress('Generating 500-char chunks & metadata...'), 800);
      setTimeout(() => setUploadProgress('Computing BAAI/bge-small-en embeddings locally...'), 1600);
      setTimeout(() => setUploadProgress('Upserting vectors into Qdrant Cloud...'), 2400);

      const response = await uploadPDF(file);
      onUploadSuccess(response);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to upload and process PDF file.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative glass-card rounded-2xl p-8 border-2 border-dashed transition-all duration-300 text-center ${
          isDragging
            ? 'border-blue-500 bg-blue-950/20 shadow-2xl shadow-blue-500/20 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-4">
          {isUploading ? (
            <div className="py-6 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin flex items-center justify-center" />
                <Cpu className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-blue-300 font-medium animate-pulse">{uploadProgress}</p>
              <div className="text-xs text-slate-500 font-mono">PyMuPDF → BGE Small → Qdrant Cloud</div>
            </div>
          ) : (
            <>
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileUp className="h-8 w-8 text-blue-400" />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-slate-100">Upload your PDF Document</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Drag and drop a PDF file here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-4"
                  >
                    browse computer
                  </button>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-800/80 w-full justify-center">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Single PDF only</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Max size 25MB</span>
                <span>•</span>
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Local BGE Embeddings</span>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 flex items-start gap-3 text-sm"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Upload Error</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
