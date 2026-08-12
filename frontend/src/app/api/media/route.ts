import { NextRequest, NextResponse } from "next/server";
import { resolveMedia } from "@/services/mediaService";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_BODY_BYTES = Number(process.env.MAX_REQUEST_BYTES ?? 2_000);

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstile(
  token: string,
  request: NextRequest,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret || !token || token.length > 2048) {
    return false;
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "";

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: ip,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Turnstile HTTP error:", response.status);
      return false;
    }

    const result = (await response.json()) as {
      success?: boolean;
      hostname?: string;
      "error-codes"?: string[];
    };

    if (!result.success) {
      console.warn(
        "Turnstile failed:",
        result["error-codes"] ?? [],
      );
      return false;
    }

    const allowedHostnames = new Set([
      "instagram-video-downloader-iota-six.vercel.app",
    ]);

    if (
      result.hostname &&
      !allowedHostnames.has(result.hostname)
    ) {
      console.warn(
        "Turnstile hostname mismatch:",
        result.hostname,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

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
    "url" in body
      ? (body as { url: unknown }).url
      : undefined;

  const turnstileToken =
    request.headers.get("X-Turnstile-Token") ?? "";

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

  // Turnstile protection
  const turnstileValid = await verifyTurnstile(
    turnstileToken,
    request,
  );

  if (!turnstileValid) {
    return NextResponse.json(
      {
        success: false,
        code: "provider_error",
        message: "Security verification failed. Please try again.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      },
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
