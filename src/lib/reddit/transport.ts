import { createRedditNetworkError, isAbortError } from "./errors";
import { fetchRedditJsonp } from "./jsonp";

export type RedditFetchSource = "cors" | "jsonp" | "proxy" | "server";

export type RedditPayloadResult = {
  payload: unknown;
  source: RedditFetchSource;
};

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

export async function fetchBrowserRedditPayload(
  directUrl: string,
  signal?: AbortSignal,
): Promise<RedditPayloadResult | null> {
  try {
    const { response } = await fetchJson(directUrl, { signal, source: "cors" });
    if (response.ok) {
      return { payload: await response.json(), source: "cors" };
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
  }

  try {
    return { payload: await fetchRedditJsonp(directUrl, signal), source: "jsonp" };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
  }

  return null;
}
