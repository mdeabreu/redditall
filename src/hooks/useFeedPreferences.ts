"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  normalizeRedditSort,
  normalizeRedditSearchSort,
  normalizeRedditTimeRange,
  normalizeSubreddit,
  REDDIT_SORTS,
  type RedditSearchSort,
  type RedditTimeRange,
  type SortMode,
} from "@/lib/reddit";
import { readPrefs, writePrefs } from "@/lib/storage";

type FeedRoutePrefs = {
  subreddit: string;
  sort: SortMode;
  timeRange: RedditTimeRange;
  searchQuery: string;
  searchSort: RedditSearchSort;
  restrictToSubreddit: boolean;
};

type UseFeedPreferencesOptions = {
  onRouteSelectionChange?: () => void;
};

export function useFeedPreferences({ onRouteSelectionChange }: UseFeedPreferencesOptions = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [subreddit, setSubreddit] = useState("all");
  const [sort, setSort] = useState<SortMode>("hot");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSort, setSearchSort] = useState<RedditSearchSort>("relevance");
  const [restrictToSubreddit, setRestrictToSubreddit] = useState(true);
  const [timeRange, setTimeRange] = useState<RedditTimeRange>("day");
  const [recentSubreddits, setRecentSubreddits] = useState<string[]>(["all"]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  useEffect(() => {
    const prefs = readPrefs();
    const routePrefs = readFeedRoute(window.location.pathname, window.location.search);
    setSubreddit(routePrefs?.subreddit ?? prefs.subreddit);
    setSort(routePrefs?.sort ?? prefs.sort);
    setSearchQuery(routePrefs?.searchQuery ?? "");
    setSearchSort(routePrefs?.searchSort ?? "relevance");
    setRestrictToSubreddit(routePrefs?.restrictToSubreddit ?? true);
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

    const routePrefs = readFeedRoute(pathname, locationSearch);
    if (!routePrefs) return;

    if (
      routePrefs.subreddit !== subreddit ||
      routePrefs.sort !== sort ||
      routePrefs.timeRange !== timeRange ||
      routePrefs.searchQuery !== searchQuery ||
      routePrefs.searchSort !== searchSort ||
      routePrefs.restrictToSubreddit !== restrictToSubreddit
    ) {
      setSubreddit(routePrefs.subreddit);
      setSort(routePrefs.sort);
      setTimeRange(routePrefs.timeRange);
      setSearchQuery(routePrefs.searchQuery);
      setSearchSort(routePrefs.searchSort);
      setRestrictToSubreddit(routePrefs.restrictToSubreddit);
      onRouteSelectionChange?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationSearch, pathname, prefsLoaded]);

  useEffect(() => {
    if (!prefsLoaded) return;

    const prefs = writePrefs({ subreddit, sort });
    setRecentSubreddits(prefs.recentSubreddits.length > 0 ? prefs.recentSubreddits : ["all"]);
  }, [prefsLoaded, subreddit, sort]);

  useEffect(() => {
    if (!prefsLoaded) return;

    const nextPath = buildFeedPath({
      subreddit,
      sort,
      timeRange,
      searchQuery,
      searchSort,
      restrictToSubreddit,
    });
    const currentPath = `${pathname}${locationSearch}`;
    if (currentPath !== nextPath) {
      router.replace(nextPath, { scroll: false });
      setLocationSearch(nextPath.includes("?") ? `?${nextPath.split("?")[1]}` : "");
    }
  }, [locationSearch, pathname, prefsLoaded, restrictToSubreddit, router, searchQuery, searchSort, sort, subreddit, timeRange]);

  function handleSubredditChange(nextSubreddit: string) {
    setSubreddit(nextSubreddit);
    setSearchQuery("");
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

  function handleSearch(nextQuery: string, nextRestrictToSubreddit = true) {
    const normalizedQuery = nextQuery.trim();
    if (!normalizedQuery) {
      setSearchQuery("");
      return;
    }

    setSearchQuery(normalizedQuery);
    setSearchSort("relevance");
    setRestrictToSubreddit(nextRestrictToSubreddit);
  }

  function handleSearchSortChange(nextSearchSort: RedditSearchSort | string) {
    setSearchSort(normalizeRedditSearchSort(nextSearchSort));
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSearchSort("relevance");
    setRestrictToSubreddit(true);
  }

  return {
    subreddit,
    sort,
    searchQuery,
    searchSort,
    restrictToSubreddit,
    isSearchMode: searchQuery.trim().length > 0,
    timeRange,
    recentSubreddits,
    prefsLoaded,
    setTimeRange,
    onSubredditChange: handleSubredditChange,
    onSortChange: handleSortChange,
    onSearch: handleSearch,
    onSearchSortChange: handleSearchSortChange,
    onClearSearch: handleClearSearch,
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
  const searchQuery = rawSort === "search" ? searchParams.get("q")?.trim() ?? "" : "";

  return {
    subreddit: normalizeSubreddit(decodeURIComponent(rawSubreddit)),
    sort,
    timeRange: sort === "top" ? normalizeRedditTimeRange(searchParams.get("t")) : "day",
    searchQuery,
    searchSort: searchQuery ? normalizeRedditSearchSort(searchParams.get("sort")) : "relevance",
    restrictToSubreddit: searchQuery ? searchParams.get("restrict_sr") === "on" : true,
  };
}

function buildFeedPath({
  subreddit,
  sort,
  timeRange,
  searchQuery,
  searchSort,
  restrictToSubreddit,
}: {
  subreddit: string;
  sort: SortMode;
  timeRange: RedditTimeRange;
  searchQuery: string;
  searchSort: RedditSearchSort;
  restrictToSubreddit: boolean;
}): string {
  const normalizedSubreddit = encodeURIComponent(normalizeSubreddit(subreddit));
  const normalizedSearchQuery = searchQuery.trim();
  if (normalizedSearchQuery) {
    const searchParams = new URLSearchParams();
    searchParams.set("q", normalizedSearchQuery);
    if (restrictToSubreddit) {
      searchParams.set("restrict_sr", "on");
    }
    searchParams.set("sort", normalizeRedditSearchSort(searchSort));
    return `/r/${normalizedSubreddit}/search?${searchParams.toString()}`;
  }

  if (sort === "hot") return `/r/${normalizedSubreddit}`;

  const pathname = `/r/${normalizedSubreddit}/${sort}`;
  return sort === "top" ? `${pathname}?t=${normalizeRedditTimeRange(timeRange)}` : pathname;
}
