import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("guests are gated before saving meals or generating recommendations", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /const requireAccount = \(\) => \{/);
  assert.match(page, /const saveCurrentMeal = \(\) => \{[\s\S]*?if \(!authUser\) \{[\s\S]*?requireAccount\(\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(page, /const generateMealRecommendations = \(\) => \{[\s\S]*?if \(!authUser\) \{[\s\S]*?requireAccount\(\);[\s\S]*?return;[\s\S]*?\}/);
});

test("guest-only recommendation and saved tabs show an account-required screen", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /function AccountRequiredView/);
  assert.match(page, /view === "recommendations" \? \([\s\S]*?!authUser \?/);
  assert.match(page, /view === "saved" \? \([\s\S]*?!authUser \?/);
  assert.match(page, /Sign in to save/);
});

test("signed-out header prompts users to sign in or sign up instead of showing guest", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /Sign in \/ Sign up/);
  assert.match(page, /onClick=\{authUser \? undefined : requireAccount\}/);
  assert.doesNotMatch(page, /: "Guest"/);
});

test("header uses a compact layout before wide desktop widths", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /<nav className="hidden xl:flex/);
  assert.match(page, /className="xl:hidden flex/);
  assert.match(page, /whitespace-nowrap/);
  assert.doesNotMatch(page, /hidden md:flex h-\[38px\]/);
  assert.doesNotMatch(page, /md:hidden flex flex-col/);
});

test("deleting saved meals is gated as a pro-only action", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /const deleteSavedMeal = \(mealId: string\) => \{/);
  assert.match(page, /if \(!proDemo\.isPro\) \{[\s\S]*?setView\("pro"\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(page, /setSavedMeals\(current => current\.filter\(meal => meal\.id !== mealId\)\)/);
  assert.match(page, /deleteSavedMeal=\{deleteSavedMeal\}/);
  assert.match(page, /aria-label=\{isPro \? `Delete \$\{meal\.name\}` : "Unlock Pro to delete saved meal"\}/);
  assert.match(page, /event\.stopPropagation\(\);[\s\S]*?deleteSavedMeal\(meal\.id\)/);
});
