'use client';

import { useEffect, useState } from 'react';

import { colors, radii, spacing, typography } from '@equestrian-scheduler/ui-tokens';

import { getMinutesOfDay } from '@/lib/calendar/time';
import { RESOURCE_TYPE_LABELS } from '@/components/ui';
import type {
  CalendarFacilityEvent,
  CalendarLesson,
  CalendarResource,
} from '@/lib/calendar/types';

const PX_PER_MINUTE = 1.2;
const MIN_BLOCK_HEIGHT = 30;

type PlacedLesson = CalendarLesson & { lane: number };

// Assigns overlapping lessons to side-by-side lanes within a single resource.
function layoutColumn(lessons: CalendarLesson[]): { placed: PlacedLesson[]; laneCount: number } {
  const sorted = [...lessons].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes,
  );
  const laneEnds: number[] = [];

  const placed = sorted.map((lesson) => {
    let lane = laneEnds.findIndex((end) => end <= lesson.startMinutes);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(lesson.endMinutes);
    } else {
      laneEnds[lane] = lesson.endMinutes;
    }
    return { ...lesson, lane };
  });

  return { placed, laneCount: Math.max(1, laneEnds.length) };
}

function eventStyles(kind: CalendarFacilityEvent['kind']) {
  if (kind === 'maintenance') {
    return {
      border: colors.danger,
      background: colors.dangerMuted,
      label: 'Praca techniczna',
    };
  }
  return {
    border: colors.warning,
    background: colors.warningMuted,
    label: 'Wydarzenie',
  };
}

function EventBlock({
  event,
  openMinutes,
  closeMinutes,
}: {
  event: CalendarFacilityEvent;
  openMinutes: number;
  closeMinutes: number;
}) {
  const displayStart = Math.max(event.startMinutes, openMinutes);
  const displayEnd = Math.min(event.endMinutes, closeMinutes);
  if (displayEnd <= displayStart) {
    return null;
  }

  const top = (displayStart - openMinutes) * PX_PER_MINUTE;
  const height = Math.max(MIN_BLOCK_HEIGHT, (displayEnd - displayStart) * PX_PER_MINUTE);
  const style = eventStyles(event.kind);
  const titleBits = [
    `${event.startLabel}–${event.endLabel}`,
    style.label,
    event.title,
    event.blocksScheduling ? 'blokuje lekcje' : null,
    event.description,
  ].filter(Boolean);

  return (
    <div
      className="es-cal-block"
      title={titleBits.join(' · ')}
      style={{
        position: 'absolute',
        top,
        height,
        left: 2,
        right: 2,
        overflow: 'hidden',
        padding: `4px ${spacing.sm}px`,
        borderRadius: radii.sm,
        borderLeft: `3px solid ${style.border}`,
        background: style.background,
        color: colors.text,
        fontSize: typography.fontSize.xs,
        lineHeight: 1.35,
        zIndex: 1,
        boxShadow: `inset 0 0 0 1px ${style.border}33`,
      }}
    >
      <div style={{ fontWeight: 600 }}>
        {event.startLabel}–{event.endLabel}
        <span style={{ fontWeight: 500, color: style.border }}> · {style.label}</span>
      </div>
      <div>{event.title}</div>
      {event.blocksScheduling ? (
        <div style={{ color: colors.textMuted }}>Blokuje planowanie lekcji</div>
      ) : null}
      {event.isOrgWide ? (
        <div style={{ color: colors.textMuted }}>Cały ośrodek</div>
      ) : null}
    </div>
  );
}

