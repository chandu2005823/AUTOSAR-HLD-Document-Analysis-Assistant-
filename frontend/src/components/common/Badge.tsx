import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'cyan';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'md',
  className,
  icon,
}) => {
  const variantStyles = {
    blue: 'bg-blue-500/20 text-blue-300 border-2 border-blue-500/40 shadow-sm',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/40 shadow-sm',
    amber: 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/40 shadow-sm',
    rose: 'bg-rose-500/20 text-rose-300 border-2 border-rose-500/40 shadow-sm',
    purple: 'bg-purple-500/20 text-purple-300 border-2 border-purple-500/40 shadow-sm',
    slate: 'bg-slate-700/50 text-slate-200 border-2 border-slate-600/50 shadow-sm',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500/40 shadow-sm',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-1 rounded-full font-bold tracking-wide',
    md: 'text-xs px-3 py-1.5 rounded-full font-bold tracking-wide',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
