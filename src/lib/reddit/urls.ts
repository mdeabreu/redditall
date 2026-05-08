import { REDDIT_ORIGIN } from "./constants";
import { normalizeRedditSearchSort, normalizeRedditSort, normalizeRedditTimeRange, normalizeSubreddit } from "./normalize";
import type { RedditListingRequest } from "./types";

export function buildRedditListingUrl(request: RedditListingRequest = {}): string {
  const subreddit = normalizeSubreddit(request.subreddit);
  const query = normalizeSearchQuery(request.query);

  if (query) {
    const url = new URL(`/r/${encodeURIComponent(subreddit)}/search.json`, REDDIT_ORIGIN);
    applySearchParams(url, request, query);
    applyListingParams(url, request);
    url.searchParams.set("raw_json", "1");
    return url.toString();
  }

  const sort = normalizeRedditSort(request.sort);
  const pathname =
    sort === "hot"
      ? `/r/${encodeURIComponent(subreddit)}.json`
      : `/r/${encodeURIComponent(subreddit)}/${sort}.json`;
  const url = new URL(pathname, REDDIT_ORIGIN);

  applyListingParams(url, request);

  if (sort === "top") {
    url.searchParams.set("t", normalizeRedditTimeRange(request.timeRange));
  }

  url.searchParams.set("raw_json", "1");
  return url.toString();
}

export function buildRedditProxyUrl(request: RedditListingRequest = {}): string {
  const url = new URL("/api/reddit", "http://localhost");
  const query = normalizeSearchQuery(request.query);

  if (query) {
    url.searchParams.set("subreddit", normalizeSubreddit(request.subreddit));
    applySearchParams(url, request, query);
    applyListingParams(url, request);
    return `${url.pathname}${url.search}`;
  }

  const sort = normalizeRedditSort(request.sort);

  url.searchParams.set("subreddit", normalizeSubreddit(request.subreddit));
  url.searchParams.set("sort", sort);

  if (sort === "top") {
    url.searchParams.set("t", normalizeRedditTimeRange(request.timeRange));
  }

  applyListingParams(url, request);
  return `${url.pathname}${url.search}`;
}

function applySearchParams(url: URL, request: RedditListingRequest, query: string) {
  url.searchParams.set("q", query);
  url.searchParams.set("sort", normalizeRedditSearchSort(request.searchSort));

  if (request.restrictToSubreddit) {
    url.searchParams.set("restrict_sr", "on");
  }
}

function applyListingParams(url: URL, request: RedditListingRequest) {
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
}

function normalizeSearchQuery(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
