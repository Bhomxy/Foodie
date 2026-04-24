import type { PantryItem } from '@/types/models';

/** Item is “running low” if below par, or at/below global threshold when par is unset. */
export function isLowStock(item: PantryItem, globalThreshold: number): boolean {
  if (item.parLevel != null && !Number.isNaN(item.parLevel)) {
    return item.quantity < item.parLevel;
  }
  const t = Math.max(0, globalThreshold);
  return item.quantity <= t;
}

export function getLowStockItems(items: PantryItem[], globalThreshold: number): PantryItem[] {
  return items.filter((i) => isLowStock(i, globalThreshold));
}

export function lowStockNotificationBody(items: PantryItem[], globalThreshold: number): string | null {
  const low = getLowStockItems(items, globalThreshold);
  if (low.length === 0) return null;
  const names = low.slice(0, 3).map((i) => `${i.name} (${i.quantity} ${i.unit})`);
  const more = low.length > 3 ? ` +${low.length - 3} more` : '';
  return `Running low: ${names.join(', ')}${more}. Restock or open your shopping list.`;
}
