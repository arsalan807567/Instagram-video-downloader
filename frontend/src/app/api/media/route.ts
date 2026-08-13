import { NextRequest, NextResponse } from "next/server";
import { resolveMedia } from "@/services/mediaService";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_BODY_BYTES = Number(process.env.MAX_REQUEST_BYTES ?? 2_000);


export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "unknown";

  const rateLimit = checkRateLimit(identifier);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        code: "rate_limited",
        message: "Too many requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil(rateLimit.resetInMs / 1000),
          ),
        },
      },
    );
  }

  // Body size protection
  const contentLength = Number(
    request.headers.get("content-length") ?? 0,
  );

  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      {
        success: false,
        code: "invalid_url",
        message: "Request too large.",
      },
      { status: 413 },
    );
  }

  // Parse body
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: "invalid_url",
        message: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const url =
    typeof body === "object" &&
    body !== null &&
    "url" in body &&
    typeof (body as { url: unknown }).url === "string"
      ? (body as { url: string }).url
      : undefined;

  if (typeof url !== "string") {
    return NextResponse.json(
      {
        success: false,
        code: "invalid_url",
        message: "Please enter a valid Instagram URL.",
      },
      { status: 400 },
    );
  }

  if (!url) {
    return NextResponse.json(
      {
        success: false,
        code: "invalid_url",
        message: "Please enter a valid Instagram URL.",
      },
      { status: 400 },
    );
  }

  // Retrieve media
  const result = await resolveMedia(url);

  return NextResponse.json(result, {
    status: result.success ? 200 : 422,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed.",
    },
    { status: 405 },
  );
}
