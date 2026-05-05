import { createRedditHttpError } from "./errors";
import { parseRedditListing } from "./listing";
import { normalizeRedditSort, normalizeSubreddit } from "./normalize";
import { fetchBrowserRedditPayload, fetchJson } from "./transport";
import type { RedditListing, RedditListingRequest } from "./types";
import { buildRedditListingUrl, buildRedditProxyUrl } from "./urls";

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
    return parseRedditListing(directPayload.payload, { subreddit, sort });
  }

  const { response, source } = typeof window === "undefined"
    ? await fetchJson(directUrl, { signal: request.signal, source: "server" })
    : await fetchJson(buildRedditProxyUrl(normalizedRequest), { signal: request.signal, source: "proxy" });

  if (!response.ok) {
    if (request.fallbackUrl) {
      return fetchLocalRedditListing(request.fallbackUrl, { ...request, subreddit, sort });
    }

    throw await createRedditHttpError(response, source);
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
  const { response } = await fetchJson(url, { signal: request.signal, source: "proxy" });

  if (!response.ok) {
    throw new Error(`Local Reddit fixture request failed with ${response.status} ${response.statusText}`);
  }

  return parseRedditListing(await response.json(), request);
}
