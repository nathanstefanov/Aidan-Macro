import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("auth backend exposes signup, login, logout, and current-user routes", async () => {
  const routePaths = [
    "app/api/auth/signup/route.ts",
    "app/api/auth/login/route.ts",
    "app/api/auth/logout/route.ts",
    "app/api/auth/me/route.ts",
  ];

  for (const routePath of routePaths) {
    const contents = await readFile(routePath, "utf8");
    assert.match(contents, /export async function (GET|POST)/);
  }
});

test("prisma schema stores users and sessions for real accounts", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8");

  assert.match(schema, /model User/);
  assert.match(schema, /email\s+String\s+@unique/);
  assert.match(schema, /passwordHash\s+String/);
  assert.match(schema, /model Session/);
  assert.match(schema, /tokenHash\s+String\s+@unique/);
});
