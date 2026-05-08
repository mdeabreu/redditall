import type { ReactNode } from "react";

import { PostCardSkeleton } from "../post/PostCardSkeleton";
import { MobileHeader } from "./MobileHeader";
import { SearchSortChip, SortChip, TimeRangeChip } from "./SortChip";
import type { SearchSortKey, SortKey, TimeRangeKey } from "./types";

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="ar-feed-stack" aria-label="Loading posts">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} media={index === 1} />
      ))}
    </div>
  );
}

export function FeedShell({
  subreddit,
  sort = "hot",
  searchSort = "relevance",
  searchMode = false,
  timeRange = "day",
  onSortChange,
  onSearchSortChange,
  onTimeRangeChange,
  onSubredditChange,
  onMenu,
  children,
  footer,
}: {
  subreddit?: string;
  sort?: SortKey;
  searchSort?: SearchSortKey;
  searchMode?: boolean;
  timeRange?: TimeRangeKey;
  onSortChange?: (sort: SortKey) => void;
  onSearchSortChange?: (sort: SearchSortKey) => void;
  onTimeRangeChange?: (timeRange: TimeRangeKey) => void;
  onSubredditChange?: (subreddit: string) => void;
  onMenu?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="ar-feed-shell">
      <MobileHeader subreddit={subreddit} onMenuClick={onMenu} onSubredditChange={onSubredditChange} />
      <div className="ar-sort-row">
        {searchMode ? (
          <SearchSortChip value={searchSort} onChange={onSearchSortChange} />
        ) : (
          <>
            <SortChip value={sort} onChange={onSortChange} />
            {sort === "top" ? <TimeRangeChip value={timeRange} onChange={onTimeRangeChange} /> : null}
          </>
        )}
      </div>
      <div className="ar-feed-stack">{children}</div>
      {footer ? <div className="ar-feed-footer">{footer}</div> : null}
    </section>
  );
}
