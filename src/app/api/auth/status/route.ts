import { NextResponse } from "next/server";
import { getSession, isAuthEnabled } from "@/lib/auth";

export async function GET() {
  try {
    const authEnabled = isAuthEnabled();

    if (!authEnabled) {
      return NextResponse.json({
        authenticated: true,
        authEnabled: false,
      });
    }

    const session = await getSession();

    return NextResponse.json({
      authenticated: !!session,
      authEnabled: true,
      expiresAt: session?.expiresAt || null,
    });
  } catch (error) {
    console.error("Auth status error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({
      authenticated: false,
      authEnabled: true,
    });
  }
}
