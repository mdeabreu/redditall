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
  const response = typeof window === "undefined"
    ? await fetchJson(directUrl, request.signal)
    : await fetchJsonWithProxyFallback(directUrl, buildRedditProxyUrl(normalizedRequest), request.signal);

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

async function fetchJsonWithProxyFallback(
  directUrl: string,
  proxyUrl: string,
  signal?: AbortSignal,
): Promise<Response> {
  try {
    const directResponse = await fetchJson(directUrl, signal);
    if (directResponse.ok) {
      return directResponse;
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
  }

  return fetchJson(proxyUrl, signal);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
