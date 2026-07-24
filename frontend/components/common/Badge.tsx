'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
}) => {
  const baseStyle = 'inline-flex items-center gap-1.5 font-mono tracking-tight rounded-full border transition-all';
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    default: 'bg-white/5 text-white/80 border-white/10',
    success: 'bg-[#D9FFD6]/10 text-[#D9FFD6] border-[#D9FFD6]/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    error: 'bg-[#FFD8D8]/10 text-[#FFD8D8] border-[#FFD8D8]/30',
    outline: 'bg-transparent text-white/65 border-white/15 hover:border-white/30',
  };

  return (
    <span className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {icon}
      {children}
    </span>
  );
};
