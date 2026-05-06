import { fetchJson } from "./transport";

const SERVER_REDDIT_HEADERS = {
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 ReddItAll/0.1",
};

export async function fetchServerRedditResponse(redditUrl: string): Promise<Response> {
  const { response } = await fetchJson(redditUrl, {
    cache: "no-store",
    headers: SERVER_REDDIT_HEADERS,
    source: "server",
  });

  if (response.status !== 403) {
    return response;
  }

  const oldRedditUrl = new URL(redditUrl);
  oldRedditUrl.hostname = "old.reddit.com";

  try {
    const retry = await fetchJson(oldRedditUrl.toString(), {
      cache: "no-store",
      headers: SERVER_REDDIT_HEADERS,
      source: "server",
    });
    return retry.response;
  } catch {
    return response;
  }
}
