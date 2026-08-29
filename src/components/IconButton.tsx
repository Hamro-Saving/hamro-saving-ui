import React from 'react';
import Button from './Button';

export type IconName = 'edit' | 'delete' | 'resend' | 'verify' | 'deactivate' | 'activate';

/** Outline glyphs, drawn on a 24x24 grid. Some need more than one path. */
const PATHS: Record<IconName, string[]> = {
  edit: ['M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'],
  resend: ['M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'],
  delete: ['M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'],
  verify: ['M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'],
  /** Barred: out of the group, but still on the books. */
  deactivate: ['M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'],
  /** Put back the way it was. */
  activate: ['M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'],
};

type Variant = React.ComponentProps<typeof Button>['variant'];

/**
 * What each action looks like, decided once. These read as a set — the same green for
 * anything that confirms, the same red for anything that takes away — so a person meets one
 * design per action wherever in the app it appears, rather than one per page that wrote it.
 *
 * Green for verify deliberately matches the "Verified" badge it produces; blue is reserved
 * for a page's own main action, which is a different thing entirely.
 */
const DEFAULT_VARIANTS: Partial<Record<IconName, Variant>> = {
  verify: 'success',
  activate: 'success',
  delete: 'danger',
  deactivate: 'danger',
  resend: 'warning',
};

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /**
   * Names the action. Nothing is written on the button, so this carries the whole meaning:
   * it becomes the hover tooltip and the accessible name.
   */
  label: string;
  /** Only where an action needs to read differently from its usual self. */
  variant?: Variant;
}

/**
 * A compact action for a table or card row, where the same few actions repeat on every
 * line and their labels become noise. Reserved for those: anything a person meets once —
 * a dialog's buttons, a page's main action — keeps its words.
 */
export default function IconButton({ icon, label, variant, ...props }: IconButtonProps) {
  return (
    <Button {...props} variant={variant ?? DEFAULT_VARIANTS[icon]} size="icon" title={label} aria-label={label}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {PATHS[icon].map(d => (
          <path key={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
        ))}
      </svg>
    </Button>
  );
}
