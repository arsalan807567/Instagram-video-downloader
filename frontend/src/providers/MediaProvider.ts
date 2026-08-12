export type NormalizedContentType = "video" | "reel" | "photo";

export interface NormalizedQuality {
  label: "360p" | "480p" | "720p" | "1080p";
  width: number;
  height: number;
  fileSize?: string;
  downloadUrl: string;
}

export interface NormalizedMedia {
  success: true;
  type: NormalizedContentType;
  thumbnail: string;
  duration?: number; // seconds, video/reel only
  qualities: NormalizedQuality[];
}

export type MediaErrorCode =
  | "invalid_url"
  | "unsupported_content"
  | "private_content"
  | "media_unavailable"
  | "provider_error"
  | "timeout"
  | "rate_limited";

export interface NormalizedError {
  success: false;
  code: MediaErrorCode;
  message: string;
}

export type MediaResult = NormalizedMedia | NormalizedError;

/**
 * Every media retrieval implementation must conform to this interface.
 * The API route and the frontend depend only on this contract, never on
 * a concrete provider - so swapping providers never touches UI code.
 */
export interface MediaProvider {
  /** Cheap, synchronous check: can this provider possibly handle the URL? */
  canHandle(normalizedUrl: string): boolean;

  /** Does the actual retrieval. Must never throw - return NormalizedError instead. */
  getMedia(normalizedUrl: string): Promise<MediaResult>;
}
