import assert from "node:assert/strict";
import test from "node:test";
import { fetchRedditListing } from "../src/lib/reddit/client";

const payload = {
  kind: "Listing",
  data: {
    after: "t3_next",
    before: null,
    dist: 1,
    children: [
      {
        kind: "t3",
        data: {
          id: "abc123",
          name: "t3_abc123",
          subreddit: "gifs",
          subreddit_name_prefixed: "r/gifs",
          title: "A good post",
          author: "redditall-test",
          permalink: "/r/gifs/comments/abc123/a_good_post/",
          url: "https://example.com/post",
          domain: "example.com",
          score: 42,
          num_comments: 7,
          created_utc: 1_700_000_000,
          post_hint: "link",
          thumbnail: "default",
        },
      },
    ],
  },
};

test("browser listings use the proxy immediately", async () => {
  const restore = installBrowserGlobals();
  const calls: string[] = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return Response.json(payload);
  };

  try {
    const listing = await fetchRedditListing({ limit: 1, subreddit: "gifs" });

    assert.equal(listing.posts.length, 1);
    assert.equal(listing.posts[0]?.title, "A good post");
    assert.equal(calls.length, 1);
    assert.equal(calls[0], "/api/reddit?subreddit=gifs&sort=hot&limit=1");
  } finally {
    restore();
  }
});

test("browser listings do not attempt direct Reddit when proxy fails", async () => {
  const restore = installBrowserGlobals();
  const calls: string[] = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response("Nope", { status: 502, statusText: "Bad Gateway" });
  };

  try {
    await assert.rejects(
      () => fetchRedditListing({ limit: 1, subreddit: "gifs" }),
      /Reddit request failed with 502 Bad Gateway/,
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0], "/api/reddit?subreddit=gifs&sort=hot&limit=1");
  } finally {
    restore();
  }
});

function installBrowserGlobals() {
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;

  globalThis.window = globalThis as typeof globalThis & Window;

  return () => {
    globalThis.window = previousWindow;
    globalThis.fetch = previousFetch;
  };
}
