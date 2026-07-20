'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, ArrowUp, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isProcessing?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndSelect = (file: File) => {
    setErrorMessage(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Only PDF documents (.pdf) are supported.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit.');
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        whileHover={{ y: -1, backgroundColor: '#1d1d1d' }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full min-h-[300px] h-full flex flex-col items-center justify-center p-8 rounded-2xl border border-white/[0.06] bg-[#171717] cursor-pointer transition-all duration-300 relative select-none ${
          isDragOver ? 'bg-[#232323] border-white/20' : ''
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      >
        {/* Large Upload Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-white shadow-sm">
          <UploadCloud className="w-8 h-8 text-white/80" />
        </div>

        {/* Minimal Instructions */}
        <h3 className="text-base font-semibold text-white tracking-tight mb-1 heading-display">
          Upload PDF
        </h3>
        <p className="text-xs text-white/50 text-center mb-6 font-normal">
          Drag & Drop
        </p>

        {/* Browse Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            !isProcessing && fileInputRef.current?.click();
          }}
          className="px-5 py-2.5 rounded-xl bg-white text-black font-medium text-xs hover:bg-white/90 transition-all flex items-center gap-2 shadow-sm"
        >
          <span>Browse Files</span>
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        {/* Specs Specs */}
        <div className="mt-8 text-[11px] font-mono text-white/38 tracking-wide">
          PDF • 25MB Max
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="absolute bottom-4 left-4 right-4 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
