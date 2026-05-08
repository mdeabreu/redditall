export type PostKind = "text" | "image" | "gif" | "link" | "video";
export type SortKey = "hot" | "top" | "new" | "rising" | "controversial" | "best";
export type TimeRangeKey = "hour" | "day" | "week" | "month" | "year" | "all";

export type FlairPart =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "emoji";
      alt: string;
      url: string | null;
    };

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
  obfuscatedImageUrl?: string | null;
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
  flairType?: string | null;
  flairRichtext?: FlairPart[];
  flairBackgroundColor?: string | null;
  flairTextColor?: string | null;
  over18?: boolean;
  isSpoiler?: boolean;
  spoiler?: boolean;
  isStickied?: boolean;
  stickied?: boolean;
  selftext?: string;
};
