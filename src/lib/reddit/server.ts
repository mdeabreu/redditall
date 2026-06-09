const REDDIT_BOOTSTRAP_URL = "https://old.reddit.com";

const SERVER_REDDIT_HEADERS = {
  Accept: "application/json,text/plain;q=0.9,*/*;q=0.8",
};

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

export async function fetchServerRedditResponse(
  redditUrl: string,
  signal?: AbortSignal,
): Promise<Response> {
  const cookieHeader = await fetchRedditBootstrapCookies(signal);

  return fetch(redditUrl, {
    cache: "no-store",
    headers: {
      ...SERVER_REDDIT_HEADERS,
      Cookie: cookieHeader,
    },
    signal,
  });
}

async function fetchRedditBootstrapCookies(signal?: AbortSignal): Promise<string> {
  let response: Response;

  try {
    response = await fetch(REDDIT_BOOTSTRAP_URL, {
      cache: "no-store",
      signal,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Reddit bootstrap request failed: ${detail}`);
  }

  if (!response.ok) {
    throw new Error(`Reddit bootstrap request failed with ${response.status} ${response.statusText}`);
  }

  const cookieHeader = extractCookieHeader(response.headers);

  if (!cookieHeader) {
    throw new Error("Reddit bootstrap request returned no cookies.");
  }

  return cookieHeader;
}

function extractCookieHeader(headers: Headers): string {
  const setCookies = (headers as HeadersWithSetCookie).getSetCookie?.() ?? [];

  return setCookies
    .map((cookie) => cookie.split(";")[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ");
}
