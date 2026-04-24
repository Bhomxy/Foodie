import { getWeekSlots, type WeekdaySlot } from '@/lib/weekRange';
import type { DailyMealPlan, MealSlot, PantryItem } from '@/types/models';

import { recipeForSlot } from '@/lib/mockRecipes';

export type WeekMealPlanDay = WeekdaySlot & { plan: DailyMealPlan };

export function buildLocalWeekPlan(
  items: PantryItem[],
  weekOffset: number,
  includeWeekend: boolean,
): WeekMealPlanDay[] {
  return getWeekSlots(weekOffset, includeWeekend).map((slot) => ({
    ...slot,
    plan: buildLocalDailyPlan(items, slot.date),
  }));
}

export function buildLocalDailyPlan(items: PantryItem[], date: string): DailyMealPlan {
  const blob = items.map((i) => i.name.toLowerCase()).join(' ');

  const pick = (slot: MealSlot): string => {
    const base = recipeForSlot(slot);
    if (slot === 'breakfast' && (blob.includes('oat') || blob.includes('yogurt'))) {
      return base.id;
    }
    if (slot === 'lunch' && (blob.includes('rice') || blob.includes('egg'))) {
      return base.id;
    }
    if (slot === 'dinner' && (blob.includes('pasta') || blob.includes('garlic'))) {
      return base.id;
    }
    return base.id;
  };

  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];
  return {
    date,
    suggestions: slots.map((slot) => ({
      slot,
      recipeId: pick(slot),
      rationale:
        items.length === 0
          ? 'Add foodstuff to personalize this week’s meal plan.'
          : 'Based on what you have on hand (local rules until AI is connected).',
    })),
  };
}
