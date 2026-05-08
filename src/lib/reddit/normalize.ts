import { DEFAULT_SUBREDDIT, REDDIT_SEARCH_SORTS, REDDIT_SORTS, REDDIT_TIME_RANGES } from "./constants";
import type { RedditSearchSort, RedditSort, RedditTimeRange } from "./types";

export function isRedditSort(value: unknown): value is RedditSort {
  return typeof value === "string" && REDDIT_SORTS.includes(value as RedditSort);
}

export function normalizeRedditSort(value: unknown): RedditSort {
  return isRedditSort(value) ? value : "hot";
}

export function isRedditSearchSort(value: unknown): value is RedditSearchSort {
  return typeof value === "string" && REDDIT_SEARCH_SORTS.includes(value as RedditSearchSort);
}

export function normalizeRedditSearchSort(value: unknown): RedditSearchSort {
  return isRedditSearchSort(value) ? value : "relevance";
}

export function isRedditTimeRange(value: unknown): value is RedditTimeRange {
  return typeof value === "string" && REDDIT_TIME_RANGES.includes(value as RedditTimeRange);
}

export function normalizeRedditTimeRange(value: unknown): RedditTimeRange {
  return isRedditTimeRange(value) ? value : "day";
}

export function normalizeSubreddit(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_SUBREDDIT;
  }

  const trimmed = value.trim().replace(/^\/?r\//i, "").replace(/^\/+|\/+$/g, "");
  return trimmed || DEFAULT_SUBREDDIT;
}
