import React from 'react';

type Variant = 'light' | 'dark';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  light: 'bg-white border-gray-300 text-gray-800 hover:border-gray-400',
  /** For the sidebar and anything else sitting on a dark panel. */
  dark: 'bg-gray-800 border-gray-700 text-white hover:border-gray-600',
};

const SIZES: Record<Size, string> = {
  sm: 'pl-2.5 pr-8 py-1.5 text-xs',
  md: 'pl-3 pr-9 py-2 text-sm',
};

const CHEVRON: Record<Size, string> = {
  sm: 'right-2 w-3.5 h-3.5',
  md: 'right-3 w-4 h-4',
};

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  variant?: Variant;
  size?: Size;
  /** Applied to the wrapper, so `w-full` and spacing behave as they would on a bare select. */
  className?: string;
}

/**
 * The app's dropdown. Native selects render their own arrow in whatever style the OS
 * dictates, which is why the same control looked different on every screen; the arrow is
 * suppressed and drawn here instead so every dropdown matches, on every platform.
 */
export default function Select({
  variant = 'light',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: SelectProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      <select
        {...props}
        disabled={disabled}
        className={`
          w-full appearance-none rounded-lg border font-medium transition
          focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
          disabled:opacity-60 disabled:cursor-not-allowed
          ${VARIANTS[variant]} ${SIZES[size]}
        `}
      >
        {children}
      </select>

      {/* Decorative: the select underneath still owns all interaction. */}
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400 ${CHEVRON[size]} ${disabled ? 'opacity-50' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
