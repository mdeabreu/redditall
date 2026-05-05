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
    response = await fetch(redditUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "rill-reader/0.1",
      },
      cache: "no-store",
    });
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
