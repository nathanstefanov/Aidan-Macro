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

test("jersey mike's includes official cold and hot regular sub baselines", async () => {
  const data = await readFile("lib/data.ts", "utf8");
  const page = await readFile("app/page.tsx", "utf8");
  const coldIds = [
    "jm-cold-729",
    "jm-cold-1",
    "jm-cold-2",
    "jm-cold-3",
    "jm-cold-4",
    "jm-cold-6",
    "jm-cold-7",
    "jm-cold-8",
    "jm-cold-9",
    "jm-cold-10",
    "jm-cold-22",
    "jm-cold-23",
    "jm-cold-24",
    "jm-cold-25",
    "jm-cold-219",
    "jm-cold-268",
    "jm-cold-273",
    "jm-cold-402",
    "jm-cold-574",
  ];
  const hotIds = [
    "jm-hot-731",
    "jm-hot-12",
    "jm-hot-14",
    "jm-hot-16",
    "jm-hot-573",
    "jm-hot-569",
    "jm-hot-571",
    "jm-hot-11",
    "jm-hot-13",
    "jm-hot-15",
    "jm-hot-19",
    "jm-hot-158",
    "jm-hot-309",
    "jm-hot-692",
    "jm-hot-693",
    "jm-hot-694",
    "jm-hot-695",
    "jm-hot-696",
    "jm-hot-697",
    "jm-hot-698",
    "jm-hot-699",
    "jm-hot-700",
  ];

  for (const id of [...coldIds, ...hotIds]) {
    assert.match(data, new RegExp(`id:"${id}"`), `${id} should exist in Jersey Mike's baselines`);
    assert.match(data, new RegExp(`id:"${id}"[^}]*serving:"Regular sub · official calculator baseline"`));
  }

  assert.match(data, /id:"jm-cold-1"[^}]*name:"#2 Jersey Shore's Favorite"[^}]*category:"Cold Subs"/);
  assert.match(data, /id:"jm-hot-11"[^}]*name:"#17 Mike's Famous Philly/);
  assert.doesNotMatch(data, /id:"jm-hot-27"/);
  assert.match(page, /categories: \["Cold Subs", "Hot Subs", "Sandwiches"\]/);
});
