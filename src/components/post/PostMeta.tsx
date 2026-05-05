import type { RedditPostCardData } from "../feed/types";
import { formatCommentCount, formatCount, formatRelativePostAge, inferPostKind } from "./postUtils";

export function PostMeta({
  post,
}: {
  post: RedditPostCardData;
  onOpenAuthor?: () => void;
  onOpenSubreddit?: () => void;
  onOpenComments?: () => void;
}) {
  const subreddit = post.subreddit.replace(/^r\//, "");
  const comments = post.commentCount ?? post.comments;
  const kind = post.kind ?? inferPostKind(post);
  const age = formatRelativePostAge(post);

  return (
    <div className="ar-post-meta">
      <p className="ar-post-meta-line ar-post-byline">
        by{" "}
        <a
          href={`https://www.reddit.com/user/${post.author}`}
        >
          {post.author}
        </a>
        {" "}in{" "}
        <a
          href={`/r/${subreddit}`}
        >
          r/{subreddit}
        </a>
        {age ? (
          <>
            <span aria-hidden="true" className="ar-meta-dot">•</span>
            <span>{age}</span>
          </>
        ) : null}
      </p>
      <p className="ar-post-meta-line ar-post-stats-line">
        <span>{formatCount(post.score)} points</span>
        <span aria-hidden="true" className="ar-meta-dot">•</span>
        <a
          href={`${post.redditUrl ?? post.url ?? "#"}#comments`}
        >
          {formatCommentCount(comments)}
        </a>
      </p>
      {kind === "link" && post.domain ? (
        <p className="ar-post-meta-line ar-post-domain-line">
          <a href={post.url ?? "#"} target="_blank" rel="noreferrer">{post.domain}</a>
        </p>
      ) : null}
    </div>
  );
}
