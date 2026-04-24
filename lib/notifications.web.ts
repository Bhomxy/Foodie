/**
 * expo-notifications loads push registration code on web that expects browser localStorage.
 * That breaks under Node/SSR and some tooling. Reminders are iOS/Android-only for this app.
 */
import type { PantryItem, ReminderSchedule } from '@/types/models';

export async function ensureNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function cancelMealReminders(): Promise<void> {}

export async function scheduleMealReminders(
  _schedule: ReminderSchedule,
  _pantry?: PantryItem[],
): Promise<void> {}
