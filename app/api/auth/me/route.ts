import { NextRequest, NextResponse } from "next/server";
import { hashSessionToken, publicUser, sessionCookieName } from "@/lib/auth";
import { authUnavailableResponse } from "@/lib/auth-response";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(token) },
      include: { user: true },
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: publicUser(session.user) });
  } catch (error) {
    return authUnavailableResponse(error);
  }
}
