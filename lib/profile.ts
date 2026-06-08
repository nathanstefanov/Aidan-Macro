import type { Macro } from "./data";

export type GoalMode =
  | "high-protein"
  | "low-carb"
  | "lower-calorie"
  | "bulking"
  | "balanced"
  | "custom";

export type MacroTarget = Macro;

export type UserProfile = {
  goalMode: GoalMode;
  dailyTarget?: MacroTarget;
  mealTarget: MacroTarget;
  restrictions: string[];
  dislikedFoods: string[];
  preferredRestaurantIds: string[];
  favoriteProteins: string[];
};

export const defaultMealTarget: MacroTarget = {
  calories: 700,
  protein: 45,
  carbs: 65,
  fat: 22,
};

export const defaultProfile: UserProfile = {
  goalMode: "high-protein",
  mealTarget: defaultMealTarget,
  restrictions: [],
  dislikedFoods: [],
  preferredRestaurantIds: [],
  favoriteProteins: [],
};

export const goalLabels: Record<GoalMode, string> = {
  "high-protein": "High Protein",
  "low-carb": "Low Carb",
  "lower-calorie": "Lower Calorie",
  bulking: "Bulking",
  balanced: "Balanced",
  custom: "Custom Macros",
};

export function targetForGoal(goalMode: GoalMode, customTarget: MacroTarget): MacroTarget {
  if (goalMode === "custom") return customTarget;
  if (goalMode === "high-protein") return { calories: 700, protein: 55, carbs: 60, fat: 20 };
  if (goalMode === "low-carb") return { calories: 650, protein: 45, carbs: 25, fat: 35 };
  if (goalMode === "lower-calorie") return { calories: 500, protein: 35, carbs: 45, fat: 18 };
  if (goalMode === "bulking") return { calories: 950, protein: 55, carbs: 105, fat: 32 };
  return { calories: 700, protein: 40, carbs: 70, fat: 24 };
}
