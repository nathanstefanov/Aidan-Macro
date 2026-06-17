import { NextResponse } from "next/server";
import { hashPassword, createSessionToken, hashSessionToken, isValidEmail, normalizeEmail, publicUser, sessionCookieName, sessionDurationMs, sessionExpiresAt } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(String(body?.email ?? ""));
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim();

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const token = createSessionToken();
  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: hashPassword(password),
      sessions: {
        create: {
          tokenHash: hashSessionToken(token),
          expiresAt: sessionExpiresAt(),
        },
      },
    },
  });

  const response = NextResponse.json({ user: publicUser(user) }, { status: 201 });
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(sessionDurationMs / 1000),
    path: "/",
  });
  return response;
}
