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

test("auth routes run in node and return json when the database is unavailable", async () => {
  const routePaths = [
    "app/api/auth/signup/route.ts",
    "app/api/auth/login/route.ts",
    "app/api/auth/logout/route.ts",
    "app/api/auth/me/route.ts",
  ];

  for (const routePath of routePaths) {
    const contents = await readFile(routePath, "utf8");
    assert.match(contents, /export const runtime = "nodejs"/, `${routePath} should force the Node runtime for Prisma`);
    assert.match(contents, /authUnavailableResponse/, `${routePath} should return a JSON auth outage response`);
  }
});

test("vercel install generates the prisma client before building", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.match(packageJson.scripts.postinstall, /prisma generate/);
});

test("login form surfaces json server errors instead of a generic network message", async () => {
  const page = await readFile("app/page.tsx", "utf8");

  assert.match(page, /response\.headers\.get\("content-type"\)/);
  assert.match(page, /Could not reach MacroMenu auth/);
});

test("prisma schema stores users and sessions for real accounts", async () => {
  const schema = await readFile("prisma/schema.prisma", "utf8");
  const migration = await readFile("prisma/migrations/20260617120000_add_auth_tables/migration.sql", "utf8");

  assert.match(schema, /model User/);
  assert.match(schema, /email\s+String\s+@unique/);
  assert.match(schema, /passwordHash\s+String/);
  assert.match(schema, /model Session/);
  assert.match(schema, /tokenHash\s+String\s+@unique/);
  assert.match(migration, /CREATE TABLE "User"/);
  assert.match(migration, /CREATE TABLE "Session"/);
});
