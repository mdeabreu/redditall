export const REDDIT_SORTS = [
  "hot",
  "top",
  "new",
  "rising",
  "controversial",
  "best",
] as const;

export type RedditSort = (typeof REDDIT_SORTS)[number];

export const REDDIT_TIME_RANGES = [
  "hour",
  "day",
  "week",
  "month",
  "year",
  "all",
] as const;

export type RedditTimeRange = (typeof REDDIT_TIME_RANGES)[number];

export type RedditMediaKind = "image" | "video" | "gif" | "link" | "text" | "gallery";

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

type RedditChild = {
  kind?: string;
  data?: Record<string, unknown>;
};

type RedditListingData = {
  after?: unknown;
  before?: unknown;
  dist?: unknown;
  children?: unknown;
};

const REDDIT_ORIGIN = "https://www.reddit.com";
const DEFAULT_SUBREDDIT = "all";
const DEFAULT_LINK_THUMBNAIL = "/assets/default-link-thumbnail.png";

export function isRedditSort(value: unknown): value is RedditSort {
  return typeof value === "string" && REDDIT_SORTS.includes(value as RedditSort);
}

export function normalizeRedditSort(value: unknown): RedditSort {
  return isRedditSort(value) ? value : "hot";
}

export function isRedditTimeRange(value: unknown): value is RedditTimeRange {
  return typeof value === "string" && REDDIT_TIME_RANGES.includes(value as RedditTimeRange);
}

export function normalizeRedditTimeRange(value: unknown): RedditTimeRange {
  return isRedditTimeRange(value) ? value : "day";
}

export function normalizeSubreddit(value: unknown): string {
  if (typeof value !== "string") {
    return DEFAULT_SUBREDDIT;
  }

  const trimmed = value.trim().replace(/^\/?r\//i, "").replace(/^\/+|\/+$/g, "");
  return trimmed || DEFAULT_SUBREDDIT;
}

export function buildRedditListingUrl(request: RedditListingRequest = {}): string {
  const subreddit = normalizeSubreddit(request.subreddit);
  const sort = normalizeRedditSort(request.sort);
  const pathname =
    sort === "hot"
      ? `/r/${encodeURIComponent(subreddit)}.json`
      : `/r/${encodeURIComponent(subreddit)}/${sort}.json`;
  const url = new URL(pathname, REDDIT_ORIGIN);

  if (request.after) {
    url.searchParams.set("after", request.after);
  }

  if (Number.isFinite(request.count) && request.count !== undefined) {
    url.searchParams.set("count", Math.max(0, Math.trunc(request.count)).toString());
  }

  if (Number.isFinite(request.limit) && request.limit !== undefined) {
    url.searchParams.set(
      "limit",
      Math.min(100, Math.max(1, Math.trunc(request.limit))).toString(),
    );
  }

  if (sort === "top") {
    url.searchParams.set("t", normalizeRedditTimeRange(request.timeRange));
  }

  url.searchParams.set("raw_json", "1");
  return url.toString();
}

export function buildRedditProxyUrl(request: RedditListingRequest = {}): string {
  const url = new URL("/api/reddit", "http://localhost");
  url.searchParams.set("subreddit", normalizeSubreddit(request.subreddit));
  url.searchParams.set("sort", normalizeRedditSort(request.sort));
  if (normalizeRedditSort(request.sort) === "top") {
    url.searchParams.set("t", normalizeRedditTimeRange(request.timeRange));
  }

  if (request.after) {
    url.searchParams.set("after", request.after);
  }

  if (Number.isFinite(request.count) && request.count !== undefined) {
    url.searchParams.set("count", Math.max(0, Math.trunc(request.count)).toString());
  }

  if (Number.isFinite(request.limit) && request.limit !== undefined) {
    url.searchParams.set(
      "limit",
      Math.min(100, Math.max(1, Math.trunc(request.limit))).toString(),
    );
  }

  return `${url.pathname}${url.search}`;
}

export async function fetchRedditListing(
  request: RedditListingRequest = {},
): Promise<RedditListing> {
  const subreddit = normalizeSubreddit(request.subreddit);
  const sort = normalizeRedditSort(request.sort);
  const url =
    typeof window === "undefined"
      ? buildRedditListingUrl({ ...request, subreddit, sort })
      : buildRedditProxyUrl({ ...request, subreddit, sort });
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    signal: request.signal,
  });

  if (!response.ok) {
    if (request.fallbackUrl) {
      return fetchLocalRedditListing(request.fallbackUrl, { ...request, subreddit, sort });
    }

    const detail = await readErrorMessage(response);
    throw new Error(detail || `Reddit request failed with ${response.status} ${response.statusText}`);
  }

  return parseRedditListing(await response.json(), { subreddit, sort });
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const payload = await response.clone().json();
    if (isRecord(payload) && typeof payload.message === "string") {
      return payload.message;
    }
  } catch {
    // Fall back to plain text below.
  }

  try {
    const text = (await response.text()).trim();
    return text || null;
  } catch {
    return null;
  }
}

