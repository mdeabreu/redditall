import { createRedditHttpError } from "./errors";
import { parseRedditListing } from "./listing";
import { normalizeRedditSearchSort, normalizeRedditSort, normalizeSubreddit } from "./normalize";
import { fetchJson } from "./transport";
import type { RedditListing, RedditListingRequest } from "./types";
import { buildRedditListingUrl, buildRedditProxyUrl } from "./urls";

export async function fetchRedditListing(
  request: RedditListingRequest = {},
): Promise<RedditListing> {
  const subreddit = normalizeSubreddit(request.subreddit);
  const sort = normalizeRedditSort(request.sort);
  const query = typeof request.query === "string" ? request.query.trim() : "";
  const searchSort = normalizeRedditSearchSort(request.searchSort);
  const normalizedRequest = { ...request, subreddit, sort, query, searchSort };
  const { response, source } = typeof window === "undefined"
    ? {
        response: await fetchServerRedditListing(buildRedditListingUrl(normalizedRequest), request.signal),
        source: "server" as const,
      }
    : await fetchJson(buildRedditProxyUrl(normalizedRequest), { signal: request.signal, source: "proxy" });

  if (!response.ok) {
    if (request.fallbackUrl) {
      return fetchLocalRedditListing(request.fallbackUrl, { ...request, subreddit, sort, query, searchSort });
    }

    throw await createRedditHttpError(response, source);
  }

  return parseRedditListing(await response.json(), { subreddit, sort, query, searchSort });
}

async function fetchServerRedditListing(redditUrl: string, signal?: AbortSignal): Promise<Response> {
  const { fetchServerRedditResponse } = await import("./server");
  return fetchServerRedditResponse(redditUrl, signal);
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
  const { response } = await fetchJson(url, { signal: request.signal, source: "proxy" });

  if (!response.ok) {
    throw new Error(`Local Reddit fixture request failed with ${response.status} ${response.statusText}`);
  }

  return parseRedditListing(await response.json(), request);
}
