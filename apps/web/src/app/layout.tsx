import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { colors, radii, shadows, typography } from '@equestrian-scheduler/ui-tokens';
import './globals.css';

export const metadata: Metadata = {
  title: 'Equestrian Scheduler',
  description: 'Calendar-first scheduling for equestrian centers',
};

// Expose design tokens as CSS custom properties so global CSS (hover, focus,
// tables) and inline component styles share a single source of truth.
const cssVariables = `:root {
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-surface-muted: ${colors.surfaceMuted};
  --color-border: ${colors.border};
  --color-border-strong: ${colors.borderStrong};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-primary: ${colors.primary};
  --color-primary-hover: ${colors.primaryHover};
  --color-primary-soft: ${colors.primarySoft};
  --color-focus-ring: ${colors.focusRing};
  --font-xs: ${typography.fontSize.xs}px;
  --font-sm: ${typography.fontSize.sm}px;
  --font-md: ${typography.fontSize.md}px;
  --font-lg: ${typography.fontSize.lg}px;
  --font-xl: ${typography.fontSize.xl}px;
  --radius-sm: ${radii.sm}px;
  --radius-md: ${radii.md}px;
  --radius-lg: ${radii.lg}px;
  --shadow-xs: ${shadows.xs};
  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};
}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize.md,
          color: colors.text,
          background: colors.background,
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
