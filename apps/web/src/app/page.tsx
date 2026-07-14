import { canManageOrganization } from '@equestrian-scheduler/domain';
import { colors, spacing, typography } from '@equestrian-scheduler/ui-tokens';

export default function HomePage() {
  const isManagerView = canManageOrganization('manager');

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: spacing.xl,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
      }}
    >
      <header>
        <p style={{ color: colors.textMuted, margin: 0 }}>Equestrian Scheduler</p>
        <h1 style={{ margin: `${spacing.sm}px 0 0`, fontSize: typography.fontSize.xxl }}>
          Kalendarz ośrodka jeździeckiego
        </h1>
      </header>

      <section
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: spacing.lg,
          maxWidth: 720,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: typography.fontSize.lg }}>Etap 0 ukończony</h2>
        <p style={{ lineHeight: typography.lineHeight.relaxed }}>
          Monorepo jest gotowe. Kolejny krok to migracje Supabase, RLS i widok kalendarza z
          kolumnami per zasób.
        </p>
        <p style={{ color: colors.textMuted }}>
          Manager view enabled: <strong>{isManagerView ? 'yes' : 'no'}</strong>
        </p>
      </section>
    </main>
  );
}
