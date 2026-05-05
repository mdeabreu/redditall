import Hls from "hls.js";
import { DropdownMenu } from "radix-ui";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type PostKind = "text" | "image" | "gif" | "link" | "video";
export type SortKey = "hot" | "top" | "new" | "rising" | "controversial" | "best";
export type TimeRangeKey = "hour" | "day" | "week" | "month" | "year" | "all";

export type RedditPostCardData = {
  id: string;
  title: string;
  kind?: PostKind;
  author: string;
  subreddit: string;
  score?: number | string;
  comments?: number | string;
  createdUtc?: number;
  createdAt?: string;
  body?: string;
  excerpt?: string;
  url?: string | null;
  domain?: string;
  imageUrl?: string | null;
  image?: string | null;
  animatedImageUrl?: string | null;
  galleryImages?: string[];
  video?: string | null;
  videoUrl?: string | null;
  hlsUrl?: string | null;
  fallbackVideoUrl?: string | null;
  richVideoEmbedUrl?: string | null;
  videoPosterUrl?: string | null;
  videoWidth?: number | null;
  videoHeight?: number | null;
  mediaUrl?: string | null;
  mediaKind?: string;
  permalink?: string;
  redditUrl?: string | null;
  commentCount?: number;
  thumbnail?: string | null;
  thumbnailUrl?: string | null;
  flair?: string | null;
  over18?: boolean;
  isStickied?: boolean;
  stickied?: boolean;
};

type IconName =
  | "alert"
  | "chevron"
  | "external"
  | "hot"
  | "image"
  | "link"
  | "menu"
  | "pin"
  | "refresh"
  | "search"
  | "text"
  | "video";

const iconPaths: Record<IconName, ReactNode> = {
  alert: (
    <>
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.7 2.4 17.4A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.6L13.7 3.7a2 2 0 0 0-3.4 0Z" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  external: (
    <>
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </>
  ),
  hot: (
    <>
      <path d="M8.5 14.5A3.5 3.5 0 0 0 12 20a3.5 3.5 0 0 0 3.5-5.5c-.7-1-1.5-1.7-1.5-3.5-1.4.8-2.4 1.9-2.8 3.4-.9-1.5-.7-3.3.3-5.4-2.8 1.5-5 3.3-3 5.5Z" />
      <path d="M13 3c3 2.6 5 5.4 5 9a6 6 0 1 1-12 0c0-3 2.1-5.8 5.5-9" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 16 5-5 4 4 2-2 7 7" />
      <path d="M15 9h.01" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  pin: (
    <>
      <path d="M12 17v5" />
      <path d="m5 17 14 0" />
      <path d="M8 17 9.5 9 7 6.5 8.5 5h7L17 6.5 14.5 9 16 17" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 0 1-15.3 6.4" />
      <path d="M3 12A9 9 0 0 1 18.3 5.6" />
      <path d="M18 2v4h-4" />
      <path d="M6 22v-4h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  text: (
    <>
      <path d="M6 6h12" />
      <path d="M6 12h12" />
      <path d="M6 18h7" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ?? "ar-icon"}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      {iconPaths[name]}
    </svg>
  );
}

const sortLabels: Record<SortKey, string> = {
  hot: "Hot",
  top: "Top",
  new: "New",
  rising: "Rising",
  controversial: "Controversial",
  best: "Best",
};

const timeRangeLabels: Record<TimeRangeKey, string> = {
  hour: "Hour",
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
  all: "All",
};

const badgeConfig: Record<PostKind, { label: string; icon: IconName }> = {
  text: { label: "Text", icon: "text" },
  image: { label: "Image", icon: "image" },
  gif: { label: "GIF", icon: "image" },
  link: { label: "Link", icon: "link" },
  video: { label: "Video", icon: "video" },
};

