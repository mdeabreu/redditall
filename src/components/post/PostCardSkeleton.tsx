export function PostCardSkeleton({ media = false }: { media?: boolean }) {
  return (
    <article className="ar-post-card ar-skeleton-card" aria-hidden="true">
      <div className="ar-skeleton ar-skeleton-badge" />
      <div className="ar-skeleton ar-skeleton-title" />
      <div className="ar-skeleton ar-skeleton-line" />
      <div className="ar-skeleton ar-skeleton-line short" />
      {media ? <div className="ar-skeleton ar-skeleton-media" /> : null}
      <div className="ar-skeleton-meta">
        <span className="ar-skeleton dot" />
        <span className="ar-skeleton tiny" />
        <span className="ar-skeleton dot" />
        <span className="ar-skeleton tiny" />
      </div>
    </article>
  );
}
