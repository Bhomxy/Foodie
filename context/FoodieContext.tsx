import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import { fetchAiWeekPlan } from '@/lib/aiMealPlan';
import { getLowStockItems } from '@/lib/lowStock';
import { scheduleMealReminders } from '@/lib/notifications';
import { buildLocalWeekPlan, type WeekMealPlanDay } from '@/lib/suggestMeals';
import { pullPantryRemote, pushPantryRemote } from '@/lib/syncPantry';
import {
  type AppPreferences,
  type PantryItem,
  type ReminderSchedule,
  type ShoppingListItem,
  defaultAppPreferences,
  defaultReminderSchedule,
} from '@/types/models';

const PANTRY_KEY = 'foodie:pantry';
const REMINDERS_KEY = 'foodie:reminders';
const SHOPPING_KEY = 'foodie:shopping';
const PREFS_KEY = 'foodie:prefs';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizePantry(raw: unknown[]): PantryItem[] {
  return raw.map((r) => {
    const p = r as Partial<PantryItem>;
    return {
      id: String(p.id ?? generateId()),
      name: String(p.name ?? ''),
      quantity: Number(p.quantity ?? 0),
      unit: String(p.unit ?? 'piece'),
      expiresAt: p.expiresAt ?? null,
      createdAt: String(p.createdAt ?? new Date().toISOString()),
      parLevel: p.parLevel != null && !Number.isNaN(Number(p.parLevel)) ? Number(p.parLevel) : null,
    };
  });
}

function normalizeReminders(raw: unknown): ReminderSchedule {
  const base = defaultReminderSchedule;
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ReminderSchedule>;
  return {
    breakfast: { ...base.breakfast, ...r.breakfast },
    lunch: { ...base.lunch, ...r.lunch },
    dinner: { ...base.dinner, ...r.dinner },
    expiryAlertsEnabled: r.expiryAlertsEnabled ?? base.expiryAlertsEnabled,
    lowStock: {
      ...base.lowStock,
      ...r.lowStock,
      threshold: Math.max(0, r.lowStock?.threshold ?? base.lowStock.threshold),
    },
    expiryDaysAhead: Math.max(0, r.expiryDaysAhead ?? base.expiryDaysAhead),
    expiry: { ...base.expiry, ...r.expiry },
  };
}

function normalizePrefs(raw: unknown): AppPreferences {
  if (!raw || typeof raw !== 'object') return defaultAppPreferences;
  const p = raw as Partial<AppPreferences>;
  return {
    weekOffset: typeof p.weekOffset === 'number' ? p.weekOffset : 0,
    includeWeekend: Boolean(p.includeWeekend),
  };
}

function normalizeShopping(raw: unknown[]): ShoppingListItem[] {
  return raw.map((r) => {
    const s = r as Partial<ShoppingListItem>;
    return {
      id: String(s.id ?? generateId()),
      name: String(s.name ?? ''),
      note: s.note ?? null,
      done: Boolean(s.done),
      createdAt: String(s.createdAt ?? new Date().toISOString()),
    };
  });
}

export type SyncState = 'idle' | 'syncing' | 'error';

type FoodieContextValue = {
  pantry: PantryItem[];
  addPantryItem: (input: Omit<PantryItem, 'id' | 'createdAt'>) => void;
  updatePantryItem: (id: string, patch: Partial<Omit<PantryItem, 'id' | 'createdAt'>>) => void;
  removePantryItem: (id: string) => void;
  weekMealPlan: WeekMealPlanDay[];
  prefs: AppPreferences;
  setPrefs: (p: AppPreferences | ((prev: AppPreferences) => AppPreferences)) => void;
  shoppingList: ShoppingListItem[];
  addShoppingItem: (name: string, note?: string | null) => void;
  addLowStockToShopping: () => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearDoneShopping: () => void;
  reminders: ReminderSchedule;
  setReminders: (next: ReminderSchedule) => void;
  markMealApply: (selections: { pantryItemId: string; deduct: number }[]) => void;
  loading: boolean;
  syncState: SyncState;
  mealPlanError: string | null;
  refreshAiMealPlan: () => Promise<void>;
  clearMealPlanError: () => void;
};

const FoodieContext = createContext<FoodieContextValue | undefined>(undefined);

