import { asString, isRecord } from "./guards";
import type { RedditFlairPart } from "./types";

export function getLinkFlairParts(data: Record<string, unknown>): RedditFlairPart[] {
  const richtext = data.link_flair_richtext;

  if (!Array.isArray(richtext)) {
    return [];
  }

  return richtext
    .map((part): RedditFlairPart | null => {
      if (!isRecord(part)) {
        return null;
      }

      const kind = asString(part.e);

      if (kind === "text") {
        const text = decodeHtmlEntities(asString(part.t) ?? "");
        return text ? { type: "text", text } : null;
      }

      if (kind === "emoji") {
        const alt = asString(part.a) ?? "";
        const url = validFlairEmojiUrl(asString(part.u));
        return alt || url ? { type: "emoji", alt, url } : null;
      }

      return null;
    })
    .filter((part): part is RedditFlairPart => part !== null);
}

export function getLinkFlairText(data: Record<string, unknown>, parts = getLinkFlairParts(data)): string | null {
  const text = asString(data.link_flair_text);
  if (text) {
    return decodeHtmlEntities(text);
  }

  const rendered = parts.map((part) => (part.type === "text" ? part.text : part.alt)).join("").trim();
  return rendered || null;
}

export function getLinkFlairColor(value: unknown): string | null {
  const color = asString(value)?.trim();
  return color && /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(color) ? color : null;
}

function validFlairEmojiUrl(value: string | null): string | null {
  if (!value || !/^https:\/\/emoji\.redditmedia\.com\//i.test(value)) {
    return null;
  }

  return decodeHtmlEntities(value);
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&");
}
