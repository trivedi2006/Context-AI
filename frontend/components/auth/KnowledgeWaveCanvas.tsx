'use client';

import React, { useEffect, useRef } from 'react';

export const KnowledgeWaveCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener('resize', resize);
    resize();

    let t = 0;

    // Atmospheric knowledge nodes
    const particles = Array.from({ length: 20 }, () => ({
      xRatio: Math.random(),
      yRatio: Math.random() * 0.7 + 0.15,
      radius: Math.random() * 1.5 + 1,
      speed: Math.random() * 0.0004 + 0.0002,
      alpha: Math.random() * 0.35 + 0.15,
    }));

    const wavePath = (offsetY: number, amp: number, freq: number, phase: number) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = offsetY + Math.sin(x * freq + phase) * amp * Math.sin((x / Math.max(w, 1)) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    };

    const draw = () => {
      if (w > 0 && h > 0) {
        ctx.clearRect(0, 0, w, h);
        const baseY = h * 0.5;

        // Extremely subtle, atmospheric light waves
        const layers = [
          { amp: 18, freq: 0.004, width: 1.8, alpha: 0.4, blur: 6 },
          { amp: 28, freq: 0.0035, width: 3.5, alpha: 0.18, blur: 16 },
          { amp: 40, freq: 0.0028, width: 8, alpha: 0.08, blur: 30 },
          { amp: 55, freq: 0.0022, width: 16, alpha: 0.03, blur: 50 },
        ];

        layers.forEach((L) => {
          ctx.save();
          ctx.shadowBlur = L.blur;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
          ctx.strokeStyle = `rgba(255, 255, 255, ${L.alpha})`;
          ctx.lineWidth = L.width;
          wavePath(baseY, L.amp, L.freq, t * 0.3);
          ctx.stroke();
          ctx.restore();
        });

        // Floating particles / knowledge points
        particles.forEach((p) => {
          p.xRatio += p.speed;
          if (p.xRatio > 1) p.xRatio = 0;

          const x = p.xRatio * w;
          const waveY = baseY + Math.sin(x * 0.003 + t * 0.3) * 25 * Math.sin((x / Math.max(w, 1)) * Math.PI);
          const y = waveY + (p.yRatio - 0.5) * 60;

          ctx.save();
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        t += 0.008;
      }
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
    />
  );
};
