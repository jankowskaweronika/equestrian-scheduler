import { colors, radii, spacing, typography } from '@equestrian-scheduler/ui-tokens';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: spacing.lg,
        background: `radial-gradient(1100px 520px at 50% -10%, ${colors.primarySoft} 0%, ${colors.background} 55%)`,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, display: 'grid', gap: spacing.lg }}>
        <div style={{ display: 'grid', gap: spacing.md, justifyItems: 'center', textAlign: 'center' }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: radii.lg,
              background: colors.primary,
              color: colors.primaryContrast,
              fontWeight: 700,
              fontSize: typography.fontSize.lg,
            }}
          >
            ES
          </span>
          <div>
            <h1 style={{ margin: 0, fontSize: typography.fontSize.xl }}>
              Panel ośrodka jeździeckiego
            </h1>
            <p style={{ margin: `${spacing.xs}px 0 0`, color: colors.textMuted }}>
              Equestrian Scheduler
            </p>
          </div>
        </div>
        {children}
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: typography.fontSize.xs,
            color: colors.textMuted,
          }}
        >
          Kalendarzowy system rezerwacji dla ośrodków jeździeckich
        </p>
      </div>
    </main>
  );
}
