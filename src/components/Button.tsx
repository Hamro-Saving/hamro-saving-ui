import React from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'dangerSolid';
type Size = 'sm' | 'md' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white border border-transparent hover:bg-blue-700',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  success: 'bg-emerald-600 text-white border border-transparent hover:bg-emerald-700',
  // Pairs with the amber "Invite pending" badge, so the action reads as belonging to it.
  warning: 'bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100',
  danger: 'bg-white text-rose-700 border border-rose-300 hover:bg-rose-50',
  dangerSolid: 'bg-rose-600 text-white border border-transparent hover:bg-rose-700',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  /** Square, for a button whose whole content is a glyph. */
  icon: 'p-1.5',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({ variant = 'secondary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:opacity-60 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}
