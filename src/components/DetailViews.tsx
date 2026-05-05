import { ArrowLeft, ExternalLink, MessageSquare, Search, UserRound, X } from "@/components/FallbackIcon";
import type { FeedPost } from "@/lib/reddit";

type PanelProps = {
  post: FeedPost;
  onClose: () => void;
};

export function Drawer({
  open,
  subreddit,
  recentSubreddits = ["all"],
  onClose,
  onSubredditChange,
  onRemoveSubreddit,
}: {
  open: boolean;
  subreddit: string;
  recentSubreddits?: string[];
  onClose: () => void;
  onSubredditChange: (subreddit: string) => void;
  onRemoveSubreddit?: (subreddit: string) => void;
}) {
  if (!open) return null;

  const currentSubreddit = subreddit.replace(/^\/?r\//i, "").toLowerCase();
  const communities = recentSubreddits.length > 0 ? recentSubreddits : ["all"];

  return (
    <aside className="ar-overlay" aria-label="Navigation drawer">
      <div className="ar-scrim" onClick={onClose} />
      <nav className="ar-drawer">
        <div className="ar-panel-header">
          <div>
            <p className="ar-eyebrow">Communities</p>
            <h2>Choose a subreddit</h2>
          </div>
          <button className="ar-icon-button" type="button" aria-label="Close menu" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <label className="ar-drawer-search">
          <Search size={16} />
          <input
            defaultValue={`r/${subreddit}`}
            aria-label="Subreddit"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                const nextSubreddit = event.currentTarget.value.trim();
                if (nextSubreddit) {
                  onSubredditChange(nextSubreddit);
                }
                onClose();
              }
            }}
          />
        </label>
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
