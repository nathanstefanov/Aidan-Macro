# MacroMenu Pro Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first visible MacroMenu Pro demo experience: Calculator-first navigation, dedicated Recommendations, local profile/saved meals, free/pro limits, and value-first Pro upsells.

**Architecture:** Keep the existing static data and current builder behavior, but split product state into small local-storage helpers and add new focused views around the existing single-page app. Do not add real payments, auth, location, or a backend in this pass.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS, lucide-react, browser `localStorage`.

---

## File Structure

- Modify `app/page.tsx`: add the new view model, navigation labels, local profile/pro/saved state wiring, Calculator/Recommendations/Saved/Pro rendering, and upgrade prompts.
- Create `lib/profile.ts`: define profile/target types, defaults, and preset target helpers.
- Create `lib/pro-demo.ts`: define free/pro limits, daily usage helpers, and demo-state helpers.
- Create `lib/storage.ts`: typed `localStorage` read/write helpers that are safe during server rendering.
- Create `lib/recommendations.ts`: generate and score ready-to-order meal recommendations from `macroPicks` and current `menuItems`.
- Create `lib/saved-meals.ts`: convert selections to saved meals, enforce free/pro saved meal limits, and restore saved selections.
- No changes to real payment, auth, or server routes.

## Task 1: Add Local State Models And Storage Helpers

**Files:**
- Create: `lib/storage.ts`
- Create: `lib/profile.ts`
- Create: `lib/pro-demo.ts`

- [ ] **Step 1: Create typed browser storage helpers**

Create `lib/storage.ts`:

```ts
export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}
```

- [ ] **Step 2: Add profile and macro target types**

Create `lib/profile.ts`:

```ts
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
```

- [ ] **Step 3: Add Pro demo state and limits**

Create `lib/pro-demo.ts`:

```ts
export type ProDemoState = {
  isPro: boolean;
  dailyRecommendationRuns: number;
  lastRunDate: string;
};

export const freeRecommendationRunLimit = 2;
export const freeRecommendationResultLimit = 3;
export const proRecommendationResultLimit = 5;
export const freeSavedMealLimit = 3;

export const defaultProDemoState: ProDemoState = {
  isPro: false,
  dailyRecommendationRuns: 0,
  lastRunDate: new Date().toISOString().slice(0, 10),
};

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeProDemoState(state: ProDemoState): ProDemoState {
  const today = todayKey();
  if (state.lastRunDate !== today) {
    return { ...state, dailyRecommendationRuns: 0, lastRunDate: today };
  }
  return state;
}

export function canGenerateRecommendations(state: ProDemoState) {
  const normalized = normalizeProDemoState(state);
  return normalized.isPro || normalized.dailyRecommendationRuns < freeRecommendationRunLimit;
}

export function recordRecommendationRun(state: ProDemoState): ProDemoState {
  const normalized = normalizeProDemoState(state);
  if (normalized.isPro) return normalized;
  return {
    ...normalized,
    dailyRecommendationRuns: normalized.dailyRecommendationRuns + 1,
  };
}

export function recommendationResultLimit(state: ProDemoState) {
  return state.isPro ? proRecommendationResultLimit : freeRecommendationResultLimit;
}
```

- [ ] **Step 4: Run TypeScript/build check**

Run:

```bash
npm run build
```

Expected: build completes. If Google fonts fail in the sandbox, rerun with approved network access.

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts lib/profile.ts lib/pro-demo.ts
git commit -m "Add MacroMenu Pro demo state models"
```

## Task 2: Add Recommendation Generation And Scoring

**Files:**
- Create: `lib/recommendations.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create recommendation types and scoring**

Create `lib/recommendations.ts`:

