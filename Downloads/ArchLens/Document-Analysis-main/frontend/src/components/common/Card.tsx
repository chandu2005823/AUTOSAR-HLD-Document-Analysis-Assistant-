import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-900/70 border border-slate-800/80 shadow-md',
    elevated: 'bg-[#151E2F] border border-slate-700/60 shadow-xl',
    glass: 'bg-slate-900/40 backdrop-blur-md border border-slate-700/40 shadow-lg',
    interactive:
      'bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-850/80 transition-all duration-200 cursor-pointer shadow-md hover:shadow-blue-500/5',
  };

  return (
    <div
      className={clsx('rounded-2xl p-5', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};
