import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("chipotle includes honey vinaigrette macros", async () => {
  const data = await readFile("lib/data.ts", "utf8");

  assert.match(data, /id:"chip-vinaigrette"/);
  assert.match(data, /name:"Chipotle Honey Vinaigrette"/);
  assert.match(data, /calories:220,protein:0,carbs:18,fat:16/);
});

test("chipotle builder does not render a separate extras sidebar", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.doesNotMatch(page, /Extras Column \(Chipotle\)/);
  assert.doesNotMatch(page, /grid-cols-\[minmax\(0,1fr\)_300px\]/);
  assert.match(page, /Sides, sauces, and extras/);
});
