import { MediaProvider } from "./MediaProvider";
import { MockMediaProvider } from "./MockMediaProvider";
import { FastAPIMediaProvider } from "./FastAPIMediaProvider";

let cachedProvider: MediaProvider | null = null;

/**
 * Select the media provider from the environment.
 *
 * mock:
 *   Development/testing only.
 *
 * fastapi:
 *   Production provider backed by the Render FastAPI service.
 */
export function getMediaProvider(): MediaProvider {
  if (cachedProvider) return cachedProvider;

  const configured = process.env.MEDIA_PROVIDER ?? "mock";
  const isProduction =
    process.env.NEXT_PUBLIC_APP_ENV === "production";

  if (isProduction && configured === "mock") {
    throw new Error(
      "MEDIA_PROVIDER=mock is not allowed in production. " +
        "Configure MEDIA_PROVIDER=fastapi.",
    );
  }

  switch (configured) {
    case "mock":
      cachedProvider = new MockMediaProvider();
      return cachedProvider;

    case "fastapi":
      cachedProvider = new FastAPIMediaProvider();
      return cachedProvider;

    default:
      throw new Error(
        `Unknown MEDIA_PROVIDER "${configured}". ` +
          "No implementation is registered.",
      );
  }
}
