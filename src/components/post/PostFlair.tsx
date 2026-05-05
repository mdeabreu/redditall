import type { CSSProperties } from "react";
import type { FlairPart, RedditPostCardData } from "../feed/types";

export function PostFlair({ post }: { post: RedditPostCardData }) {
  const label = post.flair?.trim();
  const parts = normalizeParts(post.flairRichtext);

  if (!label && parts.length === 0) {
    return null;
  }

  const hasCustomColor = Boolean(post.flairBackgroundColor);
  const style = hasCustomColor
    ? ({
        "--flair-bg": post.flairBackgroundColor,
        "--flair-fg": post.flairTextColor === "light" ? "#ffffff" : "#111827",
      } as CSSProperties)
    : undefined;

  return (
    <span
      className={`ar-flair${hasCustomColor ? " ar-flair-custom" : ""}`}
      style={style}
      title={label ?? undefined}
    >
      {parts.length > 0
        ? parts.map((part, index) => <FlairPartView key={`${part.type}-${index}`} part={part} />)
        : label}
    </span>
  );
}

function FlairPartView({ part }: { part: FlairPart }) {
  if (part.type === "text") {
    return <span>{part.text}</span>;
  }

  if (part.url) {
    return <img className="ar-flair-emoji" src={part.url} alt={part.alt} loading="lazy" />;
  }

  return <span>{part.alt}</span>;
}

function normalizeParts(value: RedditPostCardData["flairRichtext"]): FlairPart[] {
  return value?.filter((part) => {
    if (part.type === "text") {
      return part.text.trim().length > 0;
    }

    return Boolean(part.alt || part.url);
  }) ?? [];
}
