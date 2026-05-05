import { NextResponse } from "next/server";
import { buildRedditListingUrl, normalizeRedditSort, normalizeRedditTimeRange, normalizeSubreddit } from "@/lib/reddit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subreddit = normalizeSubreddit(url.searchParams.get("subreddit"));
  const sort = normalizeRedditSort(url.searchParams.get("sort"));
  const timeRange = normalizeRedditTimeRange(url.searchParams.get("t"));
  const after = url.searchParams.get("after");
  const count = Number(url.searchParams.get("count"));
  const limit = Number(url.searchParams.get("limit"));
  const redditUrl = buildRedditListingUrl({
    subreddit,
    sort,
    timeRange,
    after,
    count: Number.isFinite(count) ? count : undefined,
    limit: Number.isFinite(limit) ? limit : 25,
  });

  let response: Response;

  try {
    response = await fetchRedditJson(redditUrl);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error
          ? `Reddit request could not be completed: ${error.message}`
          : "Reddit request could not be completed.",
      },
      { status: 502 },
    );
  }

  if (!response.ok && response.status === 403) {
    const oldRedditUrl = new URL(redditUrl);
    oldRedditUrl.hostname = "old.reddit.com";
    response = await fetchRedditJson(oldRedditUrl.toString()).catch(() => response);
  }

  if (!response.ok) {
    const upstreamBody = await response.text().catch(() => "");
    const detail = upstreamBody.trim().slice(0, 500);

    return NextResponse.json(
      {
        message: [
          `Reddit request failed with ${response.status} ${response.statusText}`,
          detail ? `Upstream response: ${detail}` : "",
        ].filter(Boolean).join(". "),
      },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json());
}

function fetchRedditJson(url: string) {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Rill/0.1",
    },
    cache: "no-store",
  });
}
