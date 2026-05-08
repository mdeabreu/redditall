import type { REDDIT_SORTS, REDDIT_TIME_RANGES } from "./constants";

export type RedditSort = (typeof REDDIT_SORTS)[number];

export type RedditTimeRange = (typeof REDDIT_TIME_RANGES)[number];

export type RedditMediaKind = "image" | "video" | "gif" | "link" | "text" | "gallery";

export type RedditFlairPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "emoji";
      alt: string;
      url: string | null;
    };

export type RedditPost = {
  id: string;
  fullname: string;
  subreddit: string;
  subredditPrefixed: string;
  subredditName: string;
  title: string;
  author: string;
  permalink: string;
  redditUrl: string;
  url: string;
  domain: string;
  score: number;
  upvoteRatio: number | null;
  comments: number;
  commentCount: number;
  createdUtc: number;
  createdAt: string;
  thumbnail: string | null;
  image: string | null;
  imageUrl: string | null;
  obfuscatedImageUrl: string | null;
  animatedImageUrl: string | null;
  galleryImages: string[];
  video: string | null;
  videoUrl: string | null;
  mediaUrl: string | null;
  hlsUrl: string | null;
  fallbackVideoUrl: string | null;
  richVideoEmbedUrl: string | null;
  videoPosterUrl: string | null;
  duration: number | null;
  videoWidth: number | null;
  videoHeight: number | null;
  mediaKind: RedditMediaKind;
  flair: string | null;
  flairType: string | null;
  flairRichtext: RedditFlairPart[];
  flairBackgroundColor: string | null;
  flairTextColor: string | null;
  isSelf: boolean;
  isNsfw: boolean;
  nsfw: boolean;
  isSpoiler: boolean;
  spoiler: boolean;
  isStickied: boolean;
  selftext: string;
  excerpt: string;
  raw: unknown;
};

export type FeedPost = RedditPost;
export type SortMode = RedditSort;

export type RedditListing = {
  subreddit: string;
  sort: RedditSort;
  after: string | null;
  before: string | null;
  count: number;
  posts: RedditPost[];
  raw: unknown;
};

export type RedditListingRequest = {
  subreddit?: string;
  sort?: RedditSort | string;
  after?: string | null;
  count?: number;
  limit?: number;
  timeRange?: RedditTimeRange | string;
  signal?: AbortSignal;
  fallbackUrl?: string;
};

export type RedditChild = {
  kind?: string;
  data?: Record<string, unknown>;
};

export type RedditListingData = {
  after?: unknown;
  before?: unknown;
  dist?: unknown;
  children?: unknown;
};

export type RedditVideoMedia = {
  hlsUrl: string | null;
  fallbackVideoUrl: string | null;
  embedUrl: string | null;
  posterUrl: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
};