export function MobileHeader({
  subreddit = "all",
  onMenuClick,
  onSubredditChange,
}: {
  subreddit?: string;
  onMenuClick?: () => void;
  onSubredditChange?: (subreddit: string) => void;
}) {
  const displaySubreddit = subreddit.startsWith("r/") ? subreddit : `r/${subreddit}`;
  const [draftSubreddit, setDraftSubreddit] = useState(displaySubreddit);

  useEffect(() => {
    setDraftSubreddit(displaySubreddit);
  }, [displaySubreddit]);

  function commitSubreddit(value: string) {
    const nextSubreddit = value.trim().replace(/^\/?r\//i, "");
    if (!nextSubreddit) {
      setDraftSubreddit(displaySubreddit);
      return;
    }

    setDraftSubreddit(`r/${nextSubreddit}`);
    if (nextSubreddit !== subreddit.replace(/^\/?r\//i, "")) {
      onSubredditChange?.(nextSubreddit);
    }
  }

  return (
    <header className="ar-mobile-header" aria-label="Primary navigation">
      <button className="ar-icon-button" type="button" aria-label="Open menu" onClick={onMenuClick}>
        <Icon name="menu" />
      </button>
      <form
        className="ar-current-subreddit"
        aria-label="Current subreddit"
        onSubmit={(event) => {
          event.preventDefault();
          const field = event.currentTarget.elements.namedItem("subreddit");
          commitSubreddit(field instanceof HTMLInputElement ? field.value : draftSubreddit);
        }}
      >
        <input
          name="subreddit"
          type="search"
          aria-label="Current subreddit"
          value={draftSubreddit}
          enterKeyHint="go"
          spellCheck={false}
          onChange={(event) => setDraftSubreddit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitSubreddit(event.currentTarget.value);
            }
          }}
          onBlur={(event) => {
            if (event.currentTarget.value === displaySubreddit) return;
            commitSubreddit(event.currentTarget.value);
          }}
          onFocus={(event) => event.currentTarget.select()}
        />
      </form>
    </header>
  );
}

