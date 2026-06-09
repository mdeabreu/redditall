import { createRedditNetworkError, isAbortError } from "./errors";

export type RedditFetchSource = "proxy" | "server";

export type RedditResponseResult = {
  response: Response;
  source: RedditFetchSource;
};

export async function fetchJson(
  url: string,
  {
    cache,
    headers,
    signal,
    source,
  }: {
    cache?: RequestCache;
    headers?: HeadersInit;
    signal?: AbortSignal;
    source: RedditFetchSource;
  },
): Promise<RedditResponseResult> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...headers,
      },
      cache,
      signal,
    });

    return { response, source };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw createRedditNetworkError(error, source);
  }
}
