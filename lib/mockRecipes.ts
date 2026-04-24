import type { MealSlot, Recipe } from '@/types/models';

/** Seed recipes for offline scaffold; replace with Supabase + AI responses in production. */
export const MOCK_RECIPES: Record<string, Recipe> = {
  'oat-yogurt-bowl': {
    id: 'oat-yogurt-bowl',
    title: 'Yogurt & oat bowl',
    mealType: 'breakfast',
    description: 'Quick protein-forward breakfast using pantry staples.',
    ingredientsUsed: ['oats', 'yogurt', 'honey', 'berries'],
    estimatedMinutes: 12,
    steps: [
      {
        order: 1,
        title: 'Warm the oats',
        detail: 'Toast rolled oats in a dry pan for 2–3 minutes until fragrant.',
        durationMinutes: 3,
      },
      {
        order: 2,
        title: 'Layer yogurt',
        detail: 'Spoon yogurt into a bowl. Add oats while still warm.',
        durationMinutes: 2,
      },
      {
        order: 3,
        title: 'Finish',
        detail: 'Drizzle honey and top with berries. Serve immediately.',
        durationMinutes: 2,
      },
    ],
  },
  'veg-rice-bowl': {
    id: 'veg-rice-bowl',
    title: 'Vegetable rice bowl',
    mealType: 'lunch',
    description: 'Use leftover rice and whatever vegetables you have.',
    ingredientsUsed: ['rice', 'onion', 'eggs', 'soy sauce'],
    estimatedMinutes: 25,
    steps: [
      {
        order: 1,
        title: 'Prep aromatics',
        detail: 'Dice onion. Scramble eggs in a pan, then set aside.',
        durationMinutes: 6,
      },
      {
        order: 2,
        title: 'Fry rice',
        detail: 'Sauté onion until soft. Add cold rice, break up clumps, stir-fry 4–5 minutes.',
        durationMinutes: 8,
      },
      {
        order: 3,
        title: 'Combine',
        detail: 'Return eggs, splash soy sauce, toss until glossy. Taste and adjust.',
        durationMinutes: 5,
      },
    ],
  },
  'pasta-aglio': {
    id: 'pasta-aglio',
    title: 'Aglio e olio',
    mealType: 'dinner',
    description: 'Minimal pantry pasta with garlic and olive oil.',
    ingredientsUsed: ['pasta', 'garlic', 'olive oil', 'chili flakes'],
    estimatedMinutes: 20,
    steps: [
      {
        order: 1,
        title: 'Boil pasta',
        detail: 'Salt water aggressively. Cook pasta 1 minute shy of package time.',
        durationMinutes: 10,
      },
      {
        order: 2,
        title: 'Build the sauce',
        detail: 'Low heat: gently cook sliced garlic in olive oil until golden, not brown. Add chili flakes.',
        durationMinutes: 4,
      },
      {
        order: 3,
        title: 'Toss',
        detail: 'Add pasta with a splash of pasta water. Toss until silky. Finish with salt.',
        durationMinutes: 4,
      },
    ],
  },
};

export function recipeForSlot(slot: MealSlot): Recipe {
  const bySlot: Record<MealSlot, string> = {
    breakfast: 'oat-yogurt-bowl',
    lunch: 'veg-rice-bowl',
    dinner: 'pasta-aglio',
  };
  return MOCK_RECIPES[bySlot[slot]];
}
