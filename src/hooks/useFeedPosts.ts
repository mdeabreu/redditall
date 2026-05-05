"use client";

import { useEffect, useState } from "react";
import {
  fetchSubredditPage,
  type FeedPost,
  type RedditTimeRange,
  type SortMode,
} from "@/lib/reddit";

export type FeedStatus = "idle" | "loading" | "loading-more" | "error" | "success";

type UseFeedPostsOptions = {
  subreddit: string;
  sort: SortMode;
  timeRange: RedditTimeRange;
  enabled: boolean;
};

export function useFeedPosts({ subreddit, sort, timeRange, enabled }: UseFeedPostsOptions) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState<FeedStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!enabled) return;

    void loadInitial(subreddit, sort, timeRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, subreddit, sort, timeRange]);

  async function loadInitial(nextSubreddit = subreddit, nextSort = sort, nextTimeRange = timeRange) {
    setStatus("loading");
    setMessage("");

    try {
      const page = await fetchSubredditPage({ subreddit: nextSubreddit, sort: nextSort, timeRange: nextTimeRange, limit: 25 });
      if (page.posts.length === 0 && nextSubreddit === "all") {
        throw new Error("Empty Reddit response for r/all");
      }
      setPosts(page.posts);
      setAfter(page.after);
      setCount(page.posts.length);
      setStatus("success");
    } catch (error) {
      setPosts([]);
      setAfter(null);
      setCount(0);
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function loadMore() {
    if (!after) return;
    setStatus("loading-more");

    try {
      const page = await fetchSubredditPage({ subreddit, sort, timeRange, after, count, limit: 25 });
      setPosts((current) => [...current, ...page.posts]);
      setAfter(page.after);
      setCount((current) => current + page.posts.length);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  return {
    posts,
    after,
    status,
    message,
    loadInitial,
    loadMore,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Reddit request failed. Please try again in a moment.";
}
