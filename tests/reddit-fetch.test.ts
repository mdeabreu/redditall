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
          author: "rill-test",
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

test("browser listings use direct Reddit fetch when CORS works", async () => {
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
    assert.match(calls[0] ?? "", /^https:\/\/www\.reddit\.com\/r\/gifs\.json/);
  } finally {
    restore();
  }
});

test("browser listings fall back to Reddit JSONP before the proxy", async () => {
  const restore = installBrowserGlobals(({ callbackName }) => {
    const callback = (globalThis.window as unknown as Record<string, unknown>)[callbackName];
    assert.equal(typeof callback, "function");
    (callback as (payload: unknown) => void)(payload);
  });
  const calls: string[] = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    throw new TypeError("CORS failed");
  };

  try {
    const listing = await fetchRedditListing({ limit: 1, subreddit: "gifs" });

    assert.equal(listing.posts.length, 1);
    assert.equal(calls.length, 1);
    assert.match(calls[0] ?? "", /^https:\/\/www\.reddit\.com\/r\/gifs\.json/);
  } finally {
    restore();
  }
});

test("browser listings use the proxy only after direct and JSONP fail", async () => {
  const restore = installBrowserGlobals(({ script }) => {
    script.onerror?.(new Event("error"));
  });
  const calls: string[] = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));

    if (calls.length === 1) {
      throw new TypeError("CORS failed");
    }

    return Response.json(payload);
  };

  try {
    const listing = await fetchRedditListing({ limit: 1, subreddit: "gifs" });

    assert.equal(listing.posts.length, 1);
    assert.equal(calls.length, 2);
    assert.match(calls[0] ?? "", /^https:\/\/www\.reddit\.com\/r\/gifs\.json/);
    assert.match(calls[1] ?? "", /^\/api\/reddit\?subreddit=gifs&sort=hot&limit=1/);
  } finally {
    restore();
  }
});

type ScriptStub = {
  onerror?: ((event: Event) => void) | null;
  remove: () => void;
  src: string;
};

function installBrowserGlobals(
  onAppend?: (input: { callbackName: string; script: ScriptStub }) => void,
) {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousFetch = globalThis.fetch;

  globalThis.window = globalThis as typeof globalThis & Window;
  globalThis.document = {
    createElement: () => ({
      onerror: null,
      remove: () => undefined,
      src: "",
    }),
    head: {
      append: (script: ScriptStub) => {
        const callbackName = new URL(script.src).searchParams.get("jsonp") ?? "";
        onAppend?.({ callbackName, script });
      },
    },
  } as unknown as Document;

  return () => {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.fetch = previousFetch;
  };
}
