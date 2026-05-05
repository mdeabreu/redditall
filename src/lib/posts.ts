import listing from "../../all.json";

export type RedditPost = {
  id: string;
  title: string;
  subreddit: string;
  subreddit_name_prefixed?: string;
  subreddit_subscribers?: number;
  author: string;
  score: number;
  ups?: number;
  num_comments: number;
  created_utc: number;
  permalink: string;
  url: string;
  domain: string;
  post_hint?: string;
  selftext?: string;
  thumbnail?: string;
  link_flair_text?: string | null;
  preview?: {
    images?: Array<{
      source?: {
        url?: string;
        width?: number;
        height?: number;
      };
    }>;
  };
  media_metadata?: Record<
    string,
    {
      s?: {
        u?: string;
        x?: number;
        y?: number;
      };
    }
  >;
  gallery_data?: {
    items?: Array<{
      media_id: string;
    }>;
  };
  secure_media?: {
    reddit_video?: {
      fallback_url?: string;
      duration?: number;
    };
  } | null;
};

type ListingChild = {
  data: RedditPost;
};

const htmlEntities: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'"
};

export function decodeHtml(value = "") {
  return value.replace(/&(?:amp|lt|gt|quot|#39);/g, (entity) => htmlEntities[entity] ?? entity);
}

export const posts = (listing.data.children as ListingChild[]).map((child) => child.data);

export function imageForPost(post: RedditPost) {
  const galleryItem = post.gallery_data?.items?.[0];
  const galleryUrl = galleryItem ? post.media_metadata?.[galleryItem.media_id]?.s?.u : undefined;
  const previewUrl = post.preview?.images?.[0]?.source?.url;
  const directUrl = /\.(png|jpe?g|webp|gif)$/i.test(post.url) ? post.url : undefined;
  return decodeHtml(galleryUrl ?? previewUrl ?? directUrl ?? "");
}

export function postKind(post: RedditPost) {
  if (post.post_hint === "image" || post.gallery_data || imageForPost(post)) return "Image";
  if (post.post_hint === "self" || post.selftext) return "Text";
  return "Link";
}

export function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}

export function timeAgo(utcSeconds: number) {
  const diffHours = Math.max(1, Math.round((Date.now() - utcSeconds * 1000) / 36e5));
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

export function communitiesFromPosts(sourcePosts = posts) {
  return Array.from(new Map(sourcePosts.map((post) => [post.subreddit, post])).values())
    .sort((a, b) => (b.subreddit_subscribers ?? 0) - (a.subreddit_subscribers ?? 0))
    .slice(0, 9);
}
