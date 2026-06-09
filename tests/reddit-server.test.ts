import assert from "node:assert/strict";
import test from "node:test";
import { fetchServerRedditResponse } from "../src/lib/reddit/server";

const REDDIT_URL = "https://www.reddit.com/r/all.json?limit=25";

test("server Reddit fetch bootstraps cookies and forwards them to the JSON endpoint", async () => {
  const restore = installFetchMock(async (url, init) => {
    if (url === "https://old.reddit.com") {
      return responseWithSetCookies([
        "loid=abc123; Path=/; Domain=.reddit.com",
        "session=def456; Path=/; Secure",
      ]);
    }

    assert.equal(url, REDDIT_URL);
    assert.equal(headerValue(init?.headers, "Accept"), "application/json,text/plain;q=0.9,*/*;q=0.8");
    assert.equal(headerValue(init?.headers, "Cookie"), "loid=abc123; session=def456");
    return Response.json({ kind: "Listing", data: { children: [] } });
  });

  try {
    const response = await fetchServerRedditResponse(REDDIT_URL);
    assert.equal(response.ok, true);
  } finally {
    restore();
  }
});

test("server Reddit fetch fails fast when bootstrap request fails", async () => {
  const restore = installFetchMock(async () => {
    throw new TypeError("network unavailable");
  });

  try {
    await assert.rejects(
      () => fetchServerRedditResponse(REDDIT_URL),
      /Reddit bootstrap request failed: network unavailable/,
    );
  } finally {
    restore();
  }
});

test("server Reddit fetch fails fast when bootstrap returns no cookies", async () => {
  const restore = installFetchMock(async () => new Response("OK"));

  try {
    await assert.rejects(
      () => fetchServerRedditResponse(REDDIT_URL),
      /Reddit bootstrap request returned no cookies/,
    );
  } finally {
    restore();
  }
});

test("server Reddit fetch returns non-OK JSON endpoint responses", async () => {
  const restore = installFetchMock(async (url) => {
    if (url === "https://old.reddit.com") {
      return responseWithSetCookies(["loid=abc123; Path=/"]);
    }

    return new Response("Rate limited", { status: 429, statusText: "Too Many Requests" });
  });

  try {
    const response = await fetchServerRedditResponse(REDDIT_URL);
    assert.equal(response.status, 429);
    assert.equal(response.statusText, "Too Many Requests");
  } finally {
    restore();
  }
});

function responseWithSetCookies(cookies: string[]): Response {
  const response = new Response("OK");
  Object.defineProperty(response.headers, "getSetCookie", {
    value: () => cookies,
  });
  return response;
}

function installFetchMock(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
) {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    return handler(String(input), init);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = previousFetch;
  };
}

function headerValue(headers: HeadersInit | undefined, name: string): string | null {
  if (!headers) return null;
  return new Headers(headers).get(name);
}
