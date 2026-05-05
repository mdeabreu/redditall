import type { ReactNode } from "react";

import { Icon } from "./Icon";

export function EmptyState({
  title = "No posts yet",
  description = "Be the first to start the conversation.",
  action,
  onAction,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  onAction?: () => void;
}) {
  return (
    <section className="ar-state" aria-live="polite">
      <div className="ar-state-illustration" aria-hidden="true">
        <Icon name="search" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <div className="ar-state-action">
          {typeof action === "string" ? <button type="button" className="ar-primary-button" onClick={onAction}>{action}</button> : action}
        </div>
      ) : null}
    </section>
  );
}

export function ErrorState({
  title = "We could not load this right now",
  description = "Check your connection and try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <section className="ar-state ar-error-state" role="alert">
      <div className="ar-state-illustration" aria-hidden="true">
        <Icon name="alert" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {onRetry ? <LoadMoreButton label="Try again" onClick={onRetry} /> : null}
    </section>
  );
}

export function LoadMoreButton({
  label = "Fetch more posts",
  loading,
  disabled,
  onClick,
}: {
  label?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className="ar-load-more" type="button" disabled={disabled || loading} onClick={onClick}>
      <Icon name="refresh" />
      <span>{loading ? "Loading more posts..." : label}</span>
    </button>
  );
}
