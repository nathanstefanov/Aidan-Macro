import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("jersey mike's macros match the official regular sub calculator rows", async () => {
  const data = await readFile("lib/data.ts", "utf8");

  const officialDisplayTotal = { calories: 817, protein: 45, carbs: 66, fat: 41 };
  const macroIds = [
    "jm-white",
    "jm-turkey",
    "jm-provolone",
    "jm-oil",
    "jm-vinegar",
    "jm-oregano",
    "jm-lettuce",
    "jm-tomato",
    "jm-onion",
  ];
  const readMacro = (id) => {
    const match = data.match(new RegExp(`id:"${id}"[^}]*calories:([^,]+),protein:([^,]+),carbs:([^,]+),fat:([^,]+)`));
    assert.ok(match, `${id} should exist in menu data`);
    return {
      calories: Number(match[1]),
      protein: Number(match[2]),
      carbs: Number(match[3]),
      fat: Number(match[4]),
    };
  };
  const roundedShortcut = Object.fromEntries(
    Object.entries(readMacro("jm-7")).map(([key, value]) => [key, Math.round(value)])
  );
  const builtTotal = macroIds.reduce((total, id) => {
    const row = readMacro(id);
    total.calories += row.calories;
    total.protein += row.protein;
    total.carbs += row.carbs;
    total.fat += row.fat;
    return total;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const roundedBuiltTotal = Object.fromEntries(
    Object.entries(builtTotal).map(([key, value]) => [key, Math.round(value)])
  );

  assert.deepEqual(roundedShortcut, officialDisplayTotal);
  assert.deepEqual(roundedBuiltTotal, officialDisplayTotal);
  assert.match(data, /id:"jm-mayo"[^}]*calories:261\.1875,protein:\.275,carbs:\.725,fat:29\.0125/);
  assert.match(data, /id:"jm-relish"[^}]*calories:6\.165,protein:\.21,carbs:1\.275,fat:\.015/);
  assert.match(data, /jerseymikes: \["Bread", "Meats", "Cheese", "Spreads", "Toppings", "Add Extras"\]/);
});
