import { DEFAULT_SUBREDDIT, REDDIT_SORTS, REDDIT_TIME_RANGES } from "./constants";
import type { RedditSort, RedditTimeRange } from "./types";

export function isRedditSort(value: unknown): value is RedditSort {
  return typeof value === "string" && REDDIT_SORTS.includes(value as RedditSort);
}

export function normalizeRedditSort(value: unknown): RedditSort {
  return isRedditSort(value) ? value : "hot";
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
