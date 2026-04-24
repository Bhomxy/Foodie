import type { Recipe } from '@/types/models';

import { MOCK_RECIPES } from '@/lib/mockRecipes';

/** AI / server-added recipes (merged at runtime). */
const extra: Record<string, Recipe> = {};

export function registerExtraRecipes(recipes: Recipe[]): void {
  const seen = new Set<string>();
  for (const r of recipes) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    extra[r.id] = r;
  }
}

export function clearExtraRecipes(): void {
  for (const k of Object.keys(extra)) delete extra[k];
}

export function getRecipe(id: string): Recipe | undefined {
  return MOCK_RECIPES[id] ?? extra[id];
}

export function allRecipeIds(): string[] {
  return [...Object.keys(MOCK_RECIPES), ...Object.keys(extra)];
}