export function CalendarGrid({
  resources,
  lessons,
  events,
  openMinutes,
  closeMinutes,
  isToday,
  timeZone,
}: {
  resources: CalendarResource[];
  lessons: CalendarLesson[];
  events: CalendarFacilityEvent[];
  openMinutes: number;
  closeMinutes: number;
  isToday: boolean;
  timeZone: string;
}) {
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!isToday) {
      setNowMinutes(null);
      return;
    }
    const update = () => setNowMinutes(getMinutesOfDay(new Date(), timeZone));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [isToday, timeZone]);

  const totalMinutes = Math.max(60, closeMinutes - openMinutes);
  const gridHeight = totalMinutes * PX_PER_MINUTE;
  const hourPx = 60 * PX_PER_MINUTE;

  const firstHour = Math.ceil(openMinutes / 60);
  const lastHour = Math.floor(closeMinutes / 60);
  const hourMarks: number[] = [];
  for (let hour = firstHour; hour <= lastHour; hour += 1) {
    hourMarks.push(hour);
  }

  const gridTemplate = `56px repeat(${resources.length}, minmax(180px, 1fr))`;
  const showNowLine =
    nowMinutes !== null && nowMinutes >= openMinutes && nowMinutes <= closeMinutes;
  const nowTop = showNowLine ? (nowMinutes - openMinutes) * PX_PER_MINUTE : 0;

  if (resources.length === 0) {
    return (
      <p style={{ color: colors.textMuted, margin: 0 }}>
        Najpierw dodaj obiekty (hale, ujeżdżalnie) w zakładce Obiekty, aby zobaczyć kalendarz.
      </p>
    );
  }

  return (
    <div className="es-cal-scroll" style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 120 + resources.length * 180 }}>
        {/* Resource headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            position: 'sticky',
            top: 0,
            zIndex: 3,
            background: colors.surface,
          }}
        >
          <div style={{ borderBottom: `1px solid ${colors.border}` }} />
          {resources.map((resource) => (
            <div
              key={resource.id}
              style={{
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderLeft: `1px solid ${colors.border}`,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <strong style={{ display: 'block', fontSize: typography.fontSize.sm }}>
                {resource.name}
              </strong>
              <span style={{ fontSize: typography.fontSize.xs, color: colors.textMuted }}>
                {RESOURCE_TYPE_LABELS[resource.type]} · maks. {resource.parallelCapacity} równolegle
              </span>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, position: 'relative' }}>
          {/* Time gutter */}
          <div style={{ position: 'relative', height: gridHeight }}>
            {hourMarks.map((hour) => (
              <div
                key={hour}
                style={{
                  position: 'absolute',
                  top: (hour * 60 - openMinutes) * PX_PER_MINUTE,
                  right: spacing.xs,
                  transform: 'translateY(-50%)',
                  fontSize: typography.fontSize.xs,
                  color: colors.textMuted,
                }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Resource columns */}
          {resources.map((resource) => {
            const columnLessons = lessons.filter((lesson) => lesson.resourceId === resource.id);
            const { placed, laneCount } = layoutColumn(columnLessons);
            const laneWidth = 100 / laneCount;
            const columnEvents = events.filter(
              (event) => event.isOrgWide || event.resourceId === resource.id,
            );

            return (
              <div
                key={resource.id}
                style={{
                  position: 'relative',
                  height: gridHeight,
                  borderLeft: `1px solid ${colors.border}`,
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${
                    hourPx - 1
                  }px, ${colors.border} ${hourPx - 1}px, ${colors.border} ${hourPx}px)`,
                }}
              >
                {columnEvents.map((event) => (
                  <EventBlock
                    key={`${event.id}-${resource.id}`}
                    event={event}
                    openMinutes={openMinutes}
                    closeMinutes={closeMinutes}
                  />
                ))}

                {placed.map((lesson) => {
                  const top = Math.max(0, (lesson.startMinutes - openMinutes) * PX_PER_MINUTE);
                  const height = Math.max(
                    MIN_BLOCK_HEIGHT,
                    (lesson.endMinutes - lesson.startMinutes) * PX_PER_MINUTE,
                  );
                  const cancelled = lesson.status === 'cancelled';

                  return (
                    <div
                      key={lesson.id}
                      className="es-cal-block"
                      title={
                        cancelled && lesson.cancellationReason
                          ? `Odwołana: ${lesson.cancellationReason}`
                          : undefined
                      }
                      style={{
                        position: 'absolute',
                        top,
                        height,
                        left: `calc(${lesson.lane * laneWidth}% + 2px)`,
                        width: `calc(${laneWidth}% - 4px)`,
                        overflow: 'hidden',
                        padding: `4px ${spacing.sm}px`,
                        borderRadius: radii.sm,
                        borderLeft: `3px solid ${cancelled ? colors.cancelled : colors.primary}`,
                        background: cancelled ? colors.surfaceMuted : colors.primarySoft,
                        color: cancelled ? colors.textMuted : colors.text,
                        fontSize: typography.fontSize.xs,
                        lineHeight: 1.35,
                        textDecoration: cancelled ? 'line-through' : 'none',
                        zIndex: 2,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {lesson.startLabel}–{lesson.endLabel}
                        <span style={{ fontWeight: 400, color: colors.textMuted }}>
                          {' '}
                          · {lesson.durationMinutes} min
                        </span>
                      </div>
                      <div>{lesson.instructorName}</div>
                      <div style={{ color: colors.textMuted }}>
                        {lesson.participantCount}/{lesson.maxParticipants} uczestn.
                        {lesson.horses.length > 0
                          ? ` · ${lesson.horses.map((horse) => horse.name).join(', ')}`
                          : ''}
                      </div>
                    </div>
                  );
                })}

                {showNowLine ? (
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: nowTop,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: colors.danger,
                      zIndex: 3,
                    }}
                  />
                ) : null}
              </div>
            );
          })}

          {/* "Now" marker dot in the gutter */}
          {showNowLine ? (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: nowTop,
                left: 56,
                width: 8,
                height: 8,
                borderRadius: radii.full,
                background: colors.danger,
                transform: 'translate(-50%, -50%)',
                zIndex: 4,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
