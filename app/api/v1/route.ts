import { NextResponse } from "next/server";
import getRatelimit from "@/lib/rate-limit";

const rateLimit = getRatelimit(20, "24 h");

export async function GET(req: Request) {
  const value = req.url.split("q=")[1];
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const url = decodeURIComponent(value);

  const { success, limit, reset, remaining } = await rateLimit.limit(ip);

  if (!success) {
    return NextResponse.json({
      error: "Rate limit exceeded",
      data: {
        limit,
        reset,
        remaining,
      },
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Reset": reset.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  }

  try {
    const data = await fetch(url);

    if (!data.ok) {
      console.error("Failed to fetch data:", data.statusText);
      return NextResponse.json({
        error: "Failed to fetch data",
        status: data.status,
      });
    }

    const res = await data.text();

    return NextResponse.json(res);
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error fetching data", status: 500 });
  }
}
