import { NextRequest, NextResponse } from "next/server";
import { hashSessionToken, sessionCookieName } from "@/lib/auth";
import { authUnavailableResponse } from "@/lib/auth-response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;

  try {
    if (token) {
      await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
    }
  } catch (error) {
    return authUnavailableResponse(error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
