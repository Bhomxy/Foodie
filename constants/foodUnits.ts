/** Common units for foodstuff quantities (display + stored on pantry items). */
export const FOOD_UNITS = [
  'piece',
  'kg',
  'g',
  'lb',
  'oz',
  'L',
  'ml',
  'cup',
  'tbsp',
  'tsp',
  'can',
  'bunch',
  'pack',
  'pcs',
] as const;

export type FoodUnit = (typeof FOOD_UNITS)[number];

export const DEFAULT_FOOD_UNIT: FoodUnit = 'piece';
