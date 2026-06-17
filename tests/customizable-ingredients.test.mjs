import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("menu items are exported with customizable ingredients for every restaurant", async () => {
  const data = await readFile("lib/data.ts", "utf8");

  assert.match(data, /customizableIngredients: string\[\]/);
  assert.match(data, /const rawMenuItems: Omit<MenuItem, "customizableIngredients">\[\] = \[/);
  assert.match(data, /export const menuItems: MenuItem\[\] = rawMenuItems\.map/);

  const restaurantIds = [...data.matchAll(/\{ id: "([^"]+)"/g)].map(match => match[1]);
  const customMap = data.match(/const customizableIngredientsByRestaurant:[\s\S]*?\n};/)?.[0] ?? "";

  for (const restaurantId of restaurantIds) {
    assert.match(
      customMap,
      new RegExp(`\\b${restaurantId}: \\[`),
      `${restaurantId} should have a customizable ingredient list`,
    );
  }
});
