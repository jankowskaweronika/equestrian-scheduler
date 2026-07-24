import type { CSSProperties, ReactNode } from 'react';

import { colors, radii, shadows, spacing, typography } from '@equestrian-scheduler/ui-tokens';

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        padding: spacing.lg,
        boxShadow: shadows.sm,
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      style={{
        marginBottom: spacing.xl,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: typography.fontSize.xxl }}>{title}</h1>
        {description ? (
          <p
            style={{
              margin: `${spacing.sm}px 0 0`,
              color: colors.textMuted,
              maxWidth: 620,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: spacing.sm }}>{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        margin: `0 0 ${spacing.md}px`,
        fontSize: typography.fontSize.lg,
      }}
    >
      {children}
    </h2>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'grid', gap: spacing.xs }}>
      <span
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: 600,
          color: colors.text,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: `10px ${spacing.md}px`,
  borderRadius: radii.md,
  border: `1px solid ${colors.border}`,
  fontSize: typography.fontSize.md,
  background: colors.surface,
  color: colors.text,
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, minHeight: 96, resize: 'vertical', ...props.style }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', ...props.style }}
    />
  );
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : colors.surfaceMuted;

  const color = variant === 'secondary' ? colors.text : colors.primaryContrast;

  return (
    <button
      {...props}
      className={[`es-btn`, `es-btn--${variant}`, className].filter(Boolean).join(' ')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        padding: `10px ${spacing.md}px`,
        borderRadius: radii.md,
        border: variant === 'secondary' ? `1px solid ${colors.border}` : '1px solid transparent',
        background,
        color,
        fontSize: typography.fontSize.sm,
        fontWeight: 600,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', margin: `0 -${spacing.xs}px` }}>
      <table className="es-table">{children}</table>
    </div>
  );
}

const badgeTones = {
  neutral: { bg: colors.surfaceMuted, color: colors.textMuted },
  primary: { bg: colors.primarySoft, color: colors.primaryHover },
  success: { bg: colors.successMuted, color: colors.success },
  danger: { bg: colors.dangerMuted, color: colors.danger },
  warning: { bg: colors.warningMuted, color: colors.warning },
} as const;

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: keyof typeof badgeTones;
}) {
  const { bg, color } = badgeTones[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `2px ${spacing.sm}px`,
        borderRadius: radii.full,
        background: bg,
        color,
        fontSize: typography.fontSize.xs,
        fontWeight: 600,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        padding: `${spacing.lg}px 0`,
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: typography.fontSize.sm,
      }}
    >
      {children}
    </p>
  );
}

function Banner({
  message,
  color,
  background,
}: {
  message: string;
  color: string;
  background: string;
}) {
  return (
    <p
      style={{
        color,
        background,
        padding: `10px ${spacing.md}px`,
        borderRadius: radii.md,
        borderLeft: `3px solid ${color}`,
        fontSize: typography.fontSize.sm,
        fontWeight: 500,
        margin: 0,
      }}
    >
      {message}
    </p>
  );
}

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Banner message={message} color={colors.danger} background={colors.dangerMuted} />;
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Banner message={message} color={colors.success} background={colors.successMuted} />;
}

export const ROLE_LABELS = {
  manager: 'Manager',
  instructor: 'Instruktor',
  client: 'Klient',
  boarder: 'Pensjonariusz',
  product_admin: 'Admin produktu',
} as const;

export const RESOURCE_TYPE_LABELS = {
  indoor: 'Hala',
  outdoor_arena: 'Ujeżdżalnia',
  other: 'Inne',
} as const;

export const FACILITY_EVENT_KIND_LABELS = {
  public_event: 'Wydarzenie',
  maintenance: 'Praca techniczna',
} as const;
