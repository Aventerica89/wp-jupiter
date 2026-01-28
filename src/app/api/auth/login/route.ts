import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie, verifyPassword, isAuthEnabled } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // If auth is not enabled, return success
    if (!isAuthEnabled()) {
      return NextResponse.json({
        success: true,
        message: "Authentication not configured"
      });
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!verifyPassword(password)) {
      // Don't reveal whether auth is enabled or not
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession("admin");
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
