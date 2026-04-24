import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useFoodie } from '@/context/FoodieContext';
import { MOCK_RECIPES } from '@/lib/mockRecipes';
import { defaultWeekdayIndex } from '@/lib/weekRange';
import { useColorScheme } from '@/components/useColorScheme';
import type { MealSlot } from '@/types/models';

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

export default function MealPlanScreen() {
  const colorScheme = useColorScheme();
  const { weekMealPlan, loading } = useFoodie();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const borderMuted = colorScheme === 'dark' ? '#333' : '#e8e8e8';

  const [dayIndex, setDayIndex] = useState(0);
  const [mealTab, setMealTab] = useState<MealSlot>('breakfast');
  const [pickedDayOnce, setPickedDayOnce] = useState(false);

  useEffect(() => {
    if (loading || weekMealPlan.length === 0 || pickedDayOnce) return;
    setDayIndex(defaultWeekdayIndex(weekMealPlan));
    setPickedDayOnce(true);
  }, [loading, weekMealPlan, pickedDayOnce]);

  if (loading || weekMealPlan.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={tint} />
      </View>
    );
  }

  const safeDay = Math.min(dayIndex, weekMealPlan.length - 1);
  const day = weekMealPlan[safeDay];
  const dailyPlan = day.plan;
  const suggestion = dailyPlan.suggestions.find((s) => s.slot === mealTab);
  const recipe = suggestion ? MOCK_RECIPES[suggestion.recipeId] : undefined;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Meal plan</Text>
      <Text style={styles.sub}>
        Monday–Friday for this week. Pick a day, then a meal, to open cooking steps.
      </Text>

      <View style={styles.weekRow}>
        {weekMealPlan.map((d, i) => {
          const active = safeDay === i;
          return (
            <Pressable
              key={d.date}
              onPress={() => setDayIndex(i)}
              style={({ pressed }) => [
                styles.dayChip,
                {
                  borderColor: active ? tint : borderMuted,
                  backgroundColor: active ? `${tint}18` : 'transparent',
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Text style={[styles.dayChipLabel, active && { color: tint, fontWeight: '700' }]}>
                {d.shortLabel}
              </Text>
              <Text style={[styles.dayChipSub, active && { color: tint }]}>{d.dayOfMonth}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.mealTabs, { borderColor: borderMuted }]}>
        {SLOTS.map(({ key, label }) => {
          const active = mealTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setMealTab(key)}
              style={({ pressed }) => [
                styles.mealTab,
                active && { borderBottomColor: tint, borderBottomWidth: 3 },
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text style={[styles.mealTabLabel, active && { color: tint, fontWeight: '700' }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {suggestion && recipe ? (
        <Link href={{ pathname: '/recipe/[id]', params: { id: suggestion.recipeId } }} asChild>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              {
                borderColor: borderMuted,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.slot}>{SLOTS.find((s) => s.key === mealTab)?.label}</Text>
              <FontAwesome name="chevron-right" size={14} color={tint} />
            </View>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.rationale}>{suggestion.rationale}</Text>
            <Text style={styles.meta}>~{recipe.estimatedMinutes} min · tap for steps</Text>
          </Pressable>
        </Link>
      ) : (
        <View style={[styles.card, { borderColor: borderMuted }]}>
          <Text style={styles.rationale}>No suggestion for this meal.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  sub: { fontSize: 15, opacity: 0.75, marginBottom: 16 },
  weekRow: { flexDirection: 'row', gap: 8, marginBottom: 18, justifyContent: 'space-between' },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dayChipLabel: { fontSize: 13, fontWeight: '600', opacity: 0.85 },
  dayChipSub: { fontSize: 12, opacity: 0.55, marginTop: 2 },
  mealTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  mealTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  mealTabLabel: { fontSize: 15, opacity: 0.75 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  slot: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, opacity: 0.7 },
  recipeTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  rationale: { fontSize: 14, lineHeight: 20, opacity: 0.8, marginBottom: 8 },
  meta: { fontSize: 13, opacity: 0.6 },
});
