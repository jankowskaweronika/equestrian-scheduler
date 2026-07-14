import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { colors, typography } from '@equestrian-scheduler/ui-tokens';
import './globals.css';

export const metadata: Metadata = {
  title: 'Equestrian Scheduler',
  description: 'Calendar-first scheduling for equestrian centers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        style={{
          fontFamily: typography.fontFamily,
          color: colors.text,
          background: colors.background,
        }}
      >
        {children}
      </body>
    </html>
  );
}
