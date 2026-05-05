import { isRecord } from "./guards";
import type { RedditFetchSource } from "./transport";

export class RedditFetchError extends Error {
  readonly source: RedditFetchSource;
  readonly status?: number;
  readonly statusText?: string;

  constructor({
    message,
    source,
    status,
    statusText,
  }: {
    message: string;
    source: RedditFetchSource;
    status?: number;
    statusText?: string;
  }) {
    super(message);
    this.name = "RedditFetchError";
    this.source = source;
    this.status = status;
    this.statusText = statusText;
  }
}

export async function createRedditHttpError(response: Response, source: RedditFetchSource): Promise<RedditFetchError> {
  const detail = await readErrorMessage(response);
  const summary = `Reddit request failed with ${response.status} ${response.statusText}`;
  const sourceLabel = `Source: ${source}`;

  return new RedditFetchError({
    message: [summary, sourceLabel, detail].filter(Boolean).join(". "),
    source,
    status: response.status,
    statusText: response.statusText,
  });
}

export function createRedditNetworkError(error: unknown, source: RedditFetchSource): RedditFetchError {
  const detail = error instanceof Error ? error.message : "Unknown network error";
  return new RedditFetchError({
    message: `Reddit request could not be completed. Source: ${source}. ${detail}`,
    source,
  });
}

export async function readErrorMessage(response: Response, maxLength = 500): Promise<string | null> {
  try {
    const payload = await response.clone().json();
    if (isRecord(payload) && typeof payload.message === "string") {
      return payload.message;
    }
  } catch {
    // Fall back to plain text below.
  }

  try {
    const text = (await response.text()).trim();
    return text ? `Upstream response: ${text.slice(0, maxLength)}` : null;
  } catch {
    return null;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
