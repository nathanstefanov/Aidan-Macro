import { NextRequest, NextResponse } from "next/server";
import { hashSessionToken, publicUser, sessionCookieName } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

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
}
