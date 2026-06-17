import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const sessionCookieName = "macromenu_session";
export const sessionDurationDays = 30;
export const sessionDurationMs = sessionDurationDays * 24 * 60 * 60 * 1000;

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  isPro: boolean;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, "hex");
  const inputBuffer = scryptSync(password, salt, 64);
  return hashBuffer.length === inputBuffer.length && timingSafeEqual(hashBuffer, inputBuffer);
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionExpiresAt() {
  return new Date(Date.now() + sessionDurationMs);
}

export function publicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isPro: user.isPro,
  };
}
