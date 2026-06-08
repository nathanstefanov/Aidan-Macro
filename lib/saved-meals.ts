import { macroTotal, menuItems, type MenuItem } from "./data";
import type { MacroTarget } from "./profile";

export type SavedMealSelection = {
  itemId: string;
  quantity: number;
};

export type SavedMeal = {
  id: string;
  name: string;
  restaurantId: string;
  selections: SavedMealSelection[];
  totals: MacroTarget;
  goalTag?: string;
  createdAt: string;
};

export function createSavedMeal({
  name,
  restaurantId,
  selected,
  goalTag,
}: {
  name: string;
  restaurantId: string;
  selected: Array<{ item: MenuItem; quantity: number }>;
  goalTag?: string;
}): SavedMeal {
  return {
    id: `${restaurantId}-${Date.now()}`,
    name,
    restaurantId,
    selections: selected.map(row => ({ itemId: row.item.id, quantity: row.quantity })),
    totals: macroTotal(selected),
    goalTag,
    createdAt: new Date().toISOString(),
  };
}

export function restoreSavedSelections(meal: SavedMeal) {
  return meal.selections
    .map(row => {
      const item = menuItems.find(menuItem => menuItem.id === row.itemId);
      return item ? { item, quantity: row.quantity } : null;
    })
    .filter(Boolean) as Array<{ item: MenuItem; quantity: number }>;
}
