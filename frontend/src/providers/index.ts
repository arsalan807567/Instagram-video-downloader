import { MediaProvider } from "./MediaProvider";
import { MockMediaProvider } from "./MockMediaProvider";
import { FastAPIMediaProvider } from "./FastAPIMediaProvider";

let cachedProvider: MediaProvider | null = null;

export function getMediaProvider(): MediaProvider {
  if (cachedProvider) return cachedProvider;

  const configured = process.env.MEDIA_PROVIDER ?? "fastapi";

  switch (configured) {
    case "fastapi":
      cachedProvider = new FastAPIMediaProvider();
      return cachedProvider;

    case "mock":
      cachedProvider = new MockMediaProvider();
      return cachedProvider;

    default:
      throw new Error(
        `Unknown MEDIA_PROVIDER "${configured}".`,
      );
  }
}
