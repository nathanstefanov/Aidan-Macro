import { NextResponse } from "next/server";

export function authUnavailableResponse(error: unknown) {
  console.error("Auth database unavailable", error);
  return NextResponse.json(
    { error: "Account login is temporarily unavailable because the database is not connected." },
    { status: 503 },
  );
}
