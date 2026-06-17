import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mobile layout keeps primary navigation thumb-friendly", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /fixed left-3 right-3 bottom-\[calc\(10px\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(page, /grid grid-cols-4 gap-1 rounded-2xl/);
  assert.match(page, /min-h-\[48px\] flex-col/);
});

test("mobile builder rows stack instead of using the desktop table grid", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /grid grid-cols-1 md:grid-cols-\[minmax\(190px,1fr\)_255px_210px\]/);
  assert.match(page, /grid grid-cols-4 gap-2 rounded-lg/);
  assert.match(page, /grid w-full grid-cols-4 gap-\[3px\]/);
});

test("mobile hero and restaurant views use narrower gutters", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /w-\[min\(1180px,calc\(100%-28px\)\)\] md:w-\[min\(1180px,calc\(100%-44px\)\)\]/);
  assert.match(page, /hidden sm:inline-flex text-\[11px\] text-\[#a4ada7\]/);
  assert.match(page, /hidden sm:flex items-center gap-\[7px\] ml-auto/);
});
