import type { RedditPost } from "./posts";

export type DetailView =
  | { type: "feed" }
  | { type: "author"; name: string }
  | { type: "subreddit"; name: string }
  | { type: "comments"; postId: string };

export type SortMode = "Hot" | "Top" | "New" | "Rising" | "Best";

export function filterPosts(posts: RedditPost[], community: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return posts.filter((post) => {
    const matchesCommunity = community === "All" || post.subreddit === community;
    const searchable = `${post.title} ${post.subreddit} ${post.author} ${post.domain}`.toLowerCase();
    return matchesCommunity && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

export function sortPosts(posts: RedditPost[], sort: SortMode) {
  return [...posts].sort((a, b) => {
    if (sort === "New") return b.created_utc - a.created_utc;
    if (sort === "Top") return b.score - a.score;
    if (sort === "Rising") return b.num_comments - a.num_comments;
    if (sort === "Best") return b.score + b.num_comments * 8 - (a.score + a.num_comments * 8);
    return b.score * 0.75 + b.num_comments * 20 - (a.score * 0.75 + a.num_comments * 20);
  });
}
