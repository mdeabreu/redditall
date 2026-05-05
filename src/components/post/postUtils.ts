import type { RedditPostCardData, PostKind } from "../feed/types";

export function inferPostKind(post: RedditPostCardData): PostKind {
  if (post.mediaKind === "video") return "video";
  if (post.mediaKind === "link") return "link";
  if (post.mediaKind === "text") return "text";
  if (post.mediaKind === "gif" || post.animatedImageUrl) return "gif";
  if (post.mediaKind === "image" || post.mediaKind === "gallery" || post.imageUrl || post.image) return "image";
  if (post.thumbnailUrl || post.thumbnail || post.domain) return "link";
  return "text";
}

export function getAspectRatio(width?: number | null, height?: number | null): string | null {
  return width && height && width > 0 && height > 0 ? `${width} / ${height}` : null;
}

export function withAutoplay(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.set("autoplay", "1");
    return url.toString();
  } catch {
    return value;
  }
}

export function formatCount(value: RedditPostCardData["score"]) {
  if (value === undefined || value === null || value === "") return "0";
  if (typeof value === "string") return value;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

export function formatCommentCount(value: RedditPostCardData["comments"]) {
  return `${formatCount(value)} ${value === 1 ? "comment" : "comments"}`;
}

export function formatRelativePostAge(post: RedditPostCardData): string | null {
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
