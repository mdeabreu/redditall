"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "@/components/FallbackIcon";
import { EmptyState, FeedShell, FeedSkeleton, LoadMoreButton, PostCard } from "@/components";
import { Drawer } from "@/components/DetailViews";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useFeedPreferences } from "@/hooks/useFeedPreferences";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    subreddit,
    sort,
    timeRange,
    recentSubreddits,
    prefsLoaded,
    setTimeRange,
    onSubredditChange,
    onSortChange,
    onRemoveSubreddit,
  } = useFeedPreferences({ onRouteSelectionChange: () => setQuery("") });
  const { posts, after, status, message, loadInitial, loadMore } = useFeedPosts({
    subreddit,
    sort,
    timeRange,
    enabled: prefsLoaded,
  });

  function handleSubredditChange(subreddit: string) {
    onSubredditChange(subreddit);
    setQuery("");
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
        onSortChange={onSortChange}
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
        onRemoveSubreddit={onRemoveSubreddit}
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
