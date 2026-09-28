import React from 'react';
import Logo from './Logo';

/**
 * The frame the signed-out pages share — brand, white card, one line of help beneath it.
 * Signing in, asking for a reset link and setting a new password are one journey that ends
 * back where it started, so they are not three different-looking screens.
 */
export default function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  /** The line under the card. Each page has its own way out of where it is. */
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo variant="dark" size="md" className="justify-center" />
          <p className="text-blue-200 mt-3 text-sm">Group savings, simplified.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>

        {footer && <p className="text-center text-blue-300 text-xs mt-6">{footer}</p>}
      </div>
    </div>
  );
}