export async function fetchSubredditPage(
  request: RedditListingRequest = {},
): Promise<RedditListing> {
  return fetchRedditListing(request);
}

export async function fetchLocalRedditListing(
  url = "/all.json",
  request: RedditListingRequest = {},
): Promise<RedditListing> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    signal: request.signal,
  });

  if (!response.ok) {
    throw new Error(`Local Reddit fixture request failed with ${response.status} ${response.statusText}`);
  }

  return parseRedditListing(await response.json(), request);
}

export function parseRedditListing(
  payload: unknown,
  request: Pick<RedditListingRequest, "subreddit" | "sort" | "timeRange"> = {},
): RedditListing {
  const listingData = getListingData(payload);
  const children = getChildren(listingData, payload);
  const posts = children
    .map((child) => normalizeRedditPost(child))
    .filter((post): post is RedditPost => post !== null);

  return {
    subreddit: normalizeSubreddit(request.subreddit),
    sort: normalizeRedditSort(request.sort),
    after: asStringOrNull(listingData?.after),
    before: asStringOrNull(listingData?.before),
    count: asNumber(listingData?.dist) ?? posts.length,
    posts,
    raw: payload,
  };
}

export function normalizeRedditPost(child: unknown): RedditPost | null {
  const data = getChildData(child);
  if (!data) {
    return null;
  }

  const id = asString(data.id) || asString(data.name)?.replace(/^t3_/, "");
  const fullname = asString(data.name) || (id ? `t3_${id}` : "");
  const permalink = asString(data.permalink) || "";
  const url = asString(data.url_overridden_by_dest) || asString(data.url) || redditUrl(permalink);
  const galleryImages = getGalleryImages(data);
  const animatedImageUrl = getAnimatedImageUrl(data);
  const image = animatedImageUrl || getBestImage(data, galleryImages);
  const thumbnail = getBestThumbnail(data);
  const videoMedia = getBestVideoMedia(data);
  const video = videoMedia.hlsUrl || videoMedia.fallbackVideoUrl || videoMedia.embedUrl;
  const videoPosterUrl = video ? videoMedia.posterUrl || getVideoPosterUrl(data) : null;
  const isSelf = asBoolean(data.is_self) || asString(data.post_hint) === "self";
  const isGallery = asBoolean(data.is_gallery);
  const mediaKind = getMediaKind({ data, image, animatedImageUrl, video, isSelf, isGallery });
  const comments = asNumber(data.num_comments) ?? 0;
  const createdUtc = asNumber(data.created_utc) ?? asNumber(data.created) ?? 0;
  const isNsfw = asBoolean(data.over_18);
  const isSpoiler = asBoolean(data.spoiler);
  const selftext = asString(data.selftext) || "";

  if (!id || !asString(data.title)) {
    return null;
  }

  return {
    id,
    fullname,
    subreddit: asString(data.subreddit) || "",
    subredditPrefixed: asString(data.subreddit_name_prefixed) || prefixSubreddit(data.subreddit),
    subredditName: asString(data.subreddit) || "",
    title: asString(data.title) || "",
    author: asString(data.author) || "[deleted]",
    permalink,
    redditUrl: redditUrl(permalink),
    url,
    domain: asString(data.domain) || "",
    score: asNumber(data.score) ?? asNumber(data.ups) ?? 0,
    upvoteRatio: asNumber(data.upvote_ratio),
    comments,
    commentCount: comments,
    createdUtc,
    createdAt: createdUtc > 0 ? new Date(createdUtc * 1000).toISOString() : "",
    thumbnail: thumbnail || (mediaKind === "link" && hasDefaultThumbnail(data) ? DEFAULT_LINK_THUMBNAIL : null),
    image,
    imageUrl: image,
    animatedImageUrl,
    galleryImages,
    video,
    videoUrl: video,
    mediaUrl: video || image,
    hlsUrl: videoMedia.hlsUrl,
    fallbackVideoUrl: videoMedia.fallbackVideoUrl,
    richVideoEmbedUrl: videoMedia.embedUrl,
    videoPosterUrl,
    duration: videoMedia.duration,
    videoWidth: videoMedia.width,
    videoHeight: videoMedia.height,
    mediaKind,
    flair: asString(data.link_flair_text),
    isSelf,
    isNsfw,
    nsfw: isNsfw,
    isSpoiler,
    spoiler: isSpoiler,
    isStickied: asBoolean(data.stickied),
    selftext,
    excerpt: createExcerpt(selftext),
    raw: child,
  };
}