```ts
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

  const weightedPenalty =
    caloriePenalty * 0.4 +
    proteinPenalty * 0.3 +
    carbPenalty * 0.15 +
    fatPenalty * 0.15;

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
  const highProtein = items.filter(item => item.protein >= 20).slice(0, 8);
  const sides = items.filter(item => item.category.includes("Side") || item.category.includes("Rice") || item.category.includes("Beans")).slice(0, 8);
  const lightAdds = items.filter(item => item.calories <= 120 && item.protein <= 10).slice(0, 8);
  const removals = items.filter(item => item.calories < 0 || item.name.toLowerCase().startsWith("no ")).slice(0, 6);

  const combos: Array<Array<{ id: string; quantity: number }>> = [];

  highProtein.forEach(protein => {
    combos.push([{ id: protein.id, quantity: 1 }]);
    combos.push([{ id: protein.id, quantity: 2 }]);

    sides.forEach(side => {
      combos.push([
        { id: protein.id, quantity: 1 },
        { id: side.id, quantity: 1 },
      ]);

      lightAdds.slice(0, 3).forEach(add => {
        combos.push([
          { id: protein.id, quantity: 1 },
          { id: side.id, quantity: 1 },
          { id: add.id, quantity: 1 },
        ]);
      });
    });

    removals.forEach(removal => {
      combos.push([
        { id: protein.id, quantity: 1 },
        { id: removal.id, quantity: 1 },
      ]);
    });
  });

  return combos;
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
  const scopedRestaurantIds = activeRestaurants.length ? activeRestaurants : restaurants.slice(0, 8).map(item => item.id);
  const disliked = [...profile.restrictions, ...profile.dislikedFoods].map(item => item.toLowerCase());

  const recommendations = scopedRestaurantIds.flatMap(restaurantId =>
    candidateCombos(restaurantId).map(combo => {
      const selectedItems = combo
        .map(row => ({ item: menuItems.find(item => item.id === row.id)!, quantity: row.quantity }))
        .filter(row => row.item);
      const text = selectedItems.map(row => row.item.name).join(" ").toLowerCase();
      if (disliked.some(term => term && text.includes(term))) return null;

      const totals = macroTotal(selectedItems);
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
    }).filter(Boolean)
  ) as Recommendation[];

  const seen = new Set<string>();
  return recommendations
    .filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

- [ ] **Step 2: Add a tiny smoke import in `app/page.tsx`**

Modify imports near the top of `app/page.tsx`:

```ts
import { generateRecommendations, type Recommendation } from "../lib/recommendations";
import { defaultProfile, goalLabels, targetForGoal, type GoalMode, type MacroTarget, type UserProfile } from "../lib/profile";
import {
  canGenerateRecommendations,
  defaultProDemoState,
  freeRecommendationRunLimit,
  freeSavedMealLimit,
  normalizeProDemoState,
  recommendationResultLimit,
  recordRecommendationRun,
  type ProDemoState,
} from "../lib/pro-demo";
import { readStorage, writeStorage } from "../lib/storage";
```

- [ ] **Step 3: Run TypeScript/build check**

Run:

```bash
npm run build
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add lib/recommendations.ts app/page.tsx
git commit -m "Add recommendation generation helpers"
```

## Task 3: Rename Explore To Calculator And Add App Sections

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update view type and default labels**

In `app/page.tsx`, replace the current view type:

```ts
type View = "calculator" | "restaurant" | "recommendations" | "saved" | "pro";
```

Update the initial state:

```ts
const [view, setView] = useState<View>("calculator");
```

- [ ] **Step 2: Replace desktop nav labels**

Replace the desktop nav section with:

```tsx
<nav className="hidden md:flex gap-[26px] text-sm text-[#53635b] dark:text-[#9eada6]">
  {[
    ["calculator", "Calculator"],
    ["recommendations", "Recommendations"],
    ["saved", "Saved Meals"],
    ["pro", "Pro"],
  ].map(([id, label]) => (
    <button
      key={id}
      className={cn("hover:text-green", view === id && "text-green font-extrabold")}
      onClick={() => setView(id as View)}
    >
      {label}
    </button>
  ))}
