import { NextResponse } from "next/server";
import {
  buildRedditListingUrl,
  normalizeRedditSearchSort,
  normalizeRedditSort,
  normalizeRedditTimeRange,
  normalizeSubreddit,
} from "@/lib/reddit";
import { readErrorMessage } from "@/lib/reddit/errors";
import { fetchServerRedditResponse } from "@/lib/reddit/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const subreddit = normalizeSubreddit(url.searchParams.get("subreddit"));
  const query = url.searchParams.get("q")?.trim() ?? "";
  const sort = normalizeRedditSort(url.searchParams.get("sort"));
  const searchSort = normalizeRedditSearchSort(url.searchParams.get("sort"));
  const timeRange = normalizeRedditTimeRange(url.searchParams.get("t"));
  const after = url.searchParams.get("after");
  const count = Number(url.searchParams.get("count"));
  const limit = Number(url.searchParams.get("limit"));
  const redditUrl = buildRedditListingUrl({
    subreddit,
    sort,
    query,
    restrictToSubreddit: url.searchParams.get("restrict_sr") === "on",
    searchSort,
    timeRange,
    after,
    count: Number.isFinite(count) ? count : undefined,
    limit: Number.isFinite(limit) ? limit : 25,
  });

  let response: Response;

  try {
    response = await fetchServerRedditResponse(redditUrl);
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
    const detail = await readErrorMessage(response);

    return NextResponse.json(
      {
        message: [
          `Reddit request failed with ${response.status} ${response.statusText}`,
          detail ?? "",
        ].filter(Boolean).join(". "),
      },
      { status: response.status },
    );
  }

  return NextResponse.json(await response.json());
}
