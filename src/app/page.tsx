"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "@/components/FallbackIcon";
import { EmptyState, FeedShell, FeedSkeleton, LoadMoreButton, PostCard } from "@/components";
import { Drawer } from "@/components/DetailViews";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { useFeedPreferences } from "@/hooks/useFeedPreferences";

export default function HomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    subreddit,
    sort,
    searchQuery,
    searchSort,
    restrictToSubreddit,
    isSearchMode,
    timeRange,
    recentSubreddits,
    prefsLoaded,
    setTimeRange,
    onSubredditChange,
    onSortChange,
    onSearch,
    onSearchSortChange,
    onClearSearch,
    onRemoveSubreddit,
  } = useFeedPreferences();
  const { posts, after, status, message, loadInitial, loadMore } = useFeedPosts({
    subreddit,
    sort,
    searchQuery,
    searchSort,
    restrictToSubreddit,
    timeRange,
    enabled: prefsLoaded,
  });

  function handleSubredditChange(subreddit: string) {
    onSubredditChange(subreddit);
  }

  return (
    <main className="app-shell">
      <FeedShell
        subreddit={subreddit}
        sort={sort}
        searchMode={isSearchMode}
        searchSort={searchSort}
        timeRange={timeRange}
        onSortChange={onSortChange}
        onSearchSortChange={onSearchSortChange}
        onTimeRangeChange={setTimeRange}
        onSubredditChange={handleSubredditChange}
        onMenu={() => setDrawerOpen(true)}
      >
        {isSearchMode ? (
          <section className="ar-search-context" aria-label="Search results context">
            <div>
              <p className="ar-eyebrow">Search results</p>
              <h1>
                &quot;{searchQuery}&quot; {restrictToSubreddit ? `in r/${subreddit}` : "across Reddit"}
              </h1>
            </div>
            <button className="ar-secondary-button" type="button" onClick={onClearSearch}>
              Clear
            </button>
          </section>
        ) : null}

        {message ? (
          <div className="notice notice-error">
            <AlertCircle size={18} />
            <span>{message}</span>
          </div>
        ) : null}

        {status === "loading" ? <FeedSkeleton /> : null}

        {status !== "loading" && posts.length === 0 ? (
          <EmptyState
            title={isSearchMode ? `No results for "${searchQuery}"` : `r/${subreddit} has no posts yet`}
            description={isSearchMode ? "Try another search or remove the subreddit limit." : "Try another community or refresh the feed."}
            action={isSearchMode ? "Clear search" : "Refresh"}
            onAction={() => (isSearchMode ? onClearSearch() : void loadInitial())}
          />
        ) : null}

        {status !== "loading" ? (
          <section className="feed-list" aria-label="Posts">
            {posts.map((post) => (
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
        searchQuery={searchQuery}
        restrictToSubreddit={restrictToSubreddit}
        recentSubreddits={recentSubreddits}
        onClose={() => setDrawerOpen(false)}
        onSearch={onSearch}
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
