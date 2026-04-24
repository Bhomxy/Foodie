/**
 * Metro resolves `notifications.native` / `notifications.web` before this file.
 * This barrel exists so TypeScript can resolve `@/lib/notifications`.
 */
export {
  ensureNotificationPermissions,
  cancelMealReminders,
  scheduleMealReminders,
} from './notifications.native';
