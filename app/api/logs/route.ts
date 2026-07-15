import { NextResponse } from "next/server"

/**
 * Client-triggered Discord logging is disabled.
 * Tool routes log server-side after successful work.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Client logging disabled; use tool APIs" },
    { status: 410 }
  )
}
