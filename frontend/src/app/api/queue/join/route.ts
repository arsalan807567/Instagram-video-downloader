import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";

const FASTAPI_URL =
  process.env.FASTAPI_URL ??
  "https://instagram-video-downloader-y1cb.onrender.com";

export async function POST(request: NextRequest) {
  const identifier =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "unknown";

  const rateLimit = checkRateLimit(identifier);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.resetInMs / 1000)),
        },
      },
    );
  }

  try {
    const response = await fetch(`${FASTAPI_URL}/api/queue/join`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach the download queue right now.",
      },
      { status: 502 },
    );
  }
}
