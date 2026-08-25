import React from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  title: string;
  /** What the action will actually do, in plain words. */
  body?: React.ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  cancelLabel?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before something that cannot be taken back — money posted to the books, a vote
 * settled, a record removed. Deliberately not used for actions that open a form or
 * navigate: a prompt on everything teaches people to dismiss prompts, which costs most
 * on the one that mattered.
 */
export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  busyLabel,
  cancelLabel = 'Cancel',
  variant = 'dangerSolid',
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      // Clicking the backdrop backs out; clicking the card must not.
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-gray-800 font-semibold mb-1">{title}</p>
        {body && <p className="text-sm text-gray-500 mb-5">{body}</p>}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-4">{error}</p>
        )}

        <div className="flex gap-3">
          <Button className="flex-1" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm} disabled={busy}>
            {busy ? (busyLabel ?? 'Working...') : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
