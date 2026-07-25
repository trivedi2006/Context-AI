'use client';

import React from 'react';
import { HealthStatus } from '@/types';
import { Cpu, Database, Server, Activity } from 'lucide-react';

interface FooterStatusBarProps {
  health: HealthStatus | null;
}

export const FooterStatusBar: React.FC<FooterStatusBarProps> = ({ health }) => {
  const isBackendOk = health?.backend === 'connected';
  const isGroqOk = health?.groq.status === 'connected';
  const isQdrantOk = health?.qdrant.status === 'connected';

  return (
    <footer className="h-9 w-full px-6 bg-[#111111] border-t border-white/[0.08] flex items-center justify-between text-xs text-white/50 font-mono select-none relative z-40">
      {/* Left: Health Indicators */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Server className="w-3 h-3 text-white/60" />
          <span>API:</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isBackendOk ? 'bg-[#D9FFD6]' : 'bg-rose-500'}`} />
        </div>

        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-indigo-400/80" />
          <span>Groq:</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isGroqOk ? 'bg-[#D9FFD6]' : 'bg-rose-500'}`} />
        </div>

        <div className="flex items-center gap-1.5">
          <Database className="w-3 h-3 text-cyan-400/80" />
          <span>Qdrant:</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isQdrantOk ? 'bg-[#D9FFD6]' : 'bg-rose-500'}`} />
        </div>
      </div>

      {/* Center: Collection Metadata */}
      <div className="hidden sm:flex items-center gap-3 text-[11px] text-white/40">
        <span>Collection: projectbrain_v1_docs</span>
        <span>•</span>
        <span>Dense Vector: 384d</span>
      </div>

      {/* Right: Latency & Version */}
      <div className="flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Ready</span>
        </div>
        <span>v1.0.0</span>
      </div>
    </footer>
  );
};
