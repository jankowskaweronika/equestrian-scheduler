export const SUBSCRIPTION_STATUS_LABELS = {
  trial: 'Okres próbny',
  active: 'Aktywna',
  past_due: 'Zaległa',
  cancelled: 'Anulowana',
} as const;

export const BILLING_CYCLE_LABELS = {
  monthly: 'Miesięcznie',
  yearly: 'Rocznie',
} as const;

export type SubscriptionStatusKey = keyof typeof SUBSCRIPTION_STATUS_LABELS;
export type BillingCycleKey = keyof typeof BILLING_CYCLE_LABELS;

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning';

export function subscriptionStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'active':
      return 'success';
    case 'past_due':
      return 'danger';
    case 'trial':
      return 'primary';
    default:
      return 'neutral';
  }
}

export type OrganizationLifecycle = {
  label: string;
  tone: BadgeTone;
};

export function organizationLifecycle(org: {
  archived_at: string | null;
  suspended_at: string | null;
}): OrganizationLifecycle {
  if (org.archived_at) {
    return { label: 'Zarchiwizowany', tone: 'neutral' };
  }
  if (org.suspended_at) {
    return { label: 'Zawieszony', tone: 'warning' };
  }
  return { label: 'Aktywny', tone: 'success' };
}

export function formatMoney(amount: number | string | null | undefined, currency: string): string {
  const value = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  if (Number.isNaN(value)) {
    return `— ${currency}`;
  }
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency || 'PLN',
  }).format(value);
}
