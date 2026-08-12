import { MediaResult } from "@/providers/MediaProvider";

export type DownloaderState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: Extract<MediaResult, { success: true }> }
  | { status: "error"; result: Extract<MediaResult, { success: false }> };
