import { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useFoodie } from '@/context/FoodieContext';
import { cancelMealReminders } from '@/lib/notifications';
import { useColorScheme } from '@/components/useColorScheme';
import type { MealSlot } from '@/types/models';

function TimeField({
  label,
  hour,
  minute,
  onChangeHour,
  onChangeMinute,
  border,
  colorScheme,
}: {
  label: string;
  hour: number;
  minute: number;
  onChangeHour: (v: string) => void;
  onChangeMinute: (v: string) => void;
  border: string;
  colorScheme: 'light' | 'dark' | null;
}) {
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';
  return (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.timeInputs}>
        <TextInput
          value={String(hour)}
          onChangeText={onChangeHour}
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.timeInput, { borderColor: border, color: textColor }]}
        />
        <Text style={styles.colon}>:</Text>
        <TextInput
          value={String(minute).padStart(2, '0')}
          onChangeText={onChangeMinute}
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.timeInput, { borderColor: border, color: textColor }]}
        />
      </View>
    </View>
  );
}

export default function RemindersScreen() {
  const colorScheme = useColorScheme();
  const { reminders, setReminders } = useFoodie();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const border = colorScheme === 'dark' ? '#333' : '#ddd';

  const patchSlot = (slot: MealSlot, patch: Partial<(typeof reminders)['breakfast']>) => {
    setReminders({ ...reminders, [slot]: { ...reminders[slot], ...patch } });
  };

  const setHour = (slot: MealSlot, raw: string) => {
    const n = Math.min(23, Math.max(0, parseInt(raw.replace(/\D/g, ''), 10) || 0));
    patchSlot(slot, { hour: n });
  };

  const setMinute = (slot: MealSlot, raw: string) => {
    const n = Math.min(59, Math.max(0, parseInt(raw.replace(/\D/g, ''), 10) || 0));
    patchSlot(slot, { minute: n });
  };

  const patchLowStock = (patch: Partial<(typeof reminders)['lowStock']>) => {
    setReminders({ ...reminders, lowStock: { ...reminders.lowStock, ...patch } });
  };

  const setLowStockHour = (raw: string) => {
    const n = Math.min(23, Math.max(0, parseInt(raw.replace(/\D/g, ''), 10) || 0));
    patchLowStock({ hour: n });
  };

  const setLowStockMinute = (raw: string) => {
    const n = Math.min(59, Math.max(0, parseInt(raw.replace(/\D/g, ''), 10) || 0));
    patchLowStock({ minute: n });
  };

  const [cleared, setCleared] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reminders</Text>
      <Text style={styles.sub}>
        Meal nudges use local notifications (Expo). Grant permission when prompted. Expiry push alerts
        will pair with Supabase cron in a later milestone.
      </Text>

      {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
        <View key={slot} style={[styles.card, { borderColor: border }]}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>{slot.charAt(0).toUpperCase() + slot.slice(1)}</Text>
            <Switch
              value={reminders[slot].enabled}
              onValueChange={(enabled) => patchSlot(slot, { enabled })}
              trackColor={{ false: '#767577', true: tint }}
            />
          </View>
          <TimeField
            label="Time"
            hour={reminders[slot].hour}
            minute={reminders[slot].minute}
            onChangeHour={(v) => setHour(slot, v)}
            onChangeMinute={(v) => setMinute(slot, v)}
            border={border}
            colorScheme={colorScheme ?? 'light'}
          />
        </View>
      ))}

      <View style={[styles.card, { borderColor: border }]}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>Low foodstuff</Text>
          <Switch
            value={reminders.lowStock.enabled}
            onValueChange={(enabled) => patchLowStock({ enabled })}
            trackColor={{ false: '#767577', true: tint }}
          />
        </View>
        <Text style={styles.hint}>
          Daily nudge when something is at or below your threshold (almost out of stock). Reschedules when your
          list changes.
        </Text>
        <Text style={[styles.hint, { marginTop: 8 }]}>Alert if quantity ≤</Text>
        <TextInput
          value={String(reminders.lowStock.threshold)}
          onChangeText={(raw) => {
            const n = Math.max(0, parseInt(raw.replace(/\D/g, ''), 10));
            patchLowStock({ threshold: Number.isNaN(n) ? 0 : n });
          }}
          keyboardType="number-pad"
          style={[styles.thresholdInput, { borderColor: border, color: colorScheme === 'dark' ? '#fff' : '#000' }]}
        />
        <TimeField
          label="Check-in time"
          hour={reminders.lowStock.hour}
          minute={reminders.lowStock.minute}
          onChangeHour={setLowStockHour}
          onChangeMinute={setLowStockMinute}
          border={border}
          colorScheme={colorScheme ?? 'light'}
        />
      </View>

      <View style={[styles.card, { borderColor: border }]}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>Expiry alerts</Text>
          <Switch
            value={reminders.expiryAlertsEnabled}
            onValueChange={(expiryAlertsEnabled) => setReminders({ ...reminders, expiryAlertsEnabled })}
            trackColor={{ false: '#767577', true: tint }}
          />
        </View>
        <Text style={styles.hint}>
          Saved for a future backend: push when foodstuff is close to expiry.
        </Text>
      </View>

      <Pressable
        onPress={async () => {
          await cancelMealReminders();
          setCleared(true);
        }}
        style={({ pressed }) => [styles.dangerBtn, { opacity: pressed ? 0.85 : 1, borderColor: '#c0392b' }]}>
        <Text style={styles.dangerText}>Cancel all Foodie reminders</Text>
      </Pressable>
      {cleared ? (
        <Text style={[styles.hint, { color: tint, marginTop: 12 }]}>All scheduled Foodie notifications cleared.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  sub: { fontSize: 15, opacity: 0.75, marginBottom: 20, lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeLabel: { fontSize: 15, opacity: 0.7 },
  timeInputs: { flexDirection: 'row', alignItems: 'center' },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    width: 48,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 16,
  },
  colon: { marginHorizontal: 6, fontSize: 18 },
  hint: { fontSize: 14, opacity: 0.65, lineHeight: 20 },
  dangerBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  dangerText: { color: '#c0392b', fontWeight: '600', fontSize: 15 },
  thresholdInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 6,
    marginBottom: 12,
    maxWidth: 100,
  },
});
