import assert from "node:assert/strict";
import test from "node:test";
import { buildRedditListingUrl, buildRedditProxyUrl } from "../src/lib/reddit/urls";

test("builds Reddit listing URLs with sort, time range, and pagination", () => {
  const url = new URL(buildRedditListingUrl({
    after: "t3_after",
    count: 27.8,
    limit: 250,
    sort: "top",
    subreddit: "Technology",
    timeRange: "month",
  }));

  assert.equal(url.origin, "https://www.reddit.com");
  assert.equal(url.pathname, "/r/Technology/top.json");
  assert.equal(url.searchParams.get("after"), "t3_after");
  assert.equal(url.searchParams.get("count"), "27");
  assert.equal(url.searchParams.get("limit"), "100");
  assert.equal(url.searchParams.get("t"), "month");
  assert.equal(url.searchParams.get("raw_json"), "1");
});

test("builds proxy URLs with normalized defaults", () => {
  const url = buildRedditProxyUrl({
    count: -4,
    limit: 0,
    sort: "not-real",
    subreddit: "",
  });

  assert.equal(url, "/api/reddit?subreddit=all&sort=hot&count=0&limit=1");
});
