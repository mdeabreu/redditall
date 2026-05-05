import { useEffect, useState } from "react";

import { Icon } from "../ui/Icon";

export function MobileHeader({
  subreddit = "all",
  onMenuClick,
  onSubredditChange,
}: {
  subreddit?: string;
  onMenuClick?: () => void;
  onSubredditChange?: (subreddit: string) => void;
}) {
  const displaySubreddit = subreddit.startsWith("r/") ? subreddit : `r/${subreddit}`;
  const [draftSubreddit, setDraftSubreddit] = useState(displaySubreddit);

  useEffect(() => {
    setDraftSubreddit(displaySubreddit);
  }, [displaySubreddit]);

  function commitSubreddit(value: string) {
    const nextSubreddit = value.trim().replace(/^\/?r\//i, "");
    if (!nextSubreddit) {
      setDraftSubreddit(displaySubreddit);
      return;
    }

    setDraftSubreddit(`r/${nextSubreddit}`);
    if (nextSubreddit !== subreddit.replace(/^\/?r\//i, "")) {
      onSubredditChange?.(nextSubreddit);
    }
  }

  return (
    <header className="ar-mobile-header" aria-label="Primary navigation">
      <button className="ar-icon-button" type="button" aria-label="Open menu" onClick={onMenuClick}>
        <Icon name="menu" />
      </button>
      <form
        className="ar-current-subreddit"
        aria-label="Current subreddit"
        onSubmit={(event) => {
          event.preventDefault();
          const field = event.currentTarget.elements.namedItem("subreddit");
          commitSubreddit(field instanceof HTMLInputElement ? field.value : draftSubreddit);
        }}
      >
        <input
          name="subreddit"
          type="search"
          aria-label="Current subreddit"
          value={draftSubreddit}
          enterKeyHint="go"
          spellCheck={false}
          onChange={(event) => setDraftSubreddit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitSubreddit(event.currentTarget.value);
            }
          }}
          onBlur={(event) => {
            if (event.currentTarget.value === displaySubreddit) return;
            commitSubreddit(event.currentTarget.value);
          }}
          onFocus={(event) => event.currentTarget.select()}
        />
      </form>
    </header>
  );
}
