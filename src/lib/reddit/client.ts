import { REDDIT_ORIGIN } from "./constants";
import { isRecord } from "./guards";
import { parseRedditListing } from "./listing";
import { normalizeRedditSort, normalizeRedditTimeRange, normalizeSubreddit } from "./normalize";
import type { RedditListing, RedditListingRequest } from "./types";

export function buildRedditListingUrl(request: RedditListingRequest = {}): string {
  const subreddit = normalizeSubreddit(request.subreddit);
  const sort = normalizeRedditSort(request.sort);
  const pathname =
    sort === "hot"
      ? `/r/${encodeURIComponent(subreddit)}.json`
      : `/r/${encodeURIComponent(subreddit)}/${sort}.json`;
  const url = new URL(pathname, REDDIT_ORIGIN);

  if (request.after) {
    url.searchParams.set("after", request.after);
  }

  if (Number.isFinite(request.count) && request.count !== undefined) {
    url.searchParams.set("count", Math.max(0, Math.trunc(request.count)).toString());
  }

  if (Number.isFinite(request.limit) && request.limit !== undefined) {
    url.searchParams.set(
      "limit",
      Math.min(100, Math.max(1, Math.trunc(request.limit))).toString(),
    );
  }

  if (sort === "top") {
    url.searchParams.set("t", normalizeRedditTimeRange(request.timeRange));
  }

  url.searchParams.set("raw_json", "1");
  return url.toString();
}

export function buildRedditProxyUrl(request: RedditListingRequest = {}): string {
  const url = new URL("/api/reddit", "http://localhost");
  url.searchParams.set("subreddit", normalizeSubreddit(request.subreddit));
  url.searchParams.set("sort", normalizeRedditSort(request.sort));
  if (normalizeRedditSort(request.sort) === "top") {
    url.searchParams.set("t", normalizeRedditTimeRange(request.timeRange));
  }

  if (request.after) {
    url.searchParams.set("after", request.after);
  }

  if (Number.isFinite(request.count) && request.count !== undefined) {
    url.searchParams.set("count", Math.max(0, Math.trunc(request.count)).toString());
  }

  if (Number.isFinite(request.limit) && request.limit !== undefined) {
    url.searchParams.set(
      "limit",
      Math.min(100, Math.max(1, Math.trunc(request.limit))).toString(),
    );
  }

  return `${url.pathname}${url.search}`;
}

export async function fetchRedditListing(
  request: RedditListingRequest = {},
): Promise<RedditListing> {
  const subreddit = normalizeSubreddit(request.subreddit);
  const sort = normalizeRedditSort(request.sort);
  const normalizedRequest = { ...request, subreddit, sort };
  const directUrl = buildRedditListingUrl(normalizedRequest);
  const directPayload = typeof window === "undefined"
    ? null
    : await fetchBrowserRedditPayload(directUrl, request.signal);

  if (directPayload !== null) {
    return parseRedditListing(directPayload, { subreddit, sort });
  }

  const response = typeof window === "undefined"
    ? await fetchJson(directUrl, request.signal)
    : await fetchJson(buildRedditProxyUrl(normalizedRequest), request.signal);

  if (!response.ok) {
    if (request.fallbackUrl) {
      return fetchLocalRedditListing(request.fallbackUrl, { ...request, subreddit, sort });
    }

    const detail = await readErrorMessage(response);
    throw new Error(detail || `Reddit request failed with ${response.status} ${response.statusText}`);
  }

  return parseRedditListing(await response.json(), { subreddit, sort });
}

export async function fetchSubredditPage(
  request: RedditListingRequest = {},
): Promise<RedditListing> {
  return fetchRedditListing(request);
}

export async function fetchLocalRedditListing(
  url = "/all.json",
  request: RedditListingRequest = {},
): Promise<RedditListing> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    signal: request.signal,
  });

  if (!response.ok) {
    throw new Error(`Local Reddit fixture request failed with ${response.status} ${response.statusText}`);
  }

  return parseRedditListing(await response.json(), request);
}

async function readErrorMessage(response: Response): Promise<string | null> {
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
    return text || null;
  } catch {
    return null;
  }
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });
}

async function fetchBrowserRedditPayload(directUrl: string, signal?: AbortSignal): Promise<unknown | null> {
  try {
    const directResponse = await fetchJson(directUrl, signal);
    if (directResponse.ok) {
      return await directResponse.json();
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
  }

  try {
    return await fetchRedditJsonp(directUrl, signal);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
  }

  return null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function fetchRedditJsonp(url: string, signal?: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("JSONP is only available in the browser."));
      return;
    }

    if (signal?.aborted) {
      reject(new DOMException("The operation was aborted.", "AbortError"));
      return;
    }

    const callbackName = `__rillRedditJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const callbackTarget = window as unknown as Record<string, unknown>;
    const script = document.createElement("script");
    const jsonpUrl = new URL(url);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function cleanup() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      script.remove();
      signal?.removeEventListener("abort", onAbort);
      delete callbackTarget[callbackName];
    }

    function onAbort() {
      cleanup();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    }

    callbackTarget[callbackName] = (payload: unknown) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Reddit JSONP request failed."));
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Reddit JSONP request timed out."));
    }, 10000);

    signal?.addEventListener("abort", onAbort, { once: true });
    jsonpUrl.searchParams.set("jsonp", callbackName);
    script.src = jsonpUrl.toString();
    document.head.append(script);
  });
}
