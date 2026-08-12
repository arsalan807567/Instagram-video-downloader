import { NextRequest } from "next/server";

const FASTAPI_URL =
  process.env.FASTAPI_URL ||
  "https://instagram-video-downloader-y1cb.onrender.com";

export async function GET(request: NextRequest) {
  const instagramUrl =
    request.nextUrl.searchParams.get("url");

  const formatId =
    request.nextUrl.searchParams.get("format_id");

  if (!instagramUrl) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing Instagram URL.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const backendUrl = new URL(
      `${FASTAPI_URL}/api/download`,
    );

    if (formatId) {
      backendUrl.searchParams.set(
        "format_id",
        formatId,
      );
    }

    const response = await fetch(
      backendUrl.toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: instagramUrl,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "FastAPI download error:",
        response.status,
        errorText,
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Unable to download this video right now.",
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const contentType =
      response.headers.get("content-type") ||
      "video/mp4";

    const contentDisposition =
      response.headers.get("content-disposition") ||
      'attachment; filename="instagram_video.mp4"';

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition":
          contentDisposition,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Download proxy error:",
      error,
    );

    return new Response(
      JSON.stringify({
        success: false,
        message:
          "Unable to connect to the video service.",
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
