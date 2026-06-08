# Nutrition Audit Notes

MacroMenu should only label a restaurant as `Official baseline` after its seeded rows have been checked against current official restaurant nutrition data.

## Audited Seeds

- Panda Express: checked against the official nutrition page on 2026-06-02.
- Jimmy John's: checked against the official NutritionGuide PDF effective 2024-07-22 for seeded sandwich and add-on rows.
- Culver's: checked against the official Nutrition & Allergen Guide PDF published in 2026 for seeded rows.

## Partial Corrections

- Wingstop: classic and boneless wing flavor rows corrected on 2026-06-07 against Wingstop's official Nutritional Facts PDF linked from `https://www.wingstop.com/nutrition`. These corrections cover seeded wing rows only; fries, dips, and any future combo rows still need a complete source import pass before Wingstop should be marked as an official baseline.

## Preview Seeds

These restaurants have representative demo rows but still need a complete import pass before they should be treated as official baselines:

- Chipotle
- Chick-fil-A
- Potbelly
- Jersey Mike's
- McDonald's
- Starbucks
- Taco Bell
- Subway
- Five Guys
- Shake Shack
- Dairy Queen
- CAVA
- Portillo's
- Wendy's
- Burger King
- Panera Bread
- Popeyes
- Arby's
- Wingstop
- Raising Cane's

## Modeling Notes

- Sandwich restaurants should use component logging: bread, meats, cheese, spreads, toppings, then optional premade favorites.
- Menu coverage needs explicit checks for easily missed rows: limited-time proteins such as Chipotle Honey Chicken, kids meals, bacon at sub shops, and Jersey Mike's rosemary parmesan bread.
- Published restaurant values are the baseline. Light, Heavy, and Double controls are estimated multipliers on top of the published serving size.
- Do not mark a restaurant as audited only because one or two rows were checked.