export function FoodieProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [reminders, setRemindersState] = useState<ReminderSchedule>(defaultReminderSchedule);
  const [prefs, setPrefsState] = useState<AppPreferences>(defaultAppPreferences);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [mealPlanError, setMealPlanError] = useState<string | null>(null);
  const [aiWeekOverride, setAiWeekOverride] = useState<WeekMealPlanDay[] | null>(null);

  const pulledForUser = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rawPantry, rawReminders, rawShop, rawPrefs] = await Promise.all([
          AsyncStorage.getItem(PANTRY_KEY),
          AsyncStorage.getItem(REMINDERS_KEY),
          AsyncStorage.getItem(SHOPPING_KEY),
          AsyncStorage.getItem(PREFS_KEY),
        ]);
        if (cancelled) return;
        setPantry(normalizePantry(rawPantry ? JSON.parse(rawPantry) : []));
        setRemindersState(normalizeReminders(rawReminders ? JSON.parse(rawReminders) : null));
        setShoppingList(normalizeShopping(rawShop ? JSON.parse(rawShop) : []));
        setPrefsState(normalizePrefs(rawPrefs ? JSON.parse(rawPrefs) : null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    if (prevUserId.current !== userId) {
      pulledForUser.current = null;
      prevUserId.current = userId;
    }
    if (!userId || loading) return;
    if (pulledForUser.current === userId) return;
    setSyncState('syncing');
    pullPantryRemote(userId).then(({ items, error }) => {
      if (error) {
        setSyncState('error');
        return;
      }
      pulledForUser.current = userId;
      setPantry(normalizePantry(items));
      setSyncState('idle');
    });
  }, [userId, loading]);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(pantry)).catch(() => {});
  }, [pantry, loading]);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders)).catch(() => {});
    scheduleMealReminders(reminders, pantry).catch(() => {});
  }, [reminders, pantry, loading]);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingList)).catch(() => {});
  }, [shoppingList, loading]);

  useEffect(() => {
    if (loading) return;
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs, loading]);

  useEffect(() => {
    setAiWeekOverride(null);
    setMealPlanError(null);
  }, [pantry, prefs.weekOffset, prefs.includeWeekend]);

  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userId || loading) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      setSyncState('syncing');
      pushPantryRemote(userId, pantry).then(({ error }) => {
        setSyncState(error ? 'error' : 'idle');
      });
    }, 900);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [pantry, userId, loading]);

  const weekMealPlan = useMemo(() => {
    if (aiWeekOverride) return aiWeekOverride;
    return buildLocalWeekPlan(pantry, prefs.weekOffset, prefs.includeWeekend);
  }, [aiWeekOverride, pantry, prefs.weekOffset, prefs.includeWeekend]);

  const setPrefs = useCallback((p: AppPreferences | ((prev: AppPreferences) => AppPreferences)) => {
    setPrefsState((prev) => (typeof p === 'function' ? p(prev) : p));
  }, []);

  const addPantryItem = useCallback((input: Omit<PantryItem, 'id' | 'createdAt'>) => {
    const item: PantryItem = {
      ...input,
      parLevel: input.parLevel ?? null,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setPantry((prev) => [...prev, item]);
  }, []);

  const updatePantryItem = useCallback((id: string, patch: Partial<Omit<PantryItem, 'id' | 'createdAt'>>) => {
    setPantry((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const removePantryItem = useCallback((id: string) => {
    setPantry((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setReminders = useCallback((next: ReminderSchedule) => {
    setRemindersState(next);
  }, []);

  const markMealApply = useCallback((selections: { pantryItemId: string; deduct: number }[]) => {
    setPantry((prev) => {
      const map = new Map(selections.map((s) => [s.pantryItemId, s.deduct]));
      return prev.map((item) => {
        const d = map.get(item.id);
        if (!d || d <= 0) return item;
        return { ...item, quantity: Math.max(0, item.quantity - d) };
      });
    });
  }, []);

  const addShoppingItem = useCallback((name: string, note?: string | null) => {
    const n = name.trim();
    if (!n) return;
    setShoppingList((prev) => [
      ...prev,
      { id: generateId(), name: n, note: note ?? null, done: false, createdAt: new Date().toISOString() },
    ]);
  }, []);

  const addLowStockToShopping = useCallback(() => {
    const low = getLowStockItems(pantry, reminders.lowStock.threshold);
    setShoppingList((prev) => {
      const existing = new Set(prev.map((p) => p.name.toLowerCase()));
      const add: ShoppingListItem[] = [];
      for (const item of low) {
        if (existing.has(item.name.toLowerCase())) continue;
        add.push({
          id: generateId(),
          name: item.name,
          note: `Restock (was ${item.quantity} ${item.unit})`,
          done: false,
          createdAt: new Date().toISOString(),
        });
      }
      return [...prev, ...add];
    });
  }, [pantry, reminders.lowStock.threshold]);

  const toggleShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  }, []);

  const removeShoppingItem = useCallback((id: string) => {
    setShoppingList((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearDoneShopping = useCallback(() => {
    setShoppingList((prev) => prev.filter((s) => !s.done));
  }, []);

  const refreshAiMealPlan = useCallback(async () => {
    setMealPlanError(null);
    const { week, error } = await fetchAiWeekPlan(pantry, prefs.weekOffset, prefs.includeWeekend);
    setAiWeekOverride(week);
    if (error) setMealPlanError(error);
  }, [pantry, prefs.weekOffset, prefs.includeWeekend]);

  const clearMealPlanError = useCallback(() => setMealPlanError(null), []);

  const value = useMemo(
    () => ({
      pantry,
      addPantryItem,
      updatePantryItem,
      removePantryItem,
      weekMealPlan,
      prefs,
      setPrefs,
      shoppingList,
      addShoppingItem,
      addLowStockToShopping,
      toggleShoppingItem,
      removeShoppingItem,
      clearDoneShopping,
      reminders,
      setReminders,
      markMealApply,
      loading,
      syncState,
      mealPlanError,
      refreshAiMealPlan,
      clearMealPlanError,
    }),
    [
      pantry,
      addPantryItem,
      updatePantryItem,
      removePantryItem,
      weekMealPlan,
      prefs,
      setPrefs,
      shoppingList,
      addShoppingItem,
      addLowStockToShopping,
      toggleShoppingItem,
      removeShoppingItem,
      clearDoneShopping,
      reminders,
      setReminders,
      markMealApply,
      loading,
      syncState,
      mealPlanError,
      refreshAiMealPlan,
      clearMealPlanError,
    ],
  );

  return <FoodieContext.Provider value={value}>{children}</FoodieContext.Provider>;
}

export function useFoodie(): FoodieContextValue {
  const ctx = useContext(FoodieContext);
  if (!ctx) throw new Error('useFoodie must be used within FoodieProvider');
  return ctx;
}