function getListingData(payload: unknown): RedditListingData | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (isRecord(payload.data)) {
    return payload.data as RedditListingData;
  }

  return payload as RedditListingData;
}

function getChildren(listingData: RedditListingData | null, payload: unknown): unknown[] {
  if (Array.isArray(listingData?.children)) {
    return listingData.children;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray(payload.posts)) {
    return payload.posts;
  }

  return [];
}

function getChildData(child: unknown): Record<string, unknown> | null {
  if (!isRecord(child)) {
    return null;
  }

  if (isRecord((child as RedditChild).data)) {
    return (child as RedditChild).data ?? null;
  }

  return child;
}

function getBestImage(data: Record<string, unknown>, galleryImages = getGalleryImages(data)): string | null {
  if (galleryImages[0]) {
    return galleryImages[0];
  }

  const previewImage = getPreviewImage(data);
  if (previewImage) {
    return previewImage;
  }

  return validDirectImageUrl(asString(data.url_overridden_by_dest) || asString(data.url));
}

function getBestThumbnail(data: Record<string, unknown>): string | null {
  return validMediaUrl(asString(data.thumbnail)) || getPreviewImage(data);
}

function getPreviewImage(data: Record<string, unknown>): string | null {
  const preview = data.preview;
  if (isRecord(preview) && Array.isArray(preview.images)) {
    const first = preview.images[0];
    if (isRecord(first)) {
      const source = first.source;
      if (isRecord(source)) {
        const url = validMediaUrl(asString(source.url));
        if (url) {
          return url;
        }
      }
    }
  }

  return null;
}

function getAnimatedImageUrl(data: Record<string, unknown>): string | null {
  const preview = data.preview;
  if (isRecord(preview) && Array.isArray(preview.images)) {
    const first = preview.images[0];
    if (isRecord(first)) {
      const variants = first.variants;
      if (isRecord(variants)) {
        const gif = variants.gif;
        if (isRecord(gif)) {
          const source = gif.source;
          if (isRecord(source)) {
            const url = validMediaUrl(asString(source.url));
            if (url) {
              return url;
            }
          }
        }
      }
    }
  }

  return validDirectGifUrl(asString(data.url_overridden_by_dest) || asString(data.url));
}

function getGalleryImages(data: Record<string, unknown>): string[] {
  const mediaMetadata = data.media_metadata;
  const galleryData = data.gallery_data;
  const urls: string[] = [];

  if (isRecord(mediaMetadata) && isRecord(galleryData) && Array.isArray(galleryData.items)) {
    for (const item of galleryData.items) {
      if (!isRecord(item)) {
        continue;
      }

      const mediaId = asString(item.media_id);
      const media = mediaId ? mediaMetadata[mediaId] : null;
      if (!isRecord(media)) {
        continue;
      }

      const source = media.s;
      if (isRecord(source)) {
        const url = validMediaUrl(asString(source.u));
        if (url) {
          urls.push(url);
        }
      }
    }
  }

  return urls;
}

type RedditVideoMedia = {
  hlsUrl: string | null;
  fallbackVideoUrl: string | null;
  embedUrl: string | null;
  posterUrl: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
};

