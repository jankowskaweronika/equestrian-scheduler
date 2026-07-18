// Timezone-aware helpers for the calendar. All functions accept an IANA
// timezone (e.g. "Europe/Warsaw") so the calendar renders correctly regardless
// of the server timezone. This module is safe to import from both server and
// client components (it only relies on the Intl API).

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

// Converts a wall-clock time in the given timezone to the matching UTC instant.
function zonedWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  // A single refinement resolves DST boundary edge cases.
  const refinedOffset = getTimeZoneOffsetMs(new Date(utcGuess - offset), timeZone);
  return new Date(utcGuess - refinedOffset);
}

// Parses a "YYYY-MM-DD" string into a [year, month, day] tuple.
function parseDateParts(dateStr: string): [number, number, number] {
  const parts = dateStr.split('-');
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

// Returns the [start, end) UTC instants for the given calendar day in a timezone.
export function getZonedDayRange(
  dateStr: string,
  timeZone: string,
): { startUtc: Date; endUtc: Date } {
  const [year, month, day] = parseDateParts(dateStr);
  const startUtc = zonedWallToUtc(year, month, day, 0, 0, timeZone);

  const nextDay = new Date(Date.UTC(year, month - 1, day));
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const endUtc = zonedWallToUtc(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth() + 1,
    nextDay.getUTCDate(),
    0,
    0,
    timeZone,
  );

  return { startUtc, endUtc };
}

// Minutes elapsed since midnight for a given instant, in the given timezone.
export function getMinutesOfDay(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

// Formats an instant as "HH:MM" in the given timezone.
export function formatTime(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

// Current calendar date ("YYYY-MM-DD") in the given timezone.
export function getTodayStr(timeZone: string): string {
  const parts = getZonedParts(new Date(), timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

// Shifts a "YYYY-MM-DD" date string by a number of days (calendar-safe).
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = parseDateParts(dateStr);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(
    shifted.getUTCDate(),
  ).padStart(2, '0')}`;
}

// Human-readable Polish heading, e.g. "piątek, 18 lipca 2026".
export function formatDayHeading(dateStr: string, timeZone: string): string {
  const [year, month, day] = parseDateParts(dateStr);
  // Use noon to avoid any DST/midnight ambiguity when formatting.
  const noon = zonedWallToUtc(year, month, day, 12, 0, timeZone);
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(noon);
}

// Parses a Postgres time string ("HH:MM" or "HH:MM:SS") into minutes of day.
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  return hours * 60 + minutes;
}

// Converts a wall-clock date + time in the given timezone to the UTC instant.
// Accepts dateStr "YYYY-MM-DD" and timeStr "HH:MM".
export function zonedWallTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = parseDateParts(dateStr);
  const timeParts = timeStr.split(':');
  const hour = Number(timeParts[0]);
  const minute = Number(timeParts[1] ?? 0);
  return zonedWallToUtc(year, month, day, hour, minute, timeZone);
}
