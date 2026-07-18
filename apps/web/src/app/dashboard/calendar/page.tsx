import Link from 'next/link';

import { getHorseUtilizationColor } from '@equestrian-scheduler/ui-tokens';
import { colors, radii, spacing, typography } from '@equestrian-scheduler/ui-tokens';

import { requireManagerSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getCalendarDay, getLessonFormOptions } from '@/lib/calendar/queries';
import {
  addDays,
  formatDayHeading,
  getMinutesOfDay,
  getTodayStr,
  parseTimeToMinutes,
} from '@/lib/calendar/time';
import {
  Badge,
  Card,
  ErrorMessage,
  PageHeader,
  RESOURCE_TYPE_LABELS,
  SectionTitle,
  SuccessMessage,
} from '@/components/ui';
import { ArrowRightIcon } from '@/components/icons';
import { CalendarGrid } from './calendar-grid';
import { AddLessonForm } from './add-lesson-form';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card style={{ padding: spacing.md }}>
      <p
        style={{
          margin: 0,
          fontSize: typography.fontSize.xs,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </p>
      <strong style={{ display: 'block', fontSize: typography.fontSize.xl, marginTop: 2 }}>
        {value}
      </strong>
      {hint ? (
        <span style={{ fontSize: typography.fontSize.xs, color: colors.textMuted }}>{hint}</span>
      ) : null}
    </Card>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; success?: string; error?: string }>;
}) {
  const session = await requireManagerSession();
  const params = await searchParams;
  const organizationId = session.membership?.organizationId ?? session.profile.activeOrganizationId;

  if (!organizationId) {
    return (
      <div>
        <PageHeader title="Kalendarz" />
        <Card>
          <p style={{ margin: 0 }}>Brak aktywnego ośrodka.</p>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: organization } = await supabase
    .from('organizations')
    .select('timezone, calendar_opens_at, calendar_closes_at')
    .eq('id', organizationId)
    .single();

  const timeZone = organization?.timezone ?? 'Europe/Warsaw';
  const openMinutes = parseTimeToMinutes(organization?.calendar_opens_at ?? '07:00');
  const closeMinutes = parseTimeToMinutes(organization?.calendar_closes_at ?? '22:00');

  const todayStr = getTodayStr(timeZone);
  const dateStr = params.date && DATE_PATTERN.test(params.date) ? params.date : todayStr;
  const isToday = dateStr === todayStr;

  const [{ resources, lessons, horseUsage }, formOptions] = await Promise.all([
    getCalendarDay(organizationId, dateStr, timeZone),
    getLessonFormOptions(organizationId),
  ]);

  const activeLessons = lessons.filter((lesson) => lesson.status === 'active');
  const cancelledCount = lessons.length - activeLessons.length;

  // "Now" snapshot (server-rendered): who is currently on each resource.
  const nowMinutes = isToday ? getMinutesOfDay(new Date(), timeZone) : -1;
  const ongoingLessons = activeLessons.filter(
    (lesson) => nowMinutes >= lesson.startMinutes && nowMinutes < lesson.endMinutes,
  );
  const horsesWorkingNow = new Set(
    ongoingLessons.flatMap((lesson) => lesson.horses.map((horse) => horse.id)),
  );

  const prevDate = addDays(dateStr, -1);
  const nextDate = addDays(dateStr, 1);

  return (
    <div>
      <PageHeader
        title="Kalendarz zasobów"
        description="Podgląd lekcji na halach i ujeżdżalniach: instruktorzy, konie, status i czas trwania."
      />

      {params.success ? (
        <div style={{ marginBottom: spacing.md }}>
          <SuccessMessage message={params.success} />
        </div>
      ) : null}
      {params.error ? (
        <div style={{ marginBottom: spacing.md }}>
          <ErrorMessage message={params.error} />
        </div>
      ) : null}

      {/* Date navigation */}
      <Card style={{ marginBottom: spacing.lg, padding: spacing.md }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong
              style={{
                fontSize: typography.fontSize.lg,
                textTransform: 'capitalize',
              }}
            >
              {formatDayHeading(dateStr, timeZone)}
            </strong>
            {isToday ? (
              <span style={{ marginLeft: spacing.sm }}>
                <Badge tone="primary">Dziś</Badge>
              </span>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: spacing.xs }}>
            <Link
              href={`/dashboard/calendar?date=${prevDate}`}
              className="es-btn es-btn--secondary"
              aria-label="Poprzedni dzień"
            >
              ←
            </Link>
            <Link href="/dashboard/calendar" className="es-btn es-btn--secondary">
              Dziś
            </Link>
            <Link
              href={`/dashboard/calendar?date=${nextDate}`}
              className="es-btn es-btn--secondary"
              aria-label="Następny dzień"
            >
              →
            </Link>
          </div>
        </div>
      </Card>

      {/* Add lesson */}
      <Card style={{ marginBottom: spacing.lg }}>
        <details>
          <summary
            style={{
              cursor: 'pointer',
              fontSize: typography.fontSize.lg,
              fontWeight: 600,
              listStyle: 'revert',
            }}
          >
            Dodaj lekcję
          </summary>
          <div style={{ marginTop: spacing.md }}>
            <SectionTitle>Nowa lekcja</SectionTitle>
            <AddLessonForm options={formOptions} defaultDate={dateStr} />
          </div>
        </details>
      </Card>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gap: spacing.md,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          marginBottom: spacing.lg,
        }}
      >
        <StatCard
          label="Lekcje w tym dniu"
          value={String(activeLessons.length)}
          hint={cancelledCount > 0 ? `${cancelledCount} odwołanych` : 'brak odwołanych'}
        />
        <StatCard
          label={isToday ? 'Trwają teraz' : 'Trwają (nd.)'}
          value={isToday ? String(ongoingLessons.length) : '—'}
          hint={isToday ? 'aktywne w tej chwili' : 'dostępne tylko dla dziś'}
        />
        <StatCard
          label="Konie w pracy teraz"
          value={isToday ? String(horsesWorkingNow.size) : '—'}
          hint={`${horseUsage.length} koni pracuje dziś`}
        />
        <StatCard label="Zasoby" value={String(resources.length)} hint="hale i ujeżdżalnie" />
      </div>

      {/* Live now panel */}
      {isToday ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <h2 style={{ margin: `0 0 ${spacing.md}px`, fontSize: typography.fontSize.lg }}>
            Teraz na obiektach
          </h2>
          <div
            style={{
              display: 'grid',
              gap: spacing.sm,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            {resources.map((resource) => {
              const here = ongoingLessons.filter((lesson) => lesson.resourceId === resource.id);
              return (
                <div
                  key={resource.id}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: radii.md,
                    padding: spacing.md,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <strong>{resource.name}</strong>
                    <Badge>{RESOURCE_TYPE_LABELS[resource.type]}</Badge>
                  </div>
                  {here.length === 0 ? (
                    <p
                      style={{
                        margin: `${spacing.xs}px 0 0`,
                        color: colors.textMuted,
                        fontSize: typography.fontSize.sm,
                      }}
                    >
                      Wolne
                    </p>
                  ) : (
                    here.map((lesson) => (
                      <div key={lesson.id} style={{ marginTop: spacing.xs }}>
                        <span style={{ fontSize: typography.fontSize.sm, fontWeight: 600 }}>
                          {lesson.instructorName}
                        </span>
                        <span
                          style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.textMuted,
                            display: 'block',
                          }}
                        >
                          do {lesson.endLabel}
                          {lesson.horses.length > 0
                            ? ` · ${lesson.horses.map((horse) => horse.name).join(', ')}`
                            : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* Calendar grid */}
      <Card style={{ marginBottom: spacing.lg }}>
        <CalendarGrid
          resources={resources}
          lessons={lessons}
          openMinutes={openMinutes}
          closeMinutes={closeMinutes}
          isToday={isToday}
          timeZone={timeZone}
        />
      </Card>

      {/* Horse utilization */}
      <Card>
        <h2 style={{ margin: `0 0 ${spacing.md}px`, fontSize: typography.fontSize.lg }}>
          Obciążenie koni ({dateStr === todayStr ? 'dziś' : 'w tym dniu'})
        </h2>
        {horseUsage.length === 0 ? (
          <p style={{ margin: 0, color: colors.textMuted, fontSize: typography.fontSize.sm }}>
            Żaden koń nie pracuje w tym dniu.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: spacing.sm }}>
            {horseUsage.map((horse) => {
              const barColor = getHorseUtilizationColor(horse.percentage);
              return (
                <div
                  key={horse.id}
                  style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}
                >
                  <span style={{ width: 120, fontSize: typography.fontSize.sm, fontWeight: 600 }}>
                    {horse.name}
                    {horse.id && horsesWorkingNow.has(horse.id) ? (
                      <span style={{ marginLeft: spacing.xs }}>
                        <Badge tone="success">teraz</Badge>
                      </span>
                    ) : null}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: radii.full,
                      background: colors.surfaceMuted,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${horse.percentage}%`,
                        height: '100%',
                        background: barColor,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 90,
                      textAlign: 'right',
                      fontSize: typography.fontSize.xs,
                      color: colors.textMuted,
                    }}
                  >
                    {horse.ridesToday}/{horse.dailyLimit} · {horse.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p
        style={{
          marginTop: spacing.lg,
          fontSize: typography.fontSize.sm,
          color: colors.textMuted,
        }}
      >
        Edycja lekcji (przeciąganie, zmiana długości, serie tygodniowe i ostrzeżenia o kolizjach)
        pojawi się w kolejnym kroku.{' '}
        <Link href="/dashboard/resources">
          Zarządzaj zasobami <ArrowRightIcon width={14} height={14} />
        </Link>
      </p>
    </div>
  );
}
