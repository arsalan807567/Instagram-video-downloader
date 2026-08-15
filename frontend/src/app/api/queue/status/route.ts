import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL =
  process.env.FASTAPI_URL ??
  "https://instagram-video-downloader-y1cb.onrender.com";

export async function GET(request: NextRequest) {
  const ticketId = request.nextUrl.searchParams.get("ticket_id");

  if (!ticketId) {
    return NextResponse.json(
      { success: false, message: "Missing ticket_id." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${FASTAPI_URL}/api/queue/status?ticket_id=${encodeURIComponent(ticketId)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );

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