export function SortChip({
  value = "hot",
  disabled,
  onChange,
}: {
  value?: SortKey;
  disabled?: boolean;
  onChange?: (value: SortKey) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button className="ar-sort-chip" type="button" aria-label="Sort posts">
          <Icon name={value === "hot" ? "hot" : "text"} />
          <span>{sortLabels[value]}</span>
          <Icon name="chevron" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="ar-sort-menu-content" align="start" sideOffset={6}>
          <DropdownMenu.RadioGroup value={value} onValueChange={(nextValue) => onChange?.(nextValue as SortKey)}>
            {Object.entries(sortLabels).map(([key, label]) => (
              <DropdownMenu.RadioItem key={key} className="ar-sort-menu-item" value={key}>
                <span>{label}</span>
                <DropdownMenu.ItemIndicator className="ar-sort-menu-indicator">✓</DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function TimeRangeChip({
  value = "day",
  disabled,
  onChange,
}: {
  value?: TimeRangeKey;
  disabled?: boolean;
  onChange?: (value: TimeRangeKey) => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button className="ar-sort-chip ar-time-chip" type="button" aria-label="Top posts time range">
          <span>{timeRangeLabels[value]}</span>
          <Icon name="chevron" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="ar-sort-menu-content" align="start" sideOffset={6}>
          <DropdownMenu.RadioGroup value={value} onValueChange={(nextValue) => onChange?.(nextValue as TimeRangeKey)}>
            {Object.entries(timeRangeLabels).map(([key, label]) => (
              <DropdownMenu.RadioItem key={key} className="ar-sort-menu-item" value={key}>
                <span>{label}</span>
                <DropdownMenu.ItemIndicator className="ar-sort-menu-indicator">✓</DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function PostTypeBadge({ kind = "text" }: { kind?: PostKind }) {
  const badge = badgeConfig[kind];
  return (
    <span className="ar-post-badge">
      <Icon name={badge.icon} />
      {badge.label}
    </span>
  );
}

function StickiedBadge() {
  return (
    <span className="ar-stickied-badge">
      <Icon name="pin" />
      Pinned
    </span>
  );
}

export function PostCard({
  post,
}: {
  post: RedditPostCardData;
  onOpenAuthor?: () => void;
  onOpenSubreddit?: () => void;
  onOpenComments?: () => void;
}) {
  const kind = post.kind ?? inferPostKind(post);
  const galleryImages = post.galleryImages ?? [];
  const imageUrl = post.animatedImageUrl ?? post.imageUrl ?? post.image ?? undefined;
  const thumbnailUrl = post.thumbnailUrl ?? post.thumbnail ?? undefined;
  const linkMediaUrl = kind === "link" ? imageUrl ?? thumbnailUrl : undefined;
  const isStickied = post.isStickied === true || post.stickied === true;
  const body = post.body ?? post.excerpt;
  const title = (
    <a className="ar-post-title" href={post.redditUrl ?? post.url ?? "#"}>
      {post.title}
    </a>
  );

  return (
    <article className={`ar-post-card ar-post-card-${kind}`}>
      {kind === "image" && galleryImages.length > 1 ? (
        <div className="ar-gallery-stack" aria-label={`${galleryImages.length} gallery images`}>
          {galleryImages.map((galleryImage, index) => (
            <figure className="ar-gallery-item" key={`${galleryImage}-${index}`}>
              <img className="ar-post-image" src={galleryImage} alt="" loading="lazy" />
              <figcaption>{index + 1} / {galleryImages.length}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      {kind === "image" && galleryImages.length <= 1 && imageUrl ? (
        <img className="ar-post-image" src={imageUrl} alt="" loading="lazy" />
      ) : null}
      {kind === "gif" && imageUrl ? (
        <img className="ar-post-image ar-gif-image" src={imageUrl} alt="" loading="lazy" />
      ) : null}
      {kind === "link" && linkMediaUrl ? (
        <a
          className="ar-link-media-link"
          href={post.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open link: ${post.title}`}
        >
          <img className="ar-post-image ar-link-image" src={linkMediaUrl} alt="" loading="lazy" />
        </a>
      ) : null}
      {kind === "video" ? (
        <VideoPostMedia post={post} posterUrl={post.videoPosterUrl ?? imageUrl ?? thumbnailUrl} />
      ) : null}

      <div className="ar-post-content">
        <div className="ar-post-badge-row">
          <PostTypeBadge kind={kind} />
          {isStickied ? <StickiedBadge /> : null}
        </div>

        {kind === "link" ? (
          <div className="ar-link-copy">
            {title}
            {body ? <p className="ar-post-snippet">{body}</p> : null}
          </div>
        ) : (
          <>
            {title}
            {kind === "text" && body ? <p className="ar-post-snippet">{body}</p> : null}
          </>
        )}

        {post.flair ? <span className="ar-flair">{post.flair}</span> : null}
        <PostMeta post={post} />
      </div>
    </article>
  );
}

function VideoPostMedia({
  post,
  posterUrl,
}: {
  post: RedditPostCardData;
  posterUrl?: string | null;
}) {
  const rawVideoUrl = post.videoUrl ?? post.video ?? undefined;
  const hlsUrl = post.hlsUrl ?? (rawVideoUrl?.includes(".m3u8") ? rawVideoUrl : undefined);
  const fallbackVideoUrl = post.fallbackVideoUrl ?? (rawVideoUrl && !rawVideoUrl.includes(".m3u8") ? rawVideoUrl : undefined);
  const richVideoEmbedUrl = post.richVideoEmbedUrl ?? undefined;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState<string | null>(
    getAspectRatio(post.videoWidth, post.videoHeight),
  );
  const [sourceKind, setSourceKind] = useState<"hls" | "fallback">(hlsUrl ? "hls" : "fallback");
  const [failed, setFailed] = useState(false);
  const redditUrl = post.redditUrl ?? post.url ?? "#";
  const mediaStyle: CSSProperties | undefined = mediaAspectRatio
    ? { aspectRatio: mediaAspectRatio }
    : undefined;

  const rememberAspectRatio = (width: number, height: number) => {
    if (width > 0 && height > 0) {
      setMediaAspectRatio((currentRatio) => currentRatio ?? `${width} / ${height}`);
    }
  };

  useEffect(() => {
    if (!active || failed || richVideoEmbedUrl) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const failPlayback = () => {
      if (cancelled) return;

      if (sourceKind === "hls" && fallbackVideoUrl) {
        setSourceKind("fallback");
        return;
      }

      setFailed(true);
    };

    const playVideo = () => {
      video.play().catch(failPlayback);
    };

    video.addEventListener("error", failPlayback);

    if (sourceKind === "hls" && hlsUrl) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        playVideo();
      } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.on(Hls.Events.ERROR, (_event: string, data: { fatal?: boolean }) => {
          if (data.fatal) failPlayback();
        });
        hls.on(Hls.Events.MANIFEST_PARSED, playVideo);
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      } else {
        failPlayback();
      }
    } else if (fallbackVideoUrl) {
      video.src = fallbackVideoUrl;
      playVideo();
    } else {
      failPlayback();
    }

    return () => {
      cancelled = true;
      video.removeEventListener("error", failPlayback);
      hls?.destroy();
    };
  }, [active, failed, fallbackVideoUrl, hlsUrl, richVideoEmbedUrl, sourceKind]);

  if (failed) {
    return (
      <div className="ar-video-fallback">
        <a href={redditUrl} target="_blank" rel="noreferrer">
          Open on reddit.com
        </a>
      </div>
    );
  }

  if (active) {
    if (richVideoEmbedUrl) {
      return (
        <div className="ar-video-player-wrap" style={mediaStyle}>
          <iframe
            className="ar-video-player ar-video-embed"
            src={withAutoplay(richVideoEmbedUrl)}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <div className="ar-video-player-wrap" style={mediaStyle}>
        <video
          ref={videoRef}
          className="ar-video-player"
          controls
          playsInline
          autoPlay
          poster={posterUrl ?? undefined}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            rememberAspectRatio(video.videoWidth, video.videoHeight);
          }}
        />
      </div>
    );
  }

  return (
    <button className="ar-video-poster" type="button" style={mediaStyle} onClick={() => setActive(true)} aria-label={`Play video: ${post.title}`}>
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          loading="lazy"
          onLoad={(event) => {
            const image = event.currentTarget;
            rememberAspectRatio(image.naturalWidth, image.naturalHeight);
          }}
        />
      ) : (
        <span className="ar-video-empty" aria-hidden="true" />
      )}
      <span className="ar-video-badge">
        <Icon name="video" />
        Video
      </span>
      <span className="ar-video-play" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

export function PostMeta({
  post,
}: {
  post: RedditPostCardData;
  onOpenAuthor?: () => void;
  onOpenSubreddit?: () => void;
  onOpenComments?: () => void;
}) {
  const subreddit = post.subreddit.replace(/^r\//, "");
  const comments = post.commentCount ?? post.comments;
  const kind = post.kind ?? inferPostKind(post);
  const age = formatRelativePostAge(post);

  return (
    <div className="ar-post-meta">
      <p className="ar-post-meta-line ar-post-byline">
        by{" "}
        <a
          href={`https://www.reddit.com/user/${post.author}`}
        >
          {post.author}
        </a>
        {" "}in{" "}
        <a
          href={`/r/${subreddit}`}
        >
          r/{subreddit}
        </a>
        {age ? (
          <>
            <span aria-hidden="true" className="ar-meta-dot">•</span>
            <span>{age}</span>
          </>
        ) : null}
      </p>
      <p className="ar-post-meta-line ar-post-stats-line">
        <span>{formatCount(post.score)} points</span>
        <span aria-hidden="true" className="ar-meta-dot">•</span>
        <a
          href={`${post.redditUrl ?? post.url ?? "#"}#comments`}
        >
          {formatCommentCount(comments)}
        </a>
      </p>
      {kind === "link" && post.domain ? (
        <p className="ar-post-meta-line ar-post-domain-line">
          <a href={post.url ?? "#"} target="_blank" rel="noreferrer">{post.domain}</a>
        </p>
      ) : null}
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="ar-feed-stack" aria-label="Loading posts">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} media={index === 1} />
      ))}
    </div>
  );
}

export function PostCardSkeleton({ media = false }: { media?: boolean }) {
  return (
    <article className="ar-post-card ar-skeleton-card" aria-hidden="true">
      <div className="ar-skeleton ar-skeleton-badge" />
      <div className="ar-skeleton ar-skeleton-title" />
      <div className="ar-skeleton ar-skeleton-line" />
      <div className="ar-skeleton ar-skeleton-line short" />
      {media ? <div className="ar-skeleton ar-skeleton-media" /> : null}
      <div className="ar-skeleton-meta">
        <span className="ar-skeleton dot" />
        <span className="ar-skeleton tiny" />
        <span className="ar-skeleton dot" />
        <span className="ar-skeleton tiny" />
      </div>
    </article>
  );
}

export function EmptyState({
  title = "No posts yet",
  description = "Be the first to start the conversation.",
  action,
  onAction,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  onAction?: () => void;
}) {
  return (
    <section className="ar-state" aria-live="polite">
      <div className="ar-state-illustration" aria-hidden="true">
        <Icon name="search" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <div className="ar-state-action">
          {typeof action === "string" ? <button type="button" className="ar-primary-button" onClick={onAction}>{action}</button> : action}
        </div>
      ) : null}
    </section>
  );
}

export function ErrorState({
  title = "We could not load this right now",
  description = "Check your connection and try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <section className="ar-state ar-error-state" role="alert">
      <div className="ar-state-illustration" aria-hidden="true">
        <Icon name="alert" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {onRetry ? <LoadMoreButton label="Try again" onClick={onRetry} /> : null}
    </section>
  );
}

export function LoadMoreButton({
  label = "Fetch more posts",
  loading,
  disabled,
  onClick,
}: {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className="ar-load-more" type="button" disabled={disabled || loading} onClick={onClick}>
      <Icon name="refresh" />
      <span>{loading ? "Loading more posts..." : label}</span>
    </button>
  );
}

export function FeedShell({
  subreddit,
  sort = "hot",
  timeRange = "day",
  onSortChange,
  onTimeRangeChange,
  onSubredditChange,
  onMenu,
  children,
  footer,
}: {
  subreddit?: string;
  sort?: SortKey;
  timeRange?: TimeRangeKey;
  onSortChange?: (sort: SortKey) => void;
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
        <SortChip value={sort} onChange={onSortChange} />
        {sort === "top" ? <TimeRangeChip value={timeRange} onChange={onTimeRangeChange} /> : null}
      </div>
      <div className="ar-feed-stack">{children}</div>
      {footer ? <div className="ar-feed-footer">{footer}</div> : null}
    </section>
  );
}

function inferPostKind(post: RedditPostCardData): PostKind {
  if (post.mediaKind === "video") return "video";
  if (post.mediaKind === "link") return "link";
  if (post.mediaKind === "text") return "text";
  if (post.mediaKind === "gif" || post.animatedImageUrl) return "gif";
  if (post.mediaKind === "image" || post.mediaKind === "gallery" || post.imageUrl || post.image) return "image";
  if (post.thumbnailUrl || post.thumbnail || post.domain) return "link";
  return "text";
}

function getAspectRatio(width?: number | null, height?: number | null): string | null {
  return width && height && width > 0 && height > 0 ? `${width} / ${height}` : null;
}

function withAutoplay(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.set("autoplay", "1");
    return url.toString();
  } catch {
    return value;
  }
}

function formatCount(value: RedditPostCardData["score"]) {
  if (value === undefined || value === null || value === "") return "0";
  if (typeof value === "string") return value;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

function formatCommentCount(value: RedditPostCardData["comments"]) {
  return `${formatCount(value)} ${value === 1 ? "comment" : "comments"}`;
}

function formatRelativePostAge(post: RedditPostCardData): string | null {
  const timestamp = getPostTimestamp(post);
  if (!timestamp) return null;

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (elapsedSeconds < 60) return "<1m ago";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) return `${elapsedDays}d ago`;

  const elapsedWeeks = Math.floor(elapsedDays / 7);
  if (elapsedWeeks < 5) return `${elapsedWeeks}w ago`;

  const elapsedMonths = Math.floor(elapsedDays / 30);
  if (elapsedMonths < 12) return `${Math.max(1, elapsedMonths)}mo ago`;

  return `${Math.floor(elapsedDays / 365)}y ago`;
}

function getPostTimestamp(post: RedditPostCardData): number | null {
  if (typeof post.createdUtc === "number" && Number.isFinite(post.createdUtc) && post.createdUtc > 0) {
    return post.createdUtc * 1000;
  }

  if (post.createdAt) {
    const parsed = Date.parse(post.createdAt);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
