"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  normalizeRedditSort,
  normalizeRedditTimeRange,
  normalizeSubreddit,
  REDDIT_SORTS,
  type RedditTimeRange,
  type SortMode,
} from "@/lib/reddit";
import { readPrefs, writePrefs } from "@/lib/storage";

type FeedRoutePrefs = {
  subreddit: string;
  sort: SortMode;
  timeRange: RedditTimeRange;
};

type UseFeedPreferencesOptions = {
  onRouteSelectionChange?: () => void;
};

export function useFeedPreferences({ onRouteSelectionChange }: UseFeedPreferencesOptions = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [subreddit, setSubreddit] = useState("all");
  const [sort, setSort] = useState<SortMode>("hot");
  const [timeRange, setTimeRange] = useState<RedditTimeRange>("day");
  const [recentSubreddits, setRecentSubreddits] = useState<string[]>(["all"]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    const prefs = readPrefs();
    const routePrefs = readFeedRoute(window.location.pathname, window.location.search);
    setSubreddit(routePrefs?.subreddit ?? prefs.subreddit);
    setSort(routePrefs?.sort ?? prefs.sort);
    setTimeRange(routePrefs?.timeRange ?? "day");
    setRecentSubreddits(prefs.recentSubreddits.length > 0 ? prefs.recentSubreddits : ["all"]);
    setLocationSearch(window.location.search);
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    const syncLocationSearch = () => setLocationSearch(window.location.search);
    window.addEventListener("popstate", syncLocationSearch);
    return () => window.removeEventListener("popstate", syncLocationSearch);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;

    const routePrefs = readFeedRoute(pathname, window.location.search);
    if (!routePrefs) return;

    if (routePrefs.subreddit !== subreddit || routePrefs.sort !== sort || routePrefs.timeRange !== timeRange) {
      setSubreddit(routePrefs.subreddit);
      setSort(routePrefs.sort);
      setTimeRange(routePrefs.timeRange);
      onRouteSelectionChange?.();
    }
    setLocationSearch(window.location.search);
    // This responds to path navigation. Query changes from the time-range menu are state-driven below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, prefsLoaded]);

  useEffect(() => {
    if (!prefsLoaded) return;

    const prefs = writePrefs({ subreddit, sort });
    setRecentSubreddits(prefs.recentSubreddits.length > 0 ? prefs.recentSubreddits : ["all"]);
  }, [prefsLoaded, subreddit, sort]);

  useEffect(() => {
    if (!prefsLoaded) return;

    const nextPath = buildFeedPath(subreddit, sort, timeRange);
    const currentPath = `${pathname}${locationSearch}`;
    if (currentPath !== nextPath) {
      router.replace(nextPath, { scroll: false });
      setLocationSearch(nextPath.includes("?") ? `?${nextPath.split("?")[1]}` : "");
    }
  }, [locationSearch, pathname, prefsLoaded, router, sort, subreddit, timeRange]);

  function handleSubredditChange(nextSubreddit: string) {
    setSubreddit(nextSubreddit);
  }

  function handleSortChange(nextSort: SortMode) {
    setSort(nextSort);
    if (nextSort === "top") {
      setTimeRange((currentTimeRange) => currentTimeRange || "day");
    }
  }

  function handleRemoveSubreddit(removedSubreddit: string) {
    const removedKey = normalizeSubreddit(removedSubreddit).toLowerCase();
    const nextRecentSubreddits = recentSubreddits.filter(
      (recentSubreddit) => normalizeSubreddit(recentSubreddit).toLowerCase() !== removedKey,
    );
    const prefs = writePrefs({ recentSubreddits: nextRecentSubreddits });
    setRecentSubreddits(prefs.recentSubreddits.length > 0 ? prefs.recentSubreddits : ["all"]);
  }

  return {
    subreddit,
    sort,
    timeRange,
    recentSubreddits,
    prefsLoaded,
    setTimeRange,
    onSubredditChange: handleSubredditChange,
    onSortChange: handleSortChange,
    onRemoveSubreddit: handleRemoveSubreddit,
  };
}

function readFeedRoute(pathname: string, search = ""): FeedRoutePrefs | null {
  const [, root, rawSubreddit, rawSort] = pathname.split("/");
  if (root !== "r" || !rawSubreddit) {
    return null;
  }

  const sort = REDDIT_SORTS.includes(rawSort as SortMode) ? normalizeRedditSort(rawSort) : "hot";
  const searchParams = new URLSearchParams(search);

  return {
    subreddit: normalizeSubreddit(decodeURIComponent(rawSubreddit)),
    sort,
    timeRange: sort === "top" ? normalizeRedditTimeRange(searchParams.get("t")) : "day",
  };
}

function buildFeedPath(subreddit: string, sort: SortMode, timeRange: RedditTimeRange): string {
  const normalizedSubreddit = encodeURIComponent(normalizeSubreddit(subreddit));
  if (sort === "hot") return `/r/${normalizedSubreddit}`;

  const pathname = `/r/${normalizedSubreddit}/${sort}`;
  return sort === "top" ? `${pathname}?t=${normalizeRedditTimeRange(timeRange)}` : pathname;
}
