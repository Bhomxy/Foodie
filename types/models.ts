export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export type PantryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiresAt: string | null; // YYYY-MM-DD
  createdAt: string;
  /** Restock target: low when quantity is below this. If null, use global low-stock threshold. */
  parLevel: number | null;
};

export type ShoppingListItem = {
  id: string;
  name: string;
  note: string | null;
  done: boolean;
  createdAt: string;
};

export type RecipeStep = {
  order: number;
  title: string;
  detail: string;
  durationMinutes?: number;
};

export type Recipe = {
  id: string;
  title: string;
  mealType: MealSlot;
  description: string;
  ingredientsUsed: string[];
  steps: RecipeStep[];
  estimatedMinutes: number;
};

export type MealSuggestion = {
  slot: MealSlot;
  recipeId: string;
  rationale: string;
};

export type DailyMealPlan = {
  date: string; // YYYY-MM-DD
  suggestions: MealSuggestion[];
};

export type ReminderSchedule = {
  breakfast: { hour: number; minute: number; enabled: boolean };
  lunch: { hour: number; minute: number; enabled: boolean };
  dinner: { hour: number; minute: number; enabled: boolean };
  expiryAlertsEnabled: boolean;
  /** Notify when quantity is at or below this number when item has no parLevel. */
  lowStock: { hour: number; minute: number; enabled: boolean; threshold: number };
  /** Days before expiry to include in “use soon” and expiry notification. */
  expiryDaysAhead: number;
  /** Local notification time for expiry digest (same as low stock pattern). */
  expiry: { hour: number; minute: number };
};

export const defaultReminderSchedule: ReminderSchedule = {
  breakfast: { hour: 8, minute: 0, enabled: true },
  lunch: { hour: 12, minute: 30, enabled: true },
  dinner: { hour: 18, minute: 30, enabled: true },
  expiryAlertsEnabled: true,
  lowStock: { hour: 9, minute: 0, enabled: true, threshold: 1 },
  expiryDaysAhead: 3,
  expiry: { hour: 10, minute: 0 },
};

export type AppPreferences = {
  /** 0 = current week, 1 = next, -1 = previous */
  weekOffset: number;
  includeWeekend: boolean;
};

export const defaultAppPreferences: AppPreferences = {
  weekOffset: 0,
  includeWeekend: false,
};
