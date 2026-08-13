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

  const turnstileToken =
    typeof body === "object" &&
    body !== null &&
    "turnstileToken" in body &&
    typeof (body as { turnstileToken: unknown }).turnstileToken === "string"
      ? (body as { turnstileToken: string }).turnstileToken
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

  // Bot verification (Cloudflare Turnstile)
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

  if (turnstileSecret) {
    if (!turnstileToken) {
      return NextResponse.json(
        {
          success: false,
          code: "captcha_failed",
          message: "Verification failed. Please refresh the page and try again.",
        },
        { status: 403 },
      );
    }

    try {
      const verifyResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: turnstileSecret,
            response: turnstileToken,
            remoteip: identifier !== "unknown" ? identifier : undefined,
          }),
          signal: AbortSignal.timeout(5000),
        },
      );

      const verifyResult = (await verifyResponse.json()) as {
        success: boolean;
      };

      if (!verifyResult.success) {
        return NextResponse.json(
          {
            success: false,
            code: "captcha_failed",
            message: "Verification failed. Please refresh the page and try again.",
          },
          { status: 403 },
        );
      }
    } catch {
      // Turnstile's own service being unreachable shouldn't take the whole
      // downloader down - log and let the request through.
      console.error("Turnstile verification request failed");
    }
  } else {
    console.warn(
      "TURNSTILE_SECRET_KEY not set - skipping captcha verification.",
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
