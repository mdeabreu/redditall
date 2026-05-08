import { DEFAULT_LINK_THUMBNAIL, REDDIT_ORIGIN } from "./constants";
import { getLinkFlairColor, getLinkFlairParts, getLinkFlairText } from "./flair";
import { asBoolean, asNumber, asString, asStringOrNull, isRecord } from "./guards";
import {
  getAnimatedImageUrl,
  getBestImage,
  getBestThumbnail,
  getBestVideoMedia,
  getGalleryImages,
  getMediaKind,
  getObfuscatedImage,
  getVideoPosterUrl,
  hasDefaultThumbnail,
} from "./media";
import { normalizeRedditSort, normalizeSubreddit } from "./normalize";
import type { RedditChild, RedditListing, RedditListingData, RedditListingRequest, RedditPost } from "./types";

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
  const obfuscatedImageUrl = getObfuscatedImage(data);
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
  const flairRichtext = getLinkFlairParts(data);
  const flair = getLinkFlairText(data, flairRichtext);

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
    obfuscatedImageUrl,
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
    flair,
    flairType: asString(data.link_flair_type),
    flairRichtext,
    flairBackgroundColor: getLinkFlairColor(data.link_flair_background_color),
    flairTextColor: asString(data.link_flair_text_color),
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

function redditUrl(permalink: string): string {
  return permalink ? `${REDDIT_ORIGIN}${permalink}` : REDDIT_ORIGIN;
}

function prefixSubreddit(value: unknown): string {
  const subreddit = asString(value);
  return subreddit ? `r/${subreddit}` : "";
}

function createExcerpt(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}
