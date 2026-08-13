"use client";

import { FormEvent, useRef, useState } from "react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";
import { DownloaderResult } from "./DownloaderResult";
import { DownloaderState } from "./types";
import { looksLikeInstagramUrl } from "@/lib/validation/urlClient";
import { track, getDeviceType } from "@/lib/analytics/track";
import { MediaResult } from "@/providers/MediaProvider";

export function DownloaderForm() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<DownloaderState>({
    status: "idle",
  });
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  const clientLooksValid =
    url.length === 0 || looksLikeInstagramUrl(url);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setState({ status: "loading" });

    track("download_attempt", {
      device_type: getDeviceType(),
    });

    try {
      const response = await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          turnstileToken,
        }),
      });

      const result: MediaResult = await response.json();

      if (result.success) {
        setState({
          status: "success",
          result,
        });

        track("media_found", {
          content_type: result.type,
          result: "success",
          device_type: getDeviceType(),
        });
      } else {
        setState({
          status: "error",
          result,
        });

        track("download_failure", {
          result: "failure",
          failure_reason: result.code as never,
          device_type: getDeviceType(),
        });
      }
    } catch {
      const result: MediaResult = {
        success: false,
        code: "provider_error",
        message:
          "We're having trouble retrieving this video right now.",
      };

      setState({
        status: "error",
        result,
      });
    } finally {
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="flex-1">
          <label
            htmlFor="instagram-url"
            className="sr-only"
          >
            Paste Instagram URL
          </label>

          <Input
            id="instagram-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste Instagram URL"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);

              if (!hasStartedTyping) {
                setHasStartedTyping(true);

                track("url_pasted", {
                  device_type: getDeviceType(),
                });
              }
            }}
            error={
              !clientLooksValid
                ? "That doesn't look like a supported Instagram URL."
                : undefined
            }
          />
        </div>

        <Button
          type="submit"
          size="lg"
          isLoading={state.status === "loading"}
          disabled={
          url.trim().length === 0 ||
          !clientLooksValid
        }
        >
          Download
        </Button>
      </form>

      <div className="mt-3">
        <Turnstile
          ref={turnstileRef}
          siteKey={
            process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!
          }
          options={{ appearance: "interaction-only" }}
          onSuccess={(token) => {
            setTurnstileToken(token);
          }}
          onExpire={() => {
            setTurnstileToken(null);
          }}
          onError={() => {
            setTurnstileToken(null);
          }}
        />
      </div>

      <p className="mt-2 text-sm text-ink/50">
        No login required.
      </p>

      <div className="mt-4">
        {state.status === "loading" && <LoadingState />}

        {state.status === "error" && (
          <ErrorState code={state.result.code} />
        )}

        {state.status === "success" && (
          <DownloaderResult result={state.result} />
        )}
      </div>
    </div>
  );
}
