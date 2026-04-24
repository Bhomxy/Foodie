import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View as RNView } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useFoodie } from '@/context/FoodieContext';
import { getRecipe } from '@/lib/recipeRegistry';
import { defaultWeekdayIndex, weekRangeLabel } from '@/lib/weekRange';
import { useColorScheme } from '@/components/useColorScheme';
import type { MealSlot } from '@/types/models';

const SLOTS: { key: MealSlot; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  return (
    <RNView
      style={[
        { width: width as number, height, borderRadius: 8, backgroundColor: '#e0e0e0', opacity: 0.5 },
        style,
      ]}
    />
  );
}

function MealPlanSkeleton() {
  return (
    <View style={styles.content}>
      <SkeletonBlock width={160} height={28} style={{ marginBottom: 10 }} />
      <SkeletonBlock width={220} height={16} style={{ marginBottom: 20 }} />
      <RNView style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <RNView key={i} style={{ flex: 1, height: 52, borderRadius: 12, backgroundColor: '#e0e0e0', opacity: 0.4 }} />
        ))}
      </RNView>
      <RNView style={{ height: 1, backgroundColor: '#e0e0e0', marginBottom: 16 }} />
      <RNView style={{ borderRadius: 16, borderWidth: 1, borderColor: '#e0e0e0', padding: 16 }}>
        <SkeletonBlock width={80} height={14} style={{ marginBottom: 10 }} />
        <SkeletonBlock width={180} height={22} style={{ marginBottom: 8 }} />
        <SkeletonBlock width="100%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonBlock width="75%" height={14} style={{ marginBottom: 10 }} />
        <SkeletonBlock width={100} height={12} />
      </RNView>
    </View>
  );
}

export default function MealPlanScreen() {
  const colorScheme = useColorScheme();
  const { weekMealPlan, loading, prefs, setPrefs, mealPlanError, refreshAiMealPlan, clearMealPlanError } = useFoodie();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const borderMuted = colorScheme === 'dark' ? '#333' : '#e8e8e8';

  const [dayIndex, setDayIndex] = useState(0);
  const [mealTab, setMealTab] = useState<MealSlot>('breakfast');
  const [pickedDayOnce, setPickedDayOnce] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (loading || weekMealPlan.length === 0 || pickedDayOnce) return;
    setDayIndex(defaultWeekdayIndex(weekMealPlan));
    setPickedDayOnce(true);
  }, [loading, weekMealPlan, pickedDayOnce]);

  // Reset day index when week changes
  useEffect(() => {
    setPickedDayOnce(false);
    setDayIndex(0);
  }, [prefs.weekOffset, prefs.includeWeekend]);

  const onAiRefresh = async () => {
    setAiLoading(true);
    await refreshAiMealPlan();
    setAiLoading(false);
  };

  if (loading) {
    return (
      <ScrollView style={styles.scroll}>
        <MealPlanSkeleton />
      </ScrollView>
    );
  }

  const safeDay = Math.min(dayIndex, weekMealPlan.length - 1);
  const day = weekMealPlan[safeDay];
  const dailyPlan = day?.plan;
  const suggestion = dailyPlan?.suggestions.find((s) => s.slot === mealTab);
  const recipe = suggestion ? getRecipe(suggestion.recipeId) : undefined;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Meal plan</Text>

      {/* Week navigation */}
      <View style={[styles.weekNav, { borderColor: borderMuted }]}>
        <Pressable
          onPress={() => setPrefs((p) => ({ ...p, weekOffset: p.weekOffset - 1 }))}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <FontAwesome name="chevron-left" size={16} color={tint} />
        </Pressable>
        <Text style={styles.weekLabel}>{weekRangeLabel(weekMealPlan)}</Text>
        <Pressable
          onPress={() => setPrefs((p) => ({ ...p, weekOffset: p.weekOffset + 1 }))}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <FontAwesome name="chevron-right" size={16} color={tint} />
        </Pressable>
      </View>

      {/* Controls row: weekend toggle + AI refresh */}
      <View style={styles.controlsRow}>
        <Pressable
          onPress={() => setPrefs((p) => ({ ...p, includeWeekend: !p.includeWeekend }))}
          style={({ pressed }) => [
            styles.toggleChip,
            {
              borderColor: prefs.includeWeekend ? tint : borderMuted,
              backgroundColor: prefs.includeWeekend ? `${tint}18` : 'transparent',
              opacity: pressed ? 0.8 : 1,
            },
          ]}>
          <FontAwesome
            name={prefs.includeWeekend ? 'check-square-o' : 'square-o'}
            size={15}
            color={prefs.includeWeekend ? tint : '#888'}
          />
          <Text style={[styles.toggleLabel, prefs.includeWeekend && { color: tint }]}>Weekend</Text>
        </Pressable>

        <Pressable
          onPress={onAiRefresh}
          disabled={aiLoading}
          style={({ pressed }) => [
            styles.aiBtn,
            { borderColor: tint, backgroundColor: `${tint}12`, opacity: aiLoading || pressed ? 0.7 : 1 },
          ]}>
          {aiLoading ? (
            <ActivityIndicator size="small" color={tint} />
          ) : (
            <FontAwesome name="magic" size={14} color={tint} />
          )}
          <Text style={[styles.aiBtnLabel, { color: tint }]}>{aiLoading ? 'Generating…' : 'AI plan'}</Text>
        </Pressable>
      </View>

      {/* AI error banner */}
      {mealPlanError ? (
        <Pressable
          onPress={clearMealPlanError}
          style={[styles.errorBanner, { borderColor: '#c0392b' }]}>
          <FontAwesome name="exclamation-circle" size={15} color="#c0392b" style={{ marginRight: 8 }} />
          <Text style={styles.errorText} numberOfLines={2}>{mealPlanError}</Text>
          <FontAwesome name="times" size={14} color="#c0392b" style={{ marginLeft: 8 }} />
        </Pressable>
      ) : null}

      {/* Day chips */}
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

      {/* Meal tabs */}
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

      {/* Recipe card */}
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
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  weekLabel: { fontSize: 14, fontWeight: '600', opacity: 0.8 },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleLabel: { fontSize: 14, opacity: 0.75 },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 'auto',
  },
  aiBtnLabel: { fontSize: 14, fontWeight: '600' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#c0392b', lineHeight: 18 },
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
