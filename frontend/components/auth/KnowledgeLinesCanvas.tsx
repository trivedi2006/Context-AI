'use client';

import React, { useEffect, useRef } from 'react';

export const KnowledgeLinesCanvas: React.FC = () => {
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

    // Position lines above (0.22) and below (0.78) the central text area so text sits cleanly between them
    const strands = [
      { yBase: 0.22, amp: 0.05, freq: 1.2, speed: 0.08, tilt: -0.08, width: 1.4, glow: 0.85 },
      { yBase: 0.78, amp: 0.05, freq: 1.5, speed: 0.12, tilt: -0.06, width: 1.2, glow: 0.75 },
      { yBase: 0.90, amp: 0.04, freq: 1.0, speed: 0.06, tilt: 0.04, width: 0.9, glow: 0.4 },
    ];

    const strandY = (s: typeof strands[0], x: number, t: number) => {
      const nx = x / Math.max(w, 1);
      const base = s.yBase * h + nx * s.tilt * h;
      return base + Math.sin(nx * Math.PI * s.freq + t * s.speed) * s.amp * h * Math.sin(nx * Math.PI);
    };

    let particles: Array<{ x: number; strand: number; speed: number; r: number; phase: number }> = [];
    let dots: Array<{ x: number; y: number; r: number; base: number; phase: number; speed: number; driftY: number }> = [];

    const seedDots = () => {
      if (w === 0 || h === 0) return;
      const count = Math.round((w * h) / 9000);
      dots = [];
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.5 + Math.random() * 1.3,
          base: 0.05 + Math.random() * 0.16,
          phase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.5,
          driftY: 4 + Math.random() * 10,
        });
      }

      particles = [];
      for (let i = 0; i < 26; i++) {
        particles.push({
          x: Math.random() * w,
          strand: 0,
          speed: 0.15 + Math.random() * 0.3,
          r: 1 + Math.random() * 1.6,
          phase: Math.random() * 10,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedDots();
    };

    window.addEventListener('resize', resize);
    resize();

    let t = 0;

    const draw = () => {
      if (w > 0 && h > 0) {
        ctx.clearRect(0, 0, w, h);

        // Dot field (drawn first, behind strands)
        dots.forEach((d) => {
          const twinkle = (Math.sin(t * d.speed + d.phase) + 1) / 2;
          const y = d.y + Math.sin(t * 0.15 + d.phase) * d.driftY;
          ctx.beginPath();
          ctx.arc(d.x, y, d.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${d.base + twinkle * 0.16})`;
          ctx.shadowBlur = 2.5;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
          ctx.fill();
        });

        // Layered glow strokes for flowing strands
        strands.forEach((s) => {
          const layers = [
            { w: s.width * 8, a: 0.03 * s.glow, blur: 34 },
            { w: s.width * 4, a: 0.06 * s.glow, blur: 18 },
            { w: s.width * 1.6, a: 0.5 * s.glow, blur: 4 },
            { w: s.width * 0.8, a: 0.9 * s.glow, blur: 0.5 },
          ];
          layers.forEach((L) => {
            ctx.beginPath();
            for (let x = 0; x <= w; x += 6) {
              const y = strandY(s, x, t);
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(223, 230, 238, ${L.a})`;
            ctx.lineWidth = L.w;
            ctx.shadowBlur = L.blur;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.stroke();
          });
        });

        // Drifting particles along top strand
        particles.forEach((p) => {
          p.x += p.speed;
          if (p.x > w + 20) p.x = -20;
          const s = strands[0];
          const y = strandY(s, p.x, t) + Math.sin(t * 0.5 + p.phase) * 3;
          const pulse = (Math.sin(t * 0.8 + p.phase) + 1) / 2;
          ctx.beginPath();
          ctx.arc(p.x, y, p.r + pulse * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + pulse * 0.4})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();
        });

        t += 0.01;
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
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
