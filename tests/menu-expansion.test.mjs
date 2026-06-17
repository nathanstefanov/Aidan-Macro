import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ids = [
  "chip-queso",
  "pan-toasted-italiano",
  "pan-chicken-bacon-rancher",
  "pan-ciabatta-cheesesteak",
  "pan-tomato-basil-blt",
  "pan-ranch-cobb",
  "pan-southwest-chicken-ranch",
  "pan-mediterranean-greens",
  "pan-balsamic-greens",
  "pan-cinnamon-roll",
  "pan-bear-claw",
  "tropical-sunrise-sunset",
  "tropical-bahama-mama",
  "tropical-kiwi-quencher",
  "tropical-kiwi-quencher-half-turbinado",
  "tropical-kiwi-quencher-splenda",
  "tropical-blimey-limey",
  "tropical-blueberry-bliss",
  "tropical-jetty-punch",
  "tropical-paradise-point",
  "tropical-pomegranate-plunge",
  "tropical-sunshine",
  "tropical-tropical-dragon-passion",
  "tropical-beach-bum-chocolate",
  "tropical-peanut-butter-cup",
  "tropical-mocha-madness",
  "tropical-chia-banana-boost",
  "tropical-chicken-bacon-ranch",
  "tropical-whey-protein",
  "tropical-half-turbinado",
  "tropical-no-turbinado",
  "tropical-sub-half-splenda",
  "tropical-sub-splenda",
  "cfa-chicken-biscuit",
  "cfa-egg-white-grill",
  "cfa-hash-brown-scramble-burrito",
  "mcd-sausage-mcmuffin",
  "mcd-bacon-egg-cheese-mcgriddles",
  "mcd-sausage-burrito",
  "mcd-oatmeal",
  "wen-breakfast-baconator",
  "wen-honey-butter-biscuit",
  "wen-seasoned-potatoes",
];

test("requested menu expansion rows are present", async () => {
  const data = await readFile("lib/data.ts", "utf8");

  for (const id of ids) {
    assert.match(data, new RegExp(`id:"${id}"`), `${id} should exist in menu data`);
  }

  assert.match(data, /\{ id: "tropical"/);
  assert.match(data, /tropical: \["Smoothies", "Food", "Supplements", "Customizations", "Remove Ingredients"\]/);
  assert.match(data, /panera: \["Remove Ingredients", "Add Extras", "Bakery", "Pastries"\]/);
});

test("tropical smoothie sweetener options use the turbinado baseline", async () => {
  const data = await readFile("lib/data.ts", "utf8");

  assert.match(data, /id:"tropical-no-turbinado"[^}]*calories:-90,protein:0,carbs:-23,fat:0/);
  assert.match(data, /id:"tropical-half-turbinado"[^}]*calories:-45,protein:0,carbs:-12,fat:0/);
  assert.match(data, /id:"tropical-kiwi-quencher"[^}]*calories:490,protein:3,carbs:117,fat:0/);
  assert.match(data, /id:"tropical-kiwi-quencher-splenda"[^}]*calories:260,protein:3,carbs:66,fat:0/);
  assert.match(data, /id:"tropical-kiwi-quencher-half-turbinado"[^}]*calories:375,protein:3,carbs:92,fat:0/);
});

test("builder surfaces customization-heavy groups for expanded menus", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /tropical: \{ meals:/);
  assert.match(page, /categories: \["Smoothies"\]/);
  assert.match(page, /categories: \["Supplements", "Customizations", "Remove Ingredients"\]/);
  assert.match(page, /categories: \["Bakery", "Pastries"\]/);
  assert.match(page, /"Breakfast": \["Breakfast", "Customize it", "Choose your sides", "Sauces", "Drinks"\]/);
  assert.match(page, /"Breakfast": \["Breakfast", "Customize it", "Sides", "Drinks", "McCafe"\]/);
});