function getBestVideoMedia(data: Record<string, unknown>): RedditVideoMedia {
  const secureMedia = data.secure_media;
  const media = data.media;
  const candidates = [secureMedia, media];

  for (const candidate of candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.reddit_video)) {
      continue;
    }

    const hlsUrl = validMediaUrl(asString(candidate.reddit_video.hls_url));
    const fallbackVideoUrl = validMediaUrl(asString(candidate.reddit_video.fallback_url));

    if (hlsUrl || fallbackVideoUrl) {
      return {
        hlsUrl,
        fallbackVideoUrl,
        embedUrl: null,
        posterUrl: null,
        duration: asNumber(candidate.reddit_video.duration),
        width: asNumber(candidate.reddit_video.width),
        height: asNumber(candidate.reddit_video.height),
      };
    }
  }

  for (const candidate of candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.oembed)) {
      continue;
    }

    const embedUrl = getOembedUrl(candidate.oembed);
    const posterUrl = validMediaUrl(asString(candidate.oembed.thumbnail_url));

    if (embedUrl || posterUrl) {
      return {
        hlsUrl: null,
        fallbackVideoUrl: null,
        embedUrl,
        posterUrl,
        duration: null,
        width: asNumber(candidate.oembed.width),
        height: asNumber(candidate.oembed.height),
      };
    }
  }

  return {
    hlsUrl: null,
    fallbackVideoUrl: null,
    embedUrl: null,
    posterUrl: null,
    duration: null,
    width: null,
    height: null,
  };
}

function getOembedUrl(oembed: Record<string, unknown>): string | null {
  const html = asString(oembed.html);
  const match = html?.match(/\bsrc=(["'])(.*?)\1/i);
  return validMediaUrl(match?.[2] ?? null);
}

function getVideoPosterUrl(data: Record<string, unknown>): string | null {
  const preview = data.preview;
  if (isRecord(preview) && Array.isArray(preview.images)) {
    const first = preview.images[0];
    if (isRecord(first)) {
      const source = first.source;
      if (isRecord(source)) {
        const url = validMediaUrl(asString(source.url));
        if (url) {
          return url;
        }
      }
    }
  }

  return validMediaUrl(asString(data.thumbnail));
}

function getMediaKind(input: {
  data: Record<string, unknown>;
  image: string | null;
  animatedImageUrl: string | null;
  video: string | null;
  isSelf: boolean;
  isGallery: boolean;
}): RedditMediaKind {
  const postHint = asString(input.data.post_hint);

  if (input.isGallery) {
    return "gallery";
  }

  if (input.isSelf || postHint === "self") {
    return "text";
  }

  if (input.video || asBoolean(input.data.is_video) || postHint === "hosted:video" || postHint === "rich:video") {
    return "video";
  }

  if (input.animatedImageUrl) {
    return "gif";
  }

  if (postHint === "image") {
    return "image";
  }

  if (postHint === "link") {
    return "link";
  }

  if (input.video) {
    return "gif";
  }

  return input.image && isRedditImageDomain(asString(input.data.domain)) ? "image" : "link";
}

function redditUrl(permalink: string): string {
  return permalink ? `${REDDIT_ORIGIN}${permalink}` : REDDIT_ORIGIN;
}

function prefixSubreddit(value: unknown): string {
  const subreddit = asString(value);
  return subreddit ? `r/${subreddit}` : "";
}

function validMediaUrl(value: string | null): string | null {
  if (!value || value === "self" || value === "default" || value === "nsfw" || value === "spoiler") {
    return null;
  }

  return decodeHtmlEntities(value);
}

function validDirectImageUrl(value: string | null): string | null {
  const url = validMediaUrl(value);
  return url && /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url) ? url : null;
}

function validDirectGifUrl(value: string | null): string | null {
  const url = validMediaUrl(value);
  return url && /\.gif(?:[?#].*)?$/i.test(url) ? url : null;
}

function isRedditImageDomain(value: string | null): boolean {
  return value === "i.redd.it" || value === "i.imgur.com";
}

function hasDefaultThumbnail(data: Record<string, unknown>): boolean {
  return asString(data.thumbnail) === "default";
}

function createExcerpt(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&");
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
