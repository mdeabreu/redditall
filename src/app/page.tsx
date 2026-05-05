"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "@/components/FallbackIcon";
import { EmptyState, FeedShell, FeedSkeleton, LoadMoreButton, PostCard } from "@/components";
import { Drawer } from "@/components/DetailViews";
import { fetchSubredditPage, normalizeRedditSort, normalizeRedditTimeRange, normalizeSubreddit, REDDIT_SORTS, type FeedPost, type RedditTimeRange, type SortMode } from "@/lib/reddit";
import { readPrefs, writePrefs } from "@/lib/storage";

export default function HomePage() {
  const pathname = usePathname();
  const router = useRouter();
  const [subreddit, setSubreddit] = useState("all");
  const [sort, setSort] = useState<SortMode>("hot");
  const [timeRange, setTimeRange] = useState<RedditTimeRange>("day");
  const [recentSubreddits, setRecentSubreddits] = useState<string[]>(["all"]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [after, setAfter] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "loading-more" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      setQuery("");
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

  useEffect(() => {
    if (!prefsLoaded) return;

    void loadInitial(subreddit, sort, timeRange);
  }, [prefsLoaded, subreddit, sort, timeRange]);

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

  function handleSubredditChange(nextSubreddit: string) {
    setSubreddit(nextSubreddit);
    setQuery("");
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

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().replace(/^\/?r\//i, "").toLowerCase();
    if (!normalized) return posts;

    return posts.filter((post) =>
      [post.title, post.subreddit, post.author, post.domain, post.excerpt].join(" ").toLowerCase().includes(normalized)
    );
  }, [posts, query]);

  return (
    <main className="app-shell">
      <FeedShell
        subreddit={subreddit}
        sort={sort}
        timeRange={timeRange}
        onSortChange={handleSortChange}
        onTimeRangeChange={setTimeRange}
        onSubredditChange={handleSubredditChange}
        onMenu={() => setDrawerOpen(true)}
      >
        {message ? (
          <div className="notice notice-error">
            <AlertCircle size={18} />
            <span>{message}</span>
          </div>
        ) : null}

        {status === "loading" ? <FeedSkeleton /> : null}

        {status !== "loading" && filteredPosts.length === 0 ? (
          <EmptyState
            title={query ? `No results for "${query}"` : `r/${subreddit} has no posts yet`}
            description={query ? "Try different keywords or clear your search." : "Try another community or refresh the feed."}
            action={query ? "Clear search" : "Refresh"}
            onAction={() => (query ? setQuery("") : void loadInitial())}
          />
        ) : null}

        {status !== "loading" ? (
          <section className="feed-list" aria-label="Posts">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
              />
            ))}
          </section>
        ) : null}

        <LoadMoreButton
          disabled={!after || status === "loading" || status === "loading-more"}
          loading={status === "loading-more"}
          onClick={loadMore}
        />

        {status === "success" && posts.length > 0 ? (
          <div className="notice notice-success">
            <CheckCircle2 size={18} />
            <span>You're all caught up.</span>
          </div>
        ) : null}
      </FeedShell>

      <Drawer
        open={drawerOpen}
        subreddit={subreddit}
        recentSubreddits={recentSubreddits}
        onClose={() => setDrawerOpen(false)}
        onSubredditChange={handleSubredditChange}
        onRemoveSubreddit={handleRemoveSubreddit}
      />

      {status === "loading-more" ? (
        <div className="loading-toast" role="status">
          <Loader2 size={16} className="spin" />
          Loading more posts...
        </div>
      ) : null}
    </main>
  );
}

function readFeedRoute(pathname: string, search = ""): { subreddit: string; sort: SortMode; timeRange: RedditTimeRange } | null {
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Reddit request failed. Please try again in a moment.";
}
