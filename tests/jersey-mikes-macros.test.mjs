import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("jersey mike's macros match the official regular sub calculator rows", async () => {
  const data = await readFile("lib/data.ts", "utf8");

  assert.match(data, /id:"jm-7"[^}]*calories:817,protein:45,carbs:66,fat:41/);
  assert.match(data, /id:"jm-white"[^}]*calories:309,protein:12,carbs:59,fat:3/);
  assert.match(data, /id:"jm-turkey"[^}]*calories:111,protein:24,carbs:1,fat:1/);
  assert.match(data, /id:"jm-provolone"[^}]*calories:118,protein:9,carbs:1,fat:9/);
  assert.match(data, /id:"jm-oil"[^}]*calories:250,protein:0,carbs:0,fat:28/);
  assert.match(data, /id:"jm-mayo"[^}]*calories:261,protein:0,carbs:1,fat:29/);
  assert.match(data, /id:"jm-relish"[^}]*calories:6,protein:0,carbs:1,fat:0/);
  assert.match(data, /jerseymikes: \["Bread", "Meats", "Cheese", "Spreads", "Toppings", "Add Extras"\]/);
});
