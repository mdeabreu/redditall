"use client";

import { communitiesFromPosts, formatCount, posts } from "@/lib/posts";
import type { SortMode } from "@/lib/viewState";

type NavigationDrawerProps = {
  open: boolean;
  activeCommunity: string;
  sort: SortMode;
  onClose: () => void;
  onCommunitySelect: (community: string) => void;
  onSortChange: (sort: SortMode) => void;
};

const sortModes: Array<{ label: SortMode; hint: string }> = [
  { label: "Hot", hint: "Trending posts today" },
  { label: "Top", hint: "Most points all time" },
  { label: "New", hint: "Freshest posts first" },
  { label: "Rising", hint: "Fast-moving conversations" },
  { label: "Best", hint: "Community favorites" }
];

export function NavigationDrawer({
  open,
  activeCommunity,
  sort,
  onClose,
  onCommunitySelect,
  onSortChange
}: NavigationDrawerProps) {
  const communities = communitiesFromPosts(posts);

  return (
    <div className={`drawerLayer ${open ? "drawerLayerOpen" : ""}`} aria-hidden={!open}>
      <button className="drawerScrim" type="button" aria-label="Close navigation" onClick={onClose} />
      <aside className="drawer" aria-label="Navigation drawer">
        <div className="drawerHeader">
          <div className="redditMark">r</div>
          <div>
            <strong>Alternative Reddit</strong>
            <span>Mobile reader</span>
          </div>
          <button className="iconButton" type="button" aria-label="Close" onClick={onClose}>
            x
          </button>
        </div>

        <section className="drawerSection">
          <h2>Communities</h2>
          <button
            className={`drawerRow ${activeCommunity === "All" ? "drawerRowActive" : ""}`}
            type="button"
            onClick={() => {
              onCommunitySelect("All");
              onClose();
            }}
          >
            <span className="rowIcon">⌂</span>
            <span>
              <strong>All posts</strong>
              <small>Mixed front page</small>
            </span>
            {activeCommunity === "All" ? <b>✓</b> : null}
          </button>
          {communities.map((community) => (
            <button
              className={`drawerRow ${activeCommunity === community.subreddit ? "drawerRowActive" : ""}`}
              type="button"
              key={community.subreddit}
              onClick={() => {
                onCommunitySelect(community.subreddit);
                onClose();
              }}
            >
              <span className="communityAvatar">{community.subreddit.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>r/{community.subreddit}</strong>
                <small>{formatCount(community.subreddit_subscribers ?? 0)} members</small>
              </span>
              {activeCommunity === community.subreddit ? <b>✓</b> : null}
            </button>
          ))}
        </section>

        <section className="drawerSection">
          <h2>Sort</h2>
          {sortModes.map((mode) => (
            <button
              className={`drawerRow ${sort === mode.label ? "drawerRowActive" : ""}`}
              type="button"
              key={mode.label}
              onClick={() => {
                onSortChange(mode.label);
                onClose();
              }}
            >
              <span className="rowIcon">⌁</span>
              <span>
                <strong>{mode.label}</strong>
                <small>{mode.hint}</small>
              </span>
              {sort === mode.label ? <b>✓</b> : null}
            </button>
          ))}
        </section>
      </aside>
    </div>
  );
}
