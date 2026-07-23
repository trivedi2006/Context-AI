'use client';

import React, { useEffect, useRef } from 'react';

interface ConstellationCanvasProps {
  onTiltChange?: (x: number, y: number) => void;
}

export const ConstellationCanvas: React.FC<ConstellationCanvasProps> = ({ onTiltChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: 0, y: 0 };
    let width = 0;
    let height = 0;
    let points: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      speed: number;
      hue: number;
    }> = [];
    let animationFrame: number | null = null;

    function resize() {
      const canvasEl = canvasRef.current;
      if (!canvasEl || !ctx) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvasEl.parentElement?.offsetWidth || window.innerWidth;
      height = canvasEl.parentElement?.offsetHeight || window.innerHeight;
      
      canvasEl.width = Math.floor(width * ratio);
      canvasEl.height = Math.floor(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildPoints();
    }

    function buildPoints() {
      const count = Math.round(Math.min(116, Math.max(62, width / 13)));
      points = Array.from({ length: count }, (_, index) => {
        const lane = index % 4;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 1 + 0.2,
          size: Math.random() * 1.6 + 0.7,
          speed: 0.14 + lane * 0.025 + Math.random() * 0.12,
          hue: lane
        };
      });
    }

    function drawPoint(point: typeof points[0]) {
      if (!ctx) return { px: 0, py: 0 };
      const depth = 1 / point.z;
      const px = (point.x - width / 2) * depth + width / 2 + pointer.x * (32 * point.z);
      const py = (point.y - height / 2) * depth + height / 2 + pointer.y * (22 * point.z);
      const colors = ['#65f4a6', '#ffcc63', '#ff6b4a', '#69e7e2'];

      ctx.beginPath();
      ctx.arc(px, py, point.size * depth, 0, Math.PI * 2);
      ctx.fillStyle = colors[point.hue];
      ctx.globalAlpha = 0.26 + point.z * 0.28;
      ctx.fill();
      ctx.globalAlpha = 1;
      return { px, py };
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const projected = points.map((point) => {
        point.y += point.speed;
        point.x += Math.sin(point.y * 0.008) * 0.18;

        if (point.y > height + 40) {
          point.y = -40;
          point.x = Math.random() * width;
          point.z = Math.random() * 1 + 0.2;
        }

        return drawPoint(point);
      });

      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i += 1) {
        for (let j = i + 1; j < projected.length; j += 1) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.px - b.px;
          const dy = a.py - b.py;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 96) {
            ctx.globalAlpha = (1 - distance / 96) * 0.16;
            ctx.strokeStyle = '#fbf7ef';
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrame = requestAnimationFrame(animate);
    }

    function updatePointer(event: PointerEvent) {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      pointer.x = x;
      pointer.y = y;

      if (onTiltChange && !prefersReducedMotion.matches) {
        onTiltChange(x, y);
      }
    }

    resize();
    if (!prefersReducedMotion.matches) {
      animate();
      window.addEventListener('pointermove', updatePointer);
    } else {
      points.forEach(drawPoint);
    }

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', updatePointer);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [onTiltChange]);

  return (
    <canvas
      ref={canvasRef}
      id="constellation"
      className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  );
};
