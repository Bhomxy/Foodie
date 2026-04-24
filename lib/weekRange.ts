/** One day chip in the meal plan strip (Mon–Sun depending on settings). */
export type WeekdaySlot = {
  date: string;
  shortLabel: string;
  dayOfMonth: number;
};

const WEEKDAY_LABELS_5 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
const WEEKDAY_LABELS_7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday 12:00 local for the given calendar week offset from the current week. */
function mondayOfWeek(weekOffset: number): Date {
  const now = new Date();
  const day = now.getDay();
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetToMonday, 12, 0, 0, 0);
  monday.setDate(monday.getDate() + weekOffset * 7);
  return monday;
}

export function getWeekSlots(weekOffset: number, includeWeekend: boolean): WeekdaySlot[] {
  const monday = mondayOfWeek(weekOffset);
  const labels = includeWeekend ? WEEKDAY_LABELS_7 : WEEKDAY_LABELS_5;
  const count = labels.length;

  return labels.map((shortLabel, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0, 0);
    return {
      date: toISODate(d),
      shortLabel,
      dayOfMonth: d.getDate(),
    };
  });
}

/** Index of today in `slots`, or 0. */
export function defaultWeekdayIndex(slots: WeekdaySlot[]): number {
  const today = toISODate(new Date());
  const idx = slots.findIndex((s) => s.date === today);
  return idx >= 0 ? idx : 0;
}

/** Human label like “Jan 20 – Jan 26” for the strip’s span. */
export function weekRangeLabel(slots: WeekdaySlot[]): string {
  if (slots.length === 0) return '';
  const first = slots[0].date;
  const last = slots[slots.length - 1].date;
  const a = new Date(first + 'T12:00:00');
  const b = new Date(last + 'T12:00:00');
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(a)} – ${fmt(b)}`;
}
