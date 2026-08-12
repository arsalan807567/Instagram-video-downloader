import { MediaProvider } from "./MediaProvider";
import { MockMediaProvider } from "./MockMediaProvider";

let cachedProvider: MediaProvider | null = null;

/**
 * Reads MEDIA_PROVIDER from the environment and returns the matching
 * implementation. This is the ONLY place provider selection happens.
 *
 * Guardrail: in production, an unset or "mock" value throws at request
 * time instead of silently serving demo data to real users. Add new
 * providers here as a case in the switch - never import a concrete
 * provider anywhere outside this file and MockMediaProvider's own tests.
 */
export function getMediaProvider(): MediaProvider {
  if (cachedProvider) return cachedProvider;

  const configured = process.env.MEDIA_PROVIDER ?? "mock";
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

  if (isProduction && configured === "mock") {
    throw new Error(
      "MEDIA_PROVIDER=mock is not allowed in production. Configure an " +
        "approved production provider before deploying, or leave the " +
        "environment as staging/development.",
    );
  }

  switch (configured) {
    case "mock":
      cachedProvider = new MockMediaProvider();
      return cachedProvider;

    // Add approved production providers here, e.g.:
    // case "example-provider":
    //   cachedProvider = new ExampleProvider();
    //   return cachedProvider;

    default:
      throw new Error(
        `Unknown MEDIA_PROVIDER "${configured}". No implementation is ` +
          `registered for this value in src/providers/index.ts.`,
      );
  }
}