</nav>
```

- [ ] **Step 3: Replace mobile nav labels**

Replace mobile nav buttons with the same four section labels and handlers:

```tsx
{[
  ["calculator", "Calculator"],
  ["recommendations", "Recommendations"],
  ["saved", "Saved Meals"],
  ["pro", "Pro"],
].map(([id, label]) => (
  <button
    key={id}
    className={cn(
      "w-full p-4 py-3.5 text-left rounded-xl font-semibold text-base",
      view === id ? "bg-green-soft text-green" : "hover:bg-[#f5f8f5] dark:hover:bg-[#18231f]"
    )}
    onClick={() => { setView(id as View); setMobileNavOpen(false); }}
  >
    {label}
  </button>
))}
```

- [ ] **Step 4: Update logo click**

Change the logo button handler:

```tsx
onClick={() => { setView("calculator"); setMobileNavOpen(false); }}
```

- [ ] **Step 5: Rename the old home conditional**

Change:

```tsx
{view === "home" ? (
```

to:

```tsx
{view === "calculator" ? (
```

Change any `setView("home")` calls to `setView("calculator")`.

- [ ] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: build completes and the header shows `Calculator`, `Recommendations`, `Saved Meals`, `Pro`.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "Rename Explore to Calculator navigation"
```

## Task 4: Add Local Profile, Pro Demo State, And Saved Meal State

**Files:**
- Create: `lib/saved-meals.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create saved meal helpers**

Create `lib/saved-meals.ts`:

```ts
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
```

- [ ] **Step 2: Add imports in `app/page.tsx`**

```ts
import { createSavedMeal, restoreSavedSelections, type SavedMeal } from "../lib/saved-meals";
```

- [ ] **Step 3: Add local state in `Home`**

Inside `Home`, add:

```ts
const [profile, setProfile] = useState<UserProfile>(defaultProfile);
const [proDemo, setProDemo] = useState<ProDemoState>(defaultProDemoState);
const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
const [hydrated, setHydrated] = useState(false);
```

- [ ] **Step 4: Load local state on mount**

Add after existing `useMemo`/state setup:

```ts
useEffect(() => {
  setProfile(readStorage("macromenu-profile", defaultProfile));
  setProDemo(normalizeProDemoState(readStorage("macromenu-pro-demo", defaultProDemoState)));
  setSavedMeals(readStorage("macromenu-saved-meals", [] as SavedMeal[]));
  setHydrated(true);
}, []);
```

- [ ] **Step 5: Persist local state after hydration**

Add:

```ts
useEffect(() => {
  if (!hydrated) return;
  writeStorage("macromenu-profile", profile);
}, [hydrated, profile]);

useEffect(() => {
  if (!hydrated) return;
  writeStorage("macromenu-pro-demo", proDemo);
}, [hydrated, proDemo]);

useEffect(() => {
  if (!hydrated) return;
  writeStorage("macromenu-saved-meals", savedMeals);
}, [hydrated, savedMeals]);
```

- [ ] **Step 6: Add save/load handlers**

Inside `Home`, add:

```ts
const saveCurrentMeal = () => {
  if (!selected.length) return;
  if (!proDemo.isPro && savedMeals.length >= freeSavedMealLimit) {
    setView("pro");
    return;
  }
  const nextMeal = createSavedMeal({
    name: `${restaurant.name} meal`,
    restaurantId,
    selected,
    goalTag: goalLabels[profile.goalMode],
  });
  setSavedMeals(current => [nextMeal, ...current]);
  setSaved(true);
};

const loadSavedMeal = (meal: SavedMeal) => {
  setRestaurantId(meal.restaurantId);
  setSelected(restoreSavedSelections(meal));
  setView("restaurant");
  setOrderType(null);
  window.scrollTo({ top: 0, behavior: "smooth" });
};
```

- [ ] **Step 7: Pass `saveCurrentMeal` to `MealPanel`**

Add a prop:

```tsx
saveCurrentMeal={saveCurrentMeal}
```

Update the `MealPanel` function type to accept:

```ts
saveCurrentMeal: () => void;
```

Change the save button handler from setting only local `saved` to:

```tsx
onClick={saveCurrentMeal}
```

- [ ] **Step 8: Run build**

Run:

```bash
npm run build
```

Expected: build completes and save button still renders.

- [ ] **Step 9: Commit**

```bash
git add lib/saved-meals.ts app/page.tsx
git commit -m "Add local profile and saved meal state"
```

## Task 5: Build Recommendations View

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add recommendation state**

Inside `Home`, add:

```ts
const [recommendationGoal, setRecommendationGoal] = useState<GoalMode>("high-protein");
const [recommendationTarget, setRecommendationTarget] = useState<MacroTarget>(defaultMealTarget);
const [recommendationRestaurantIds, setRecommendationRestaurantIds] = useState<string[]>([]);
const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
```

- [ ] **Step 2: Add generation handler**

Inside `Home`, add:

```ts
const generateMealRecommendations = () => {
  const normalized = normalizeProDemoState(proDemo);
  if (!canGenerateRecommendations(normalized)) {
    setProDemo(normalized);
    setView("pro");
    return;
  }

  const target = targetForGoal(recommendationGoal, recommendationTarget);
  const nextRecommendations = generateRecommendations({
    profile: { ...profile, goalMode: recommendationGoal, mealTarget: target },
    target,
    restaurantIds: recommendationRestaurantIds,
    limit: recommendationResultLimit(normalized),
  });

  setRecommendations(nextRecommendations);
  setProDemo(recordRecommendationRun(normalized));
};
```

- [ ] **Step 3: Add load recommendation handler**

Inside `Home`, add:

```ts
const loadRecommendation = (recommendation: Recommendation) => {
  setRestaurantId(recommendation.restaurantId);
  setSelected(recommendation.itemIds.map(row => ({
    item: menuItems.find(item => item.id === row.id)!,
    quantity: row.quantity,
  })));
  setView("restaurant");
  setOrderType(null);
  window.scrollTo({ top: 0, behavior: "smooth" });
};
```

- [ ] **Step 4: Render Recommendations branch**

In the main conditional, add a branch before saved/pro branches:

```tsx
) : view === "recommendations" ? (
  <RecommendationsView
    profile={profile}
    setProfile={setProfile}
    proDemo={normalizeProDemoState(proDemo)}
    goal={recommendationGoal}
    setGoal={setRecommendationGoal}
    target={recommendationTarget}
    setTarget={setRecommendationTarget}
    restaurantIds={recommendationRestaurantIds}
    setRestaurantIds={setRecommendationRestaurantIds}
    recommendations={recommendations}
    generateRecommendations={generateMealRecommendations}
    loadRecommendation={loadRecommendation}
    openPro={() => setView("pro")}
  />
```

- [ ] **Step 5: Add `RecommendationsView` component**

Add below `Home`:

```tsx
function RecommendationsView({
  profile,
  setProfile,
  proDemo,
  goal,
  setGoal,
  target,
  setTarget,
  restaurantIds,
  setRestaurantIds,
  recommendations,
  generateRecommendations,
  loadRecommendation,
  openPro,
}: {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  proDemo: ProDemoState;
  goal: GoalMode;
  setGoal: (goal: GoalMode) => void;
  target: MacroTarget;
  setTarget: (target: MacroTarget) => void;
  restaurantIds: string[];
  setRestaurantIds: (ids: string[]) => void;
  recommendations: Recommendation[];
  generateRecommendations: () => void;
  loadRecommendation: (recommendation: Recommendation) => void;
  openPro: () => void;
}) {
  const runsLeft = proDemo.isPro ? "Unlimited" : Math.max(0, freeRecommendationRunLimit - proDemo.dailyRecommendationRuns);
  const toggleRestaurant = (id: string) => {
    setRestaurantIds(restaurantIds.includes(id) ? restaurantIds.filter(item => item !== id) : [...restaurantIds, id]);
  };

  return (
    <section className="w-[min(1180px,calc(100%-44px))] mx-auto py-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="m-0 text-green font-bold text-[11px] tracking-[0.14em] uppercase">Recommendations</p>
          <h1 className="mt-2 mb-2 font-display font-extrabold text-[clamp(30px,5vw,46px)] tracking-[-2px]">
            Generate a meal that fits.
          </h1>
          <p className="m-0 max-w-[650px] text-muted">
            Pick your macro target, choose restaurants, and MacroMenu will suggest ready-to-order meals.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card px-4 py-3 text-sm">
          <b>{proDemo.isPro ? "Pro demo" : "Free demo"}</b>
          <small className="block text-muted">{runsLeft} recommendation runs left today</small>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 mt-7">
        <div className="bg-card border border-line rounded-[14px] p-4">
          <b className="font-display text-lg">Target</b>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {(Object.keys(goalLabels) as GoalMode[]).map(option => (
              <button
                key={option}
                onClick={() => setGoal(option)}
                className={cn("rounded-lg border px-3 py-2 text-left text-xs font-bold", goal === option ? "border-green bg-green-soft text-green" : "border-line")}
              >
                {goalLabels[option]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {(["calories", "protein", "carbs", "fat"] as const).map(key => (
              <label key={key} className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                {key}
                <input
                  value={target[key]}
                  onChange={event => setTarget({ ...target, [key]: Number(event.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-green"
                  inputMode="numeric"
                />
              </label>
            ))}
          </div>

          <b className="mt-5 block font-display text-lg">Restaurants</b>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {restaurants.slice(0, 12).map(restaurant => (
              <button
                key={restaurant.id}
                onClick={() => toggleRestaurant(restaurant.id)}
                className={cn("rounded-lg border px-3 py-2 text-left text-xs font-bold", restaurantIds.includes(restaurant.id) ? "border-green bg-green-soft text-green" : "border-line")}
              >
                {restaurant.name}
              </button>
            ))}
          </div>

          <button
            onClick={generateRecommendations}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-green text-sm font-extrabold text-white"
          >
            Generate recommendations
          </button>
        </div>

        <div className="grid gap-3">
          {!proDemo.isPro && recommendations.length > 1 && (
            <button
              onClick={openPro}
              className="flex items-center justify-center rounded-xl border border-line bg-card px-4 py-3 text-sm font-bold text-muted hover:border-green hover:text-green"
            >
              Compare with Pro
            </button>
          )}
          {recommendations.length === 0 ? (
            <div className="grid min-h-[360px] place-items-center rounded-[14px] border border-dashed border-line bg-card p-8 text-center">
              <div>
                <Sparkles className="mx-auto text-green" />
                <h2 className="mt-3 font-display text-2xl font-extrabold">No recommendations yet</h2>
                <p className="mt-2 max-w-[420px] text-sm text-muted">
                  Set a target and choose restaurants to generate ready-to-order meals.
                </p>
              </div>
            </div>
          ) : recommendations.map(recommendation => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              loadRecommendation={loadRecommendation}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Add `RecommendationCard` component**

```tsx
function RecommendationCard({
  recommendation,
  loadRecommendation,
}: {
  recommendation: Recommendation;
  loadRecommendation: (recommendation: Recommendation) => void;
}) {
  const restaurant = restaurants.find(item => item.id === recommendation.restaurantId)!;
  return (
    <div className="rounded-[14px] border border-line bg-card p-4 shadow-meal">
      <div className="flex items-start gap-3">
        <Logo id={restaurant.id} small />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 font-display text-lg font-extrabold">{recommendation.title}</h3>
            <span className="rounded-full bg-green-soft px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-green">
              {recommendation.fitLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{recommendation.explanation}</p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            {([
              ["Calories", recommendation.totals.calories, recommendation.deltas.calories],
              ["Protein", `${round(recommendation.totals.protein)}g`, `${recommendation.deltas.protein >= 0 ? "+" : ""}${round(recommendation.deltas.protein)}g`],
              ["Carbs", `${round(recommendation.totals.carbs)}g`, `${recommendation.deltas.carbs >= 0 ? "+" : ""}${round(recommendation.deltas.carbs)}g`],
              ["Fat", `${round(recommendation.totals.fat)}g`, `${recommendation.deltas.fat >= 0 ? "+" : ""}${round(recommendation.deltas.fat)}g`],
            ] as const).map(([label, value, delta]) => (
              <div key={label} className="rounded-lg bg-[#f6f8f5] p-3">
                <small className="block text-[10px] font-bold uppercase tracking-[0.08em] text-muted">{label}</small>
                <b className="text-lg text-ink">{value}</b>
                <small className="block text-[11px] text-muted">{delta} vs target</small>
              </div>
            ))}
          </div>
          {recommendation.modifications.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Modifications: {recommendation.modifications.join(", ")}
            </p>
          )}
        </div>
        <button
          onClick={() => loadRecommendation(recommendation)}
          className="rounded-lg bg-green px-3 py-2 text-xs font-extrabold text-white"
        >
          Build
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Run build**

Run:

```bash
npm run build
```

Expected: build completes and Recommendations tab renders.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx
git commit -m "Add recommendations tab"
```

## Task 6: Add Saved Meals View And Free Limit Upsell

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add saved view branch**

Add a branch:

```tsx
) : view === "saved" ? (
  <SavedMealsView
    savedMeals={savedMeals}
    loadSavedMeal={loadSavedMeal}
    isPro={proDemo.isPro}
  />
```

- [ ] **Step 2: Add `SavedMealsView` component**

```tsx
function SavedMealsView({
  savedMeals,
  loadSavedMeal,
  isPro,
}: {
  savedMeals: SavedMeal[];
  loadSavedMeal: (meal: SavedMeal) => void;
  isPro: boolean;
}) {
  return (
    <section className="w-[min(1180px,calc(100%-44px))] mx-auto py-8 pb-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="m-0 text-green font-bold text-[11px] tracking-[0.14em] uppercase">Saved Meals</p>
          <h1 className="mt-2 mb-2 font-display font-extrabold text-[clamp(30px,5vw,46px)] tracking-[-2px]">
            Your go-to orders.
          </h1>
          <p className="m-0 text-muted">
            Free users can save 3 meals. Pro unlocks unlimited saved meals.
          </p>
        </div>
        {!isPro && (
          <span className="rounded-xl border border-line bg-card px-4 py-3 text-sm font-bold">
            {savedMeals.length}/3 free saves used
          </span>
        )}
      </div>

      {savedMeals.length === 0 ? (
        <div className="mt-7 rounded-[14px] border border-dashed border-line bg-card p-8 text-center">
          <Bookmark className="mx-auto text-green" />
          <h2 className="mt-3 font-display text-2xl font-extrabold">No saved meals yet</h2>
          <p className="mt-2 text-sm text-muted">Build a restaurant meal in Calculator and save it as a go-to order.</p>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {savedMeals.map(meal => {
            const restaurant = restaurants.find(item => item.id === meal.restaurantId)!;
            return (
              <button
                key={meal.id}
                onClick={() => loadSavedMeal(meal)}
                className="rounded-[14px] border border-line bg-card p-4 text-left shadow-meal transition hover:-translate-y-1"
              >
                <Logo id={meal.restaurantId} small />
                <h3 className="mt-4 font-display text-lg font-extrabold">{meal.name}</h3>
                <p className="mt-1 text-xs text-muted">{restaurant.name} · {meal.goalTag ?? "Saved order"}</p>
                <MacroStats macro={meal.totals} />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: build completes and Saved Meals tab renders.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "Add saved meals view"
```

## Task 7: Add Pro Page, Demo Toggle, And Locked Feature Messaging

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add Pro branch**

Add:

```tsx
) : view === "pro" ? (
  <ProView proDemo={proDemo} setProDemo={setProDemo} />
```

- [ ] **Step 2: Add `ProView` component**

```tsx
function ProView({
  proDemo,
  setProDemo,
}: {
  proDemo: ProDemoState;
  setProDemo: (state: ProDemoState) => void;
}) {
  const normalized = normalizeProDemoState(proDemo);
  return (
    <section className="w-[min(1180px,calc(100%-44px))] mx-auto py-8 pb-24">
      <div className="rounded-[18px] bg-[#153f30] p-8 text-white">
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#b8e3cc]">MacroMenu Pro</p>
        <h1 className="mt-3 max-w-[720px] font-display text-[clamp(34px,6vw,58px)] font-extrabold leading-[1.03] tracking-[-2.6px]">
          Unlock more recommendations.
        </h1>
        <p className="mt-4 max-w-[620px] text-[#c1d4cc]">
          Generate more macro-matched restaurant meals, compare options, use advanced filters, and save unlimited go-to orders.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="rounded-xl bg-[#f1b650] px-5 py-3 text-sm font-extrabold text-[#223329]">
            Start 7-day free trial
          </button>
          <button
            onClick={() => setProDemo({ ...normalized, isPro: !normalized.isPro })}
            className="rounded-xl border border-white/25 px-5 py-3 text-sm font-extrabold text-white"
          >
            Demo toggle: {normalized.isPro ? "Pro" : "Free"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ["Unlimited recommendations", "Free gets 2 generations per day. Pro removes the limit."],
          ["5 ranked meal options", "Free gets 2-3 options. Pro gives more ways to pivot."],
          ["Compare with Pro", "Put recommendations side by side before you order."],
          ["Advanced filters", "Avoid foods, restrictions, and meal styles automatically."],
          ["Unlimited saved meals", "Free saves 3 go-to orders. Pro saves as many as you want."],
          ["Future sync", "Account sync comes after the demo version proves the flow."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-[14px] border border-line bg-card p-5">
            <Check className="text-green" />
            <h3 className="mt-3 font-display text-lg font-extrabold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: build completes and Pro page renders with demo toggle.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "Add MacroMenu Pro demo page"
```

## Task 8: Clean Up Calculator First Screen

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace hero copy**

In the Calculator branch hero, replace the headline and supporting copy with:

```tsx
<h1 className="mt-[17px] mb-[11px] font-display font-extrabold text-[clamp(28px,7vw,58px)] leading-[1.06] tracking-[-3.5px]">
  Calculate fast food<br /><em className="not-italic text-green">macros quickly.</em>
</h1>
<p className="m-0 w-[570px] max-w-full text-[17px] leading-[1.7] text-[#65736d] dark:text-[#9eada6]">
  Pick a restaurant, build the meal you ate, and see calories, protein, carbs, and fat without digging through nutrition PDFs.
</p>
```

- [ ] **Step 2: Replace search-first emphasis with restaurant-first copy**

Change the search placeholder:

```tsx
placeholder="Find a supported restaurant"
```

Change the popular section heading:

```tsx
<h2 className="mt-[6px] mb-[5px] font-display font-extrabold text-[clamp(24px,4vw,32px)] tracking-[-1.5px]">
  Choose a restaurant
</h2>
<span className="text-muted text-[15px]">Start with where you ate, then build the exact order.</span>
```

- [ ] **Step 3: Remove the scattered marketing banner**

Keep the restaurant grid and collections. Remove the feature banner JSX block that starts with the comment `{/* Feature Banner */}` and ends after its closing `</section>`. Do not delete reusable components.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: build completes and first page reads as Calculator.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "Focus home screen on meal calculation"
```

## Task 9: Manual Verification In Browser

**Files:**
- No code changes unless defects are found.

- [ ] **Step 1: Start dev server**

Run:

```bash
npm run dev
```

Expected: Next.js starts on an available local port.

- [ ] **Step 2: Verify Calculator**

Open the local URL and confirm:

- Nav shows Calculator, Recommendations, Saved Meals, Pro.
- Calculator starts with restaurant selection.
- Opening a restaurant still allows meal building.
- Meal totals update when items are added.
- Save meal button saves up to 3 meals for free.

- [ ] **Step 3: Verify Recommendations**

Confirm:

- Recommendations tab renders.
- Preset/custom macro target inputs render.
- Selecting restaurants works.
- Free user can generate recommendations.
- Recommendation cards show target-vs-actual macro deltas.
- Build action loads a recommendation into Calculator.
- After 2 free generations, the app routes or prompts toward Pro.

- [ ] **Step 4: Verify Pro demo**

Confirm:

- Pro page renders.
- Demo toggle switches Free/Pro.
- Pro user gets 5 recommendations.
- Free user gets 2-3 recommendations.
- Free saved meal limit is enforced at 3.
- Pro allows more than 3 saved meals.

- [ ] **Step 5: Run final build**

Run:

```bash
npm run build
```

Expected: build completes.

- [ ] **Step 6: Commit verification fixes**

When verification uncovers defects and those defects are fixed, run:

```bash
git add app/page.tsx app/globals.css lib
git commit -m "Polish MacroMenu Pro demo"
```

When verification finds no defects, leave the worktree unchanged and do not create an empty commit.
