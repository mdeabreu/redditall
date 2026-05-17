import { ArrowLeft, ExternalLink, MessageSquare, Search, UserRound, X } from "@/components/FallbackIcon";
import { useThemePreference } from "@/hooks/useThemePreference";
import type { ThemePreference } from "@/lib/storage";
import type { FeedPost } from "@/lib/reddit";
import { useEffect, useState } from "react";

type PanelProps = {
  post: FeedPost;
  onClose: () => void;
};

export function Drawer({
  open,
  subreddit,
  searchQuery = "",
  restrictToSubreddit = true,
  recentSubreddits = ["all"],
  onClose,
  onSearch,
  onSubredditChange,
  onRemoveSubreddit,
}: {
  open: boolean;
  subreddit: string;
  searchQuery?: string;
  restrictToSubreddit?: boolean;
  recentSubreddits?: string[];
  onClose: () => void;
  onSearch: (query: string, restrictToSubreddit: boolean) => void;
  onSubredditChange: (subreddit: string) => void;
  onRemoveSubreddit?: (subreddit: string) => void;
}) {
  const [draftSearchQuery, setDraftSearchQuery] = useState(searchQuery);
  const [draftRestrictToSubreddit, setDraftRestrictToSubreddit] = useState(restrictToSubreddit);
  const { themePreference, setThemePreference } = useThemePreference();

  useEffect(() => {
    setDraftSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setDraftRestrictToSubreddit(restrictToSubreddit);
  }, [restrictToSubreddit]);

  if (!open) return null;

  const currentSubreddit = subreddit.replace(/^\/?r\//i, "").toLowerCase();
  const communities = recentSubreddits.length > 0 ? recentSubreddits : ["all"];

  return (
    <aside className="ar-overlay" aria-label="Navigation drawer">
      <div className="ar-scrim" onClick={onClose} />
      <nav className="ar-drawer">
        <div className="ar-panel-header">
          <div>
            <p className="ar-eyebrow">Search</p>
            <h2>Find posts</h2>
          </div>
          <button className="ar-icon-button" type="button" aria-label="Close menu" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form
          className="ar-drawer-search-form"
          onSubmit={(event) => {
            event.preventDefault();
            const normalizedQuery = draftSearchQuery.trim();
            if (!normalizedQuery) return;
            onSearch(normalizedQuery, draftRestrictToSubreddit);
            onClose();
          }}
        >
          <label className="ar-drawer-search">
            <Search size={16} />
            <input
              value={draftSearchQuery}
              aria-label="Search posts"
              placeholder="Search posts"
              enterKeyHint="search"
              onChange={(event) => setDraftSearchQuery(event.target.value)}
            />
          </label>
          <label className="ar-search-limit-toggle">
            <input
              type="checkbox"
              checked={draftRestrictToSubreddit}
              onChange={(event) => setDraftRestrictToSubreddit(event.target.checked)}
            />
            <span>Limit to r/{currentSubreddit}</span>
          </label>
          <button className="ar-primary-button ar-drawer-search-submit" type="submit" disabled={!draftSearchQuery.trim()}>
            Search
          </button>
        </form>
        <section className="ar-drawer-section" aria-labelledby="theme-control-heading">
          <p className="ar-eyebrow" id="theme-control-heading">Appearance</p>
          <div className="ar-theme-control" role="radiogroup" aria-label="Theme">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={themePreference === option.value ? "active" : ""}
                type="button"
                role="radio"
                aria-checked={themePreference === option.value}
                onClick={() => setThemePreference(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
        <div className="ar-drawer-list">
          {communities.map((name) => {
            const normalizedName = name.replace(/^\/?r\//i, "");
            const active = normalizedName.toLowerCase() === currentSubreddit;

            return (
              <div
                key={name}
                className={active ? "ar-drawer-row active" : "ar-drawer-row"}
              >
                <button
                  className="ar-drawer-list-button"
                  type="button"
                  onClick={() => {
                    onSubredditChange(name);
                    onClose();
                  }}
                >
                  <span>r/{normalizedName}</span>
                  {active ? <span aria-hidden="true">✓</span> : null}
                </button>
                {!active ? (
                  <button
                    className="ar-drawer-remove"
                    type="button"
                    aria-label={`Remove r/${normalizedName} from history`}
                    onClick={() => onRemoveSubreddit?.(name)}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

const themeOptions: Array<{ label: string; value: ThemePreference }> = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export function ProfileView({ post, onClose }: PanelProps) {
  return (
    <DetailPanel onClose={onClose} title={`u/${post.author}`}>
      <div className="ar-profile-hero">
        <div className="ar-profile-avatar">
          <UserRound size={34} />
        </div>
      </div>
      <section className="ar-profile-body">
        <h2>u/{post.author}</h2>
        <p>Joined from a post in r/{post.subreddit}. Recent activity is stored locally for this prototype.</p>
        <div className="ar-tabs" role="tablist" aria-label="Profile sections">
          <button type="button" className="active">Overview</button>
          <button type="button">Posts</button>
          <button type="button">Comments</button>
        </div>
        <MiniPost post={post} />
      </section>
    </DetailPanel>
  );
}

export function SubredditView({ post, onClose }: PanelProps) {
  return (
    <DetailPanel onClose={onClose} title={`r/${post.subreddit}`}>
      <div className="ar-subreddit-hero">
        <div className="ar-subreddit-orb">r/</div>
      </div>
      <section className="ar-profile-body">
        <h2>r/{post.subreddit}</h2>
        <p>{post.subreddit} posts, discussions, and links in a focused mobile feed.</p>
        <div className="ar-tabs" role="tablist" aria-label="Subreddit sort">
          <button type="button" className="active">Hot</button>
          <button type="button">New</button>
          <button type="button">Top</button>
        </div>
        <MiniPost post={post} />
      </section>
    </DetailPanel>
  );
}

export function CommentsView({
  post,
  loadingMore,
  onClose,
  onLoadMore,
}: PanelProps & {
  loadingMore?: boolean;
  onLoadMore: () => void;
}) {
  return (
    <DetailPanel onClose={onClose} title="Comments">
      <section className="ar-comments-body">
        <MiniPost post={post} />
        <div className="ar-tabs" role="tablist" aria-label="Comment sort">
          <button type="button" className="active">Best</button>
          <button type="button">New</button>
          <button type="button">Top</button>
        </div>
        {[
          "This is the kind of focused reader interface Reddit should make easier.",
          "The compact cards make scanning much calmer.",
          "Saving subreddits in the browser is perfect for a no-backend version."
        ].map((text, index) => (
          <article className="ar-comment" key={text}>
            <div className="ar-comment-avatar">
              <UserRound size={14} />
            </div>
            <div>
              <p className="ar-comment-meta">u/sample_user_{index + 1} · {index + 1}h ago</p>
              <p>{text}</p>
            </div>
          </article>
        ))}
        <button type="button" className="ar-load-more" onClick={onLoadMore} disabled={loadingMore}>
          <MessageSquare size={16} />
          {loadingMore ? "Loading more posts..." : "Fetch more posts"}
        </button>
      </section>
    </DetailPanel>
  );
}

function DetailPanel({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <aside className="ar-detail-panel" aria-label={title}>
      <header className="ar-detail-header">
        <button className="ar-icon-button" type="button" aria-label="Back to feed" onClick={onClose}>
          <ArrowLeft size={18} />
        </button>
        <h1>{title}</h1>
      </header>
      {children}
    </aside>
  );
}

function MiniPost({ post }: { post: FeedPost }) {
  return (
    <article className="ar-mini-post">
      <h3>{post.title}</h3>
      <p>
        by <a>u/{post.author}</a> in <a>r/{post.subreddit}</a>
      </p>
      <p>{formatCount(post.score)} points · {formatCount(post.comments)} comments</p>
      {post.domain ? (
        <a className="ar-external-link" href={post.url} target="_blank" rel="noreferrer">
          <ExternalLink size={14} />
          {post.domain}
        </a>
      ) : null}
    </article>
  );
}

function formatCount(value: number | string | undefined) {
  if (value === undefined) return "0";
  if (typeof value === "string") return value;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}
