# MacroMenu Pro Demo Design

## Summary

MacroMenu should become a fast restaurant meal macro calculator with an optional personalized recommendation layer. The core product is not a full daily calorie tracker. It helps users calculate macros for a fast food meal they ate or are about to eat, then understand whether that meal fits their goals.

The first implementation should build a Pro-style demo experience, not real payments. The demo should make the free and Pro experiences visible, enforce local usage limits, and include upgrade/trial messaging that can later be connected to real Stripe payments and account sync.

## Product Goal

MacroMenu helps users quickly calculate the calories, protein, carbs, and fat in one restaurant meal. Users can also generate ready-to-order restaurant meals that match their macro targets, food preferences, and selected restaurants.

The product should feel organized around four main sections:

- Calculator
- Recommendations
- Saved Meals
- Pro

## Audience

The primary user is fitness-minded enough to care about macros, but not necessarily someone who wants another full food diary. They come to MacroMenu because they ate, or are about to eat, at a fast food restaurant and want a fast answer.

Common user questions:

- What are the macros in this restaurant meal?
- Did this meal fit my goal?
- Am I missing protein?
- What should I order if I want a specific calorie/protein/carb/fat target?
- Can I save this order so I do not have to rebuild it next time?

## Core Experience

### Calculator

Calculator replaces the current `Explore` concept as the primary app surface.

Flow:

1. Pick a restaurant.
2. Choose the restaurant-specific meal flow.
3. Add base items, sides, sauces, size choices, and modifications.
4. Review calories, protein, carbs, and fat.
5. Optionally save the meal as a go-to meal.

The calculator should remain usable for free users across all supported restaurants.

### Restaurant-Specific Builder Flows

Each restaurant should use a flow based on how people actually order there. This is important because customization is central to the product.

Examples:

- Chipotle: bowl/burrito/tacos, rice, beans, protein, toppings, sauces.
- Subway/Jersey Mike's: size, bread, protein, cheese, toppings, sauces, removals.
- McDonald's/Burger King/Wendy's: entree, side, drink, removals, add-ons.
- Starbucks: drink size, drink base, customizations, food item.
- Wingstop/Raising Cane's/Popeyes: count, flavor/protein type, sides, sauces.

The existing builder configuration approach is a good starting point, but it should eventually live outside `app/page.tsx`.

## Recommendations

Recommendations should live in a dedicated tab/page, not on the home/calculator page.

Flow:

1. Choose target style:
   - Preset goal
   - Custom macros
2. If preset, choose a goal such as high protein, low carb, lower calorie, bulking, or balanced.
3. If custom, enter calories, protein, carbs, and fat for the meal.
4. Pick from restaurants supported in MacroMenu.
5. Apply profile preferences and restrictions.
6. Generate ready-to-order meals.

Recommendations should be complete orders, not just ingredients. The user should be able to take the recommendation and order it directly.

Recommendation cards should show:

- Restaurant
- Exact order
- Modifications
- Calories, protein, carbs, and fat
- Target versus actual macro breakdown
- Fit explanation
- Action to load the meal into Calculator

The app should show 2-3 ranked options for free users and 5 ranked options for Pro users so users can pivot if they dislike one option.

## Meal Generation

The ideal recommendation engine generates combinations from menu data rather than only showing curated static picks.

Generation priorities:

1. Macro accuracy.
2. Realistic ordering.
3. User restrictions and preferences.
4. Taste/variety across the ranked set.

Generated meals may include modifications when those modifications are represented in the menu data or builder model.

Allowed modification examples:

- Extra protein
- No bun
- Lettuce wrap
- No mayo
- No cheese
- Sauce swaps
- Sauce on the side
- Light sauce
- Side substitutions
- Portion changes
- Size choices

Macro accuracy matters more than keeping the order completely standard, because users come to MacroMenu specifically for macro clarity.

## Profile

The first version should not require login. Profile data should be stored locally in the browser.

Profile fields:

- Goal mode
- Daily macro targets, optional
- Meal macro targets, optional
- Food restrictions
- Disliked foods
- Preferred restaurants
- Favorite proteins or meal styles

The interface should support three modes:

- Quick mode: preset goals only.
- Meal mode: calories, protein, carbs, and fat for one meal.
- Daily mode: full-day targets used only to explain how a meal fits, not to create a full daily tracker.

## Saved Meals

Saved meals are go-to restaurant orders, not a complete meal history.

A saved meal stores:

- Meal name
- Restaurant
- Exact items and customizations
- Quantities and portion choices
- Calories, protein, carbs, and fat
- Optional goal tag

Saving should be optional after building or loading a meal.

Free users can save up to 3 meals. Pro users can save unlimited meals.

## Free And Pro Model

### Free

Free users get:

- Manual Calculator across all supported restaurants.
- 2 recommendation generations per day.
- 2-3 recommendations per generation.
- Local profile.
- Up to 3 saved meals.

Free users should not lose access to basic restaurant calculation.

### MacroMenu Pro

Use the tier name `MacroMenu Pro`.

Pro users get:

- Unlimited recommendation generations.
- 5 recommendations per generation.
- Side-by-side recommendation comparison.
- Advanced food filters and restrictions.
- Unlimited saved meals.
- Future account sync.
- 7-day free trial messaging.

Initial pricing direction is lightweight, around $4.99/month. A mature version can move toward $9.99/month if the audience and value justify it.

## Pro Demo Mode

The first implementation should not integrate real payments.

Demo mode should include:

- Local free/pro state.
- Development preview toggle for Free and Pro states.
- Free limit state for 2 daily recommendation generations.
- Locked comparison UI.
- Locked advanced filters.
- Locked unlimited saved meals.
- Upgrade messaging using value-first language.
- 7-day free trial messaging.

Preferred call-to-action language:

- Unlock more recommendations
- Unlock unlimited recommendations
- Compare with Pro
- Save unlimited meals
- Start 7-day free trial

When real payments are added later, Stripe can replace the local Pro state. Account sync can be added after authentication exists.

## Navigation And Information Architecture

Recommended nav:

- Calculator
- Recommendations
- Saved Meals
- Pro

The current home page should be visually cleaned up because it feels too unorganized for the desired product. The first screen should act like a focused app surface rather than a broad marketing page.

Calculator should start with restaurant selection. Users should not begin by searching all menu items across every restaurant.

## Visual Direction

The app should feel like a focused macro tool:

- Calm, organized, and app-like.
- Less scattered than the current landing-page style.
- Strong hierarchy around restaurant selection, macro totals, and next actions.
- Clear distinction between Calculator and Recommendations.
- Soft Pro upsells placed at moments of value or limits.

Avoid adding a heavy marketing landing page before the product experience. The first viewport should help users start calculating or generating recommendations.

## Engineering Design

The current codebase is a working prototype, but the main page is too large for a premium feature set. `app/page.tsx` currently mixes navigation, home content, builder configs, recommendation-like macro picks, restaurant builder UI, and meal panel logic. Future work should split this into focused units.

Recommended structure:

- `components/AppHeader.tsx`
- `components/CalculatorView.tsx`
- `components/RestaurantPicker.tsx`
- `components/RestaurantBuilder.tsx`
- `components/MealPanel.tsx`
- `components/RecommendationsView.tsx`
- `components/SavedMealsView.tsx`
- `components/ProView.tsx`
- `components/UpgradePrompt.tsx`
- `lib/builder-configs.ts`
- `lib/macro-picks.ts`
- `lib/profile.ts`
- `lib/recommendations.ts`
- `lib/pro-demo.ts`
- `lib/storage.ts`

Suggested data models:

```ts
type MacroTarget = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type UserProfile = {
  goalMode: "high-protein" | "low-carb" | "lower-calorie" | "bulking" | "balanced" | "custom";
  dailyTarget?: MacroTarget;
  mealTarget?: MacroTarget;
  restrictions: string[];
  dislikedFoods: string[];
  preferredRestaurantIds: string[];
  favoriteProteins: string[];
};

type ProDemoState = {
  isPro: boolean;
  dailyRecommendationRuns: number;
  lastRunDate: string;
};

type SavedMeal = {
  id: string;
  name: string;
  restaurantId: string;
  selections: Array<{ itemId: string; quantity: number }>;
  totals: MacroTarget;
  goalTag?: string;
  createdAt: string;
};
```

## Recommendation Scoring

Recommendation scoring should compare generated meal totals against the target.

Inputs:

- Meal target or preset-derived target.
- Selected restaurant IDs.
- User restrictions.
- Available menu items and supported modifications.
- Free or Pro tier.

Outputs:

- Ranked recommendations.
- Fit score.
- Target-vs-actual deltas.
- Explanation.

Scoring should prefer meals that are close to the target while meeting restrictions. Macro accuracy is the top priority.

## Non-Goals For First Version

- Real Stripe payments.
- Required login.
- Location-based nearby restaurant discovery.
- Full daily food diary.
- Full nutrition database/admin rebuild.
- Automatic sync across devices.
- Hiding supported restaurants from free users.
- User-facing nutrition confidence or trust badges.

## First Implementation Plan Direction

After this design is approved, the implementation plan should prioritize:

1. Refactor enough of the current page to support new sections without losing behavior.
2. Rename `Explore` to `Calculator` and make restaurant selection the primary start.
3. Add local profile and Pro demo state.
4. Add local saved meals with a free limit of 3.
5. Add Recommendations view with preset/custom target inputs.
6. Add recommendation generation and scoring from existing menu data.
7. Add Pro limits: free runs, free result count, Pro result count, comparison lock, advanced filter lock.
8. Add Pro page and upgrade prompts.
9. Clean up the visual structure so the app feels focused and organized.

## Open Future Path

When the demo proves useful, the next step is to replace local Pro state with real payments and account state.

Future production upgrades:

- Stripe checkout and customer portal.
- Auth provider.
- Server-side saved meals and profile sync.
- Pro entitlement checks.
- Usage tracking across devices.
- Optional nearby supported restaurant discovery.
