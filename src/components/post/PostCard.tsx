import type { RedditPostCardData } from "../feed/types";
import { Icon } from "../ui/Icon";
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
  const body = post.body ?? post.excerpt;
  const title = (
    <a className="ar-post-title" href={post.redditUrl ?? post.url ?? "#"}>
      {post.title}
    </a>
  );

  return (
    <article className={`ar-post-card ar-post-card-${kind}`}>
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

      <div className="ar-post-content">
        <div className="ar-post-badge-row">
          <PostTypeBadge kind={kind} />
          {isStickied ? <StickiedBadge /> : null}
        </div>

        {kind === "link" ? (
          <div className="ar-link-copy">
            {title}
            {body ? <p className="ar-post-snippet">{body}</p> : null}
          </div>
        ) : (
          <>
            {title}
            {kind === "text" && body ? <p className="ar-post-snippet">{body}</p> : null}
          </>
        )}

        {post.flair ? <span className="ar-flair">{post.flair}</span> : null}
        <PostMeta post={post} />
      </div>
    </article>
  );
}
