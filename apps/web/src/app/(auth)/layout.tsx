import { colors, spacing, typography } from '@equestrian-scheduler/ui-tokens';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: spacing.lg,
        background: colors.background,
      }}
    >
      <div style={{ width: '100%', maxWidth: 440, display: 'grid', gap: spacing.md }}>
        <div>
          <p style={{ margin: 0, color: colors.textMuted }}>Equestrian Scheduler</p>
          <h1 style={{ margin: `${spacing.xs}px 0 0`, fontSize: typography.fontSize.xl }}>
            Panel ośrodka jeździeckiego
          </h1>
        </div>
        {children}
      </div>
    </main>
  );
}
