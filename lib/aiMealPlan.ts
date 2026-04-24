import { registerExtraRecipes, clearExtraRecipes } from '@/lib/recipeRegistry';
import { buildLocalWeekPlan, type WeekMealPlanDay } from '@/lib/suggestMeals';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MealSlot, PantryItem, Recipe } from '@/types/models';

type AiMeal = {
  slot: MealSlot;
  rationale: string;
  recipe: {
    id: string;
    title: string;
    mealType: MealSlot;
    description: string;
    ingredientsUsed: string[];
    estimatedMinutes: number;
    steps: { order: number; title: string; detail: string; durationMinutes?: number }[];
  };
};

type AiDay = { date: string; meals: AiMeal[] };

export type AiWeekResult = { week: WeekMealPlanDay[]; error?: string };

function normalizeRecipe(raw: AiMeal['recipe']): Recipe {
  return {
    id: raw.id,
    title: raw.title,
    mealType: raw.mealType,
    description: raw.description ?? '',
    ingredientsUsed: raw.ingredientsUsed ?? [],
    estimatedMinutes: raw.estimatedMinutes ?? 20,
    steps: (raw.steps ?? []).map((s, i) => ({
      order: s.order ?? i + 1,
      title: s.title,
      detail: s.detail,
      durationMinutes: s.durationMinutes,
    })),
  };
}

const SLOT_ORDER: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

/** Calls Supabase Edge Function `generate-meals`. On failure returns local plan + error message. */
export async function fetchAiWeekPlan(
  pantry: PantryItem[],
  weekOffset: number,
  includeWeekend: boolean,
): Promise<AiWeekResult> {
  const local = buildLocalWeekPlan(pantry, weekOffset, includeWeekend);
  if (!isSupabaseConfigured) {
    return { week: local, error: 'Add EXPO_PUBLIC_SUPABASE_URL and ANON_KEY to use AI meal plans.' };
  }
  const sb = getSupabase();
  if (!sb) {
    return { week: local, error: 'Supabase client unavailable.' };
  }

  try {
    const { data, error } = await sb.functions.invoke('generate-meals', {
      body: {
        pantry: pantry.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          unit: p.unit,
          expiresAt: p.expiresAt,
          parLevel: p.parLevel,
        })),
        dates: local.map((d) => d.date),
        weekOffset,
        includeWeekend,
      },
    });

    if (error) {
      return { week: local, error: error.message ?? 'AI request failed' };
    }

    const payload = data as { days?: AiDay[]; error?: string };
    if (payload?.error) {
      return { week: local, error: payload.error };
    }
    if (!payload?.days?.length) {
      return { week: local, error: 'AI returned no days; using local rules.' };
    }

    clearExtraRecipes();
    const recipesToRegister: Recipe[] = [];
    const byDate = new Map(payload.days.map((d) => [d.date, d]));

    const week: WeekMealPlanDay[] = local.map((slot) => {
      const aiDay = byDate.get(slot.date);
      if (!aiDay?.meals?.length) return slot;

      for (const m of aiDay.meals) {
        recipesToRegister.push(normalizeRecipe(m.recipe));
      }

      const bySlot = new Map(aiDay.meals.map((m) => [m.slot, m] as const));
      const suggestions = SLOT_ORDER.map((s) => {
        const m = bySlot.get(s);
        if (!m) return null;
        return {
          slot: m.slot,
          recipeId: m.recipe.id,
          rationale: m.rationale ?? '',
        };
      }).filter(Boolean) as WeekMealPlanDay['plan']['suggestions'];

      if (suggestions.length === 0) return slot;

      return {
        ...slot,
        plan: { date: slot.date, suggestions },
      };
    });

    registerExtraRecipes(recipesToRegister);
    return { week };
  } catch (e) {
    return { week: local, error: e instanceof Error ? e.message : 'Network error' };
  }
}
