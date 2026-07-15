import type { CSSProperties, ReactNode } from 'react';

import { colors, radii, spacing, typography } from '@equestrian-scheduler/ui-tokens';

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radii.lg,
        padding: spacing.lg,
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
}: {
  title: string;
  description?: string;
}) {
  return (
    <header style={{ marginBottom: spacing.lg }}>
      <h1 style={{ margin: 0, fontSize: typography.fontSize.xl }}>{title}</h1>
      {description ? (
        <p style={{ margin: `${spacing.sm}px 0 0`, color: colors.textMuted }}>{description}</p>
      ) : null}
    </header>
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
      <span style={{ fontSize: typography.fontSize.sm, color: colors.textMuted }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: `${spacing.sm}px ${spacing.md}px`,
  borderRadius: radii.md,
  border: `1px solid ${colors.border}`,
  fontSize: typography.fontSize.md,
  background: colors.surface,
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function Button({
  children,
  variant = 'primary',
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

  const color = variant === 'secondary' ? colors.text : '#fff';

  return (
    <button
      {...props}
      style={{
        padding: `${spacing.sm}px ${spacing.md}px`,
        borderRadius: radii.md,
        border: variant === 'secondary' ? `1px solid ${colors.border}` : 'none',
        background,
        color,
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

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      style={{
        color: colors.danger,
        background: colors.dangerMuted,
        padding: spacing.sm,
        borderRadius: radii.sm,
        margin: 0,
      }}
    >
      {message}
    </p>
  );
}

export function SuccessMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      style={{
        color: colors.success,
        background: colors.successMuted,
        padding: spacing.sm,
        borderRadius: radii.sm,
        margin: 0,
      }}
    >
      {message}
    </p>
  );
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
