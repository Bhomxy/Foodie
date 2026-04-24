import type { PantryItem } from '@/types/models';

export function matchPantryLines(ingredient: string, pantry: PantryItem[]): PantryItem[] {
  const q = ingredient.toLowerCase();
  return pantry.filter(
    (p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()),
  );
}
