import { useState } from "react";

import type { RedditPostCardData } from "../feed/types";
import { Icon } from "../ui/Icon";
import { PostFlair } from "./PostFlair";
import { PostMeta } from "./PostMeta";
import { PostTypeBadge } from "./PostTypeBadge";
import { inferPostKind } from "./postUtils";
import { VideoPostMedia } from "./VideoPostMedia";

function StickiedBadge() {
  return (
    <span className="ar-stickied-badge">
      <Icon name="pin" />
      Pinned
    </span>
  );
}

function SpoilerBadge() {
  return (
    <span className="ar-spoiler-badge">
      <Icon name="alert" />
      Spoiler
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
  const isSpoiler = post.isSpoiler === true || post.spoiler === true;
  const [spoilerRevealed, setSpoilerRevealed] = useState(!isSpoiler);
  const hideSpoilerContent = isSpoiler && !spoilerRevealed;
  const body = post.body ?? post.excerpt ?? post.selftext;
  const obfuscatedImageUrl = post.obfuscatedImageUrl ?? undefined;
  const title = (
    <a className="ar-post-title" href={post.redditUrl ?? post.url ?? "#"} target="_blank" rel="noreferrer">
      {post.title}
    </a>
  );
  const revealButton = (
    <button className="ar-spoiler-reveal" type="button" onClick={() => setSpoilerRevealed(true)}>
      Reveal spoiler
    </button>
  );
  const media = (
    <>
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
    </>
  );
  const hasMedia =
    (kind === "image" && (galleryImages.length > 0 || Boolean(imageUrl))) ||
    (kind === "gif" && Boolean(imageUrl)) ||
    (kind === "link" && Boolean(linkMediaUrl)) ||
    kind === "video";

  return (
    <article className={`ar-post-card ar-post-card-${kind}`}>
      {hideSpoilerContent && hasMedia ? (
        <div className="ar-spoiler-cover ar-spoiler-cover-media">
          {obfuscatedImageUrl ? <img src={obfuscatedImageUrl} alt="" loading="lazy" /> : null}
          <div className="ar-spoiler-cover-copy">
            <span>Spoiler hidden</span>
            {revealButton}
          </div>
        </div>
      ) : (
        media
      )}

      <div className="ar-post-content">
        <div className="ar-post-badge-row">
          <PostTypeBadge kind={kind} />
          {isStickied ? <StickiedBadge /> : null}
          {isSpoiler ? <SpoilerBadge /> : null}
        </div>

        {kind === "link" ? (
          <div className="ar-link-copy">
            {title}
            {hideSpoilerContent && body ? (
              <div className="ar-spoiler-cover ar-spoiler-cover-text">
                <span>Spoiler text hidden</span>
                {!hasMedia ? revealButton : null}
              </div>
            ) : body ? (
              <p className="ar-post-snippet">{body}</p>
            ) : null}
          </div>
        ) : (
          <>
            {title}
            {hideSpoilerContent && body ? (
              <div className="ar-spoiler-cover ar-spoiler-cover-text">
                <span>Spoiler text hidden</span>
                {!hasMedia ? revealButton : null}
              </div>
            ) : body ? (
              <p className="ar-post-snippet">{body}</p>
            ) : null}
          </>
        )}

        <PostFlair post={post} />
        <PostMeta post={post} />
      </div>
    </article>
  );
}
