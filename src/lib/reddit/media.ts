import type { RedditMediaKind, RedditVideoMedia } from "./types";
import { asBoolean, asNumber, asString, isRecord } from "./guards";

export function getBestImage(
  data: Record<string, unknown>,
  galleryImages = getGalleryImages(data),
): string | null {
  if (galleryImages[0]) {
    return galleryImages[0];
  }

  const previewImage = getPreviewImage(data);
  if (previewImage) {
    return previewImage;
  }

  return validDirectImageUrl(asString(data.url_overridden_by_dest) || asString(data.url));
}

export function getObfuscatedImage(data: Record<string, unknown>): string | null {
  const preview = data.preview;
  if (!isRecord(preview) || !Array.isArray(preview.images)) {
    return null;
  }

  const first = preview.images[0];
  if (!isRecord(first) || !isRecord(first.variants)) {
    return null;
  }

  const obfuscated = first.variants.obfuscated;
  if (!isRecord(obfuscated) || !isRecord(obfuscated.source)) {
    return null;
  }

  return validMediaUrl(asString(obfuscated.source.url));
}

export function getBestThumbnail(data: Record<string, unknown>): string | null {
  const thumbnail = asString(data.thumbnail);
  const thumbnailUrl = validMediaUrl(thumbnail);
  if (thumbnailUrl || thumbnail === "spoiler") {
    return thumbnailUrl;
  }

  return getPreviewImage(data);
}

export function getAnimatedImageUrl(data: Record<string, unknown>): string | null {
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

export function getGalleryImages(data: Record<string, unknown>): string[] {
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

export function getBestVideoMedia(data: Record<string, unknown>): RedditVideoMedia {
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

export function getVideoPosterUrl(data: Record<string, unknown>): string | null {
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

export function getMediaKind(input: {
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

export function validMediaUrl(value: string | null): string | null {
  if (!value || value === "self" || value === "default" || value === "nsfw" || value === "spoiler") {
    return null;
  }

  return decodeHtmlEntities(value);
}

export function hasDefaultThumbnail(data: Record<string, unknown>): boolean {
  return asString(data.thumbnail) === "default";
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

function getOembedUrl(oembed: Record<string, unknown>): string | null {
  const html = asString(oembed.html);
  const match = html?.match(/\bsrc=(["'])(.*?)\1/i);
  return validMediaUrl(match?.[2] ?? null);
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

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&");
}
