import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { expiryNotificationBody } from '@/lib/expiry';
import { lowStockNotificationBody } from '@/lib/lowStock';
import type { PantryItem, ReminderSchedule } from '@/types/models';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelMealReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith('foodie-'))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

function dailyTrigger(hour: number, minute: number): Notifications.DailyTriggerInput {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };
}

export async function scheduleMealReminders(
  schedule: ReminderSchedule,
  pantry: PantryItem[],
): Promise<void> {
  await cancelMealReminders();
  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  const entries: { slot: string; label: string; hour: number; minute: number; enabled: boolean }[] = [
    { slot: 'breakfast', label: 'Breakfast — time to eat', ...schedule.breakfast },
    { slot: 'lunch', label: 'Lunch — time to eat', ...schedule.lunch },
    { slot: 'dinner', label: 'Dinner — time to eat', ...schedule.dinner },
  ];

  for (const e of entries) {
    if (!e.enabled) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `foodie-meal-${e.slot}`,
      content: {
        title: 'Foodie',
        body: e.label,
        sound: Platform.OS === 'ios' ? 'default' : undefined,
      },
      trigger: dailyTrigger(e.hour, e.minute),
    });
  }

  if (schedule.lowStock.enabled) {
    const body = lowStockNotificationBody(pantry, schedule.lowStock.threshold);
    if (body) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'foodie-low-stock',
        content: {
          title: 'Foodie · running low',
          body,
          sound: Platform.OS === 'ios' ? 'default' : undefined,
        },
        trigger: dailyTrigger(schedule.lowStock.hour, schedule.lowStock.minute),
      });
    }
  }

  if (schedule.expiryAlertsEnabled) {
    const body = expiryNotificationBody(pantry, schedule.expiryDaysAhead);
    if (body) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'foodie-expiry',
        content: {
          title: 'Foodie · use soon',
          body,
          sound: Platform.OS === 'ios' ? 'default' : undefined,
        },
        trigger: dailyTrigger(schedule.expiry.hour, schedule.expiry.minute),
      });
    }
  }
}
