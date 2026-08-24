const BRAND_NAME = 'Saathi Bachat';

const FONT_STACK =
  "'Source Sans 3', 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif";

type LogoVariant = 'light' | 'dark';
type LogoSize = 'sm' | 'md' | 'lg';

/** Taken from the supplied artwork so the built lockup matches the original files. */
const PALETTE: Record<LogoVariant, { accent: string; mark: string; line1: string; line2: string }> = {
  light: { accent: '#C8322B', mark: '#1B3A8F', line1: '#1B3A8F', line2: '#16181C' },
  dark: { accent: '#E8952A', mark: '#93A9E8', line1: '#93A9E8', line2: '#FFFFFF' },
};

/** Mark height, wordmark size and the gap between them, matching the artwork's proportions. */
const SIZES: Record<LogoSize, { mark: number; text: number; gap: number }> = {
  sm: { mark: 33, text: 14, gap: 12 },
  md: { mark: 44, text: 18, gap: 16 },
  lg: { mark: 52, text: 20, gap: 20 },
};

/** The circular mark, inline so its colours can follow the variant. */
function Mark({ size, colors }: { size: number; colors: (typeof PALETTE)[LogoVariant] }) {
  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <circle cx="70" cy="18" r="11" fill={colors.accent} />
      <circle cx="115" cy="44" r="11" fill={colors.mark} />
      <circle cx="115" cy="96" r="11" fill={colors.mark} />
      <circle cx="70" cy="122" r="11" fill={colors.mark} />
      <circle cx="25" cy="96" r="11" fill={colors.mark} />
      <circle cx="25" cy="44" r="11" fill={colors.mark} />
      <circle cx="70" cy="70" r="18.5" fill="none" stroke={colors.mark} strokeWidth="3" />
      <text
        x="70"
        y="70"
        fill={colors.mark}
        fontFamily={FONT_STACK}
        fontSize="24"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
      >
        $
      </text>
    </svg>
  );
}

interface LogoProps {
  /**
   * The wordmark. Pass the group being acted in, so the logo names the group rather
   * than the product. Falls back to the product name where there is no group —
   * sign-in and sign-up, before any group is known.
   */
  text?: string | null;
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

/**
 * The lockup is assembled here rather than loaded as a flat image, because the wordmark
 * has to change with the active group. Building it also means the text uses the page's
 * own font — an SVG loaded through <img> is an isolated document and cannot.
 */
export default function Logo({ text, variant = 'light', size = 'md', className = '' }: LogoProps) {
  const colors = PALETTE[variant];
  const { mark, text: fontSize, gap } = SIZES[size];

  // Two stacked lines, as in the artwork: the first word carries the weight.
  const words = (text?.trim() || BRAND_NAME).split(/\s+/);
  const [first, ...rest] = words;
  const second = rest.join(' ');

  return (
    <div
      className={`flex items-center min-w-0 ${className}`}
      style={{ gap }}
      role="img"
      aria-label={words.join(' ')}
    >
      <Mark size={mark} colors={colors} />
      <div
        className="min-w-0"
        style={{ fontFamily: FONT_STACK, fontSize, lineHeight: 1.04, letterSpacing: '-0.024em' }}
      >
        <div className="truncate" style={{ color: colors.line1, fontWeight: 600 }}>
          {first}
        </div>
        {second && (
          <div className="truncate" style={{ color: colors.line2, fontWeight: 300 }}>
            {second}
          </div>
        )}
      </div>
    </div>
  );
}
