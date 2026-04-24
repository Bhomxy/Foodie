import type { PantryItem } from '@/types/models';

/** Parse YYYY-MM-DD as local midnight for comparison. */
function parseLocalDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).setHours(0, 0, 0, 0);
}

function todayStart(): number {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
}

/** Expires on or before `daysFromNow` calendar days from today (0 = today or overdue). */
export function getExpiringSoon(items: PantryItem[], daysAhead: number): PantryItem[] {
  const end = todayStart() + daysAhead * 86400000;
  return items.filter((i) => {
    if (!i.expiresAt) return false;
    const exp = parseLocalDate(i.expiresAt);
    return exp <= end;
  });
}

export function expiryNotificationBody(items: PantryItem[], daysAhead: number): string | null {
  const soon = getExpiringSoon(items, daysAhead);
  if (soon.length === 0) return null;
  const names = soon.slice(0, 3).map((i) => `${i.name} (by ${i.expiresAt})`);
  const more = soon.length > 3 ? ` +${soon.length - 3} more` : '';
  return `Use soon: ${names.join(', ')}${more}.`;
}
