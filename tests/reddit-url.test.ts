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

test("builds restricted Reddit search URLs with search sort and raw JSON", () => {
  const url = new URL(buildRedditListingUrl({
    query: "idol",
    restrictToSubreddit: true,
    searchSort: "relevance",
    subreddit: "survivor",
  }));

  assert.equal(url.origin, "https://www.reddit.com");
  assert.equal(url.pathname, "/r/survivor/search.json");
  assert.equal(url.searchParams.get("q"), "idol");
  assert.equal(url.searchParams.get("restrict_sr"), "on");
  assert.equal(url.searchParams.get("sort"), "relevance");
  assert.equal(url.searchParams.get("raw_json"), "1");
});

test("builds unrestricted search URLs without restrict_sr", () => {
  const url = new URL(buildRedditListingUrl({
    query: "hidden immunity",
    restrictToSubreddit: false,
    searchSort: "top",
    subreddit: "survivor",
  }));

  assert.equal(url.pathname, "/r/survivor/search.json");
  assert.equal(url.searchParams.get("q"), "hidden immunity");
  assert.equal(url.searchParams.get("restrict_sr"), null);
  assert.equal(url.searchParams.get("sort"), "top");
});

test("normalizes invalid search sorts to relevance", () => {
  const url = new URL(buildRedditListingUrl({
    query: "idol",
    searchSort: "best",
    subreddit: "survivor",
  }));

  assert.equal(url.searchParams.get("sort"), "relevance");
});

test("preserves pagination params for search URLs", () => {
  const redditUrl = new URL(buildRedditListingUrl({
    after: "t3_after",
    count: 25,
    limit: 50,
    query: "idol",
    restrictToSubreddit: true,
    searchSort: "comments",
    subreddit: "survivor",
  }));
  const proxyUrl = buildRedditProxyUrl({
    after: "t3_after",
    count: 25,
    limit: 50,
    query: "idol",
    restrictToSubreddit: true,
    searchSort: "comments",
    subreddit: "survivor",
  });

  assert.equal(redditUrl.searchParams.get("after"), "t3_after");
  assert.equal(redditUrl.searchParams.get("count"), "25");
  assert.equal(redditUrl.searchParams.get("limit"), "50");
  assert.equal(proxyUrl, "/api/reddit?subreddit=survivor&q=idol&sort=comments&restrict_sr=on&after=t3_after&count=25&limit=50");
});
