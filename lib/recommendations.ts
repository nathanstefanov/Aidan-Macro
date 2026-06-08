import { macroTotal, menuItems, restaurants, type Macro } from "./data";
import type { MacroTarget, UserProfile } from "./profile";

export type Recommendation = {
  id: string;
  title: string;
  restaurantId: string;
  itemIds: Array<{ id: string; quantity: number }>;
  totals: Macro;
  deltas: Macro;
  score: number;
  fitLabel: "Excellent fit" | "Strong fit" | "Good fit" | "Close fit";
  explanation: string;
  modifications: string[];
};

const subtractMacro = (actual: Macro, target: MacroTarget): Macro => ({
  calories: Math.round(actual.calories - target.calories),
  protein: Math.round(actual.protein - target.protein),
  carbs: Math.round(actual.carbs - target.carbs),
  fat: Math.round(actual.fat - target.fat),
});

function scoreMeal(actual: Macro, target: MacroTarget) {
  const caloriePenalty = Math.abs(actual.calories - target.calories) / Math.max(target.calories, 1);
  const proteinPenalty = Math.abs(actual.protein - target.protein) / Math.max(target.protein, 1);
  const carbPenalty = Math.abs(actual.carbs - target.carbs) / Math.max(target.carbs, 1);
  const fatPenalty = Math.abs(actual.fat - target.fat) / Math.max(target.fat, 1);
  const weightedPenalty = caloriePenalty * 0.4 + proteinPenalty * 0.3 + carbPenalty * 0.15 + fatPenalty * 0.15;

  return Math.max(0, Math.round((1 - weightedPenalty) * 100));
}

function fitLabel(score: number): Recommendation["fitLabel"] {
  if (score >= 90) return "Excellent fit";
  if (score >= 78) return "Strong fit";
  if (score >= 65) return "Good fit";
  return "Close fit";
}

function explain(actual: Macro, target: MacroTarget) {
  const proteinDelta = Math.round(actual.protein - target.protein);
  const calorieDelta = Math.round(actual.calories - target.calories);
  if (proteinDelta >= 0 && Math.abs(calorieDelta) <= 80) {
    return `Hits protein and lands within ${Math.abs(calorieDelta)} calories of your target.`;
  }
  if (proteinDelta < 0) {
    return `${Math.abs(proteinDelta)}g protein short, but close enough to adjust with extra protein.`;
  }
  return `${proteinDelta}g protein over target with a ${calorieDelta >= 0 ? "+" : ""}${calorieDelta} calorie delta.`;
}

function candidateCombos(restaurantId: string) {
  const items = menuItems.filter(item => item.restaurantId === restaurantId);
  const highProtein = items.filter(item => item.protein >= 18).sort((a, b) => b.protein - a.protein).slice(0, 10);
  const sides = items
    .filter(item => /side|rice|bean|fries|potato|chips|fruit|greens/i.test(item.category + item.name))
    .slice(0, 10);
  const lightAdds = items.filter(item => item.calories <= 140 && item.protein <= 12 && item.calories >= 0).slice(0, 10);
  const removals = items.filter(item => item.calories < 0 || item.name.toLowerCase().startsWith("no ")).slice(0, 8);
  const combos: Array<Array<{ id: string; quantity: number }>> = [];

  highProtein.forEach(protein => {
    combos.push([{ id: protein.id, quantity: 1 }]);
    combos.push([{ id: protein.id, quantity: 2 }]);

    sides.forEach(side => {
      combos.push([{ id: protein.id, quantity: 1 }, { id: side.id, quantity: 1 }]);
      lightAdds.slice(0, 3).forEach(add => {
        combos.push([{ id: protein.id, quantity: 1 }, { id: side.id, quantity: 1 }, { id: add.id, quantity: 1 }]);
      });
    });

    removals.forEach(removal => {
      combos.push([{ id: protein.id, quantity: 1 }, { id: removal.id, quantity: 1 }]);
    });
  });

  return combos;
}

function recommendationSignature(item: Recommendation) {
  return [
    item.restaurantId,
    item.itemIds.length,
    Math.round(item.totals.calories),
    Math.round(item.totals.protein),
    Math.round(item.totals.carbs),
    Math.round(item.totals.fat),
  ].join(":");
}

function normalizedTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\bside of\b/g, "")
    .replace(/\badd\b/g, "")
    .replace(/\bextra\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateRecommendations({
  profile,
  target,
  restaurantIds,
  limit,
}: {
  profile: UserProfile;
  target: MacroTarget;
  restaurantIds: string[];
  limit: number;
}): Recommendation[] {
  const activeRestaurants = restaurantIds.length ? restaurantIds : profile.preferredRestaurantIds;
  const scopedRestaurantIds = activeRestaurants.length ? activeRestaurants : restaurants.map(item => item.id);
  const disliked = [...profile.restrictions, ...profile.dislikedFoods].map(item => item.toLowerCase());

  const recommendations = scopedRestaurantIds.flatMap(restaurantId =>
    candidateCombos(restaurantId)
      .map(combo => {
        const selectedItems = combo
          .map(row => ({ item: menuItems.find(item => item.id === row.id), quantity: row.quantity }))
          .filter((row): row is { item: NonNullable<typeof row.item>; quantity: number } => Boolean(row.item));
        const text = selectedItems.map(row => row.item.name).join(" ").toLowerCase();
        if (disliked.some(term => term && text.includes(term))) return null;

        const totals = macroTotal(selectedItems.map(row => ({ item: row.item, quantity: row.quantity })));
        const score = scoreMeal(totals, target);
        const restaurant = restaurants.find(item => item.id === restaurantId)!;
        const mainItem = selectedItems[0]?.item.name ?? restaurant.name;
        const modifications = selectedItems
          .filter(row => row.item.calories < 0 || row.item.name.toLowerCase().startsWith("no "))
          .map(row => row.item.name);

        return {
          id: `${restaurantId}-${combo.map(row => `${row.id}-${row.quantity}`).join("-")}`,
          title: `${restaurant.name}: ${mainItem}`,
          restaurantId,
          itemIds: combo,
          totals,
          deltas: subtractMacro(totals, target),
          score,
          fitLabel: fitLabel(score),
          explanation: explain(totals, target),
          modifications,
        } satisfies Recommendation;
      })
      .filter(Boolean)
  ) as Recommendation[];

  const seen = new Set<string>();
  const seenTitle = new Set<string>();
  const seenSignature = new Set<string>();
  return recommendations
    .filter(item => {
      const signature = recommendationSignature(item);
      const title = normalizedTitle(item.title);
      if (seen.has(item.id)) return false;
      if (seenTitle.has(title)) return false;
      if (seenSignature.has(signature)) return false;
      seen.add(item.id);
      seenTitle.add(title);
      seenSignature.add(signature);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
