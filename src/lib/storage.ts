import { REDDIT_SORTS, RedditSort, normalizeRedditSort, normalizeSubreddit } from "./reddit";

export type RedditPreferences = {
  selectedSubreddit: string;
  recentSubreddits: string[];
  sort: RedditSort;
};

export type FeedPrefs = {
  subreddit: string;
  sort: RedditSort;
  recentSubreddits: string[];
};

export type ThemePreference = "system" | "light" | "dark";

const SELECTED_SUBREDDIT_KEY = "redditall:selected-subreddit";
const RECENT_SUBREDDITS_KEY = "redditall:recent-subreddits";
const SORT_KEY = "redditall:sort";
const THEME_KEY = "redditall:theme";
const LEGACY_SELECTED_SUBREDDIT_KEY = "reddit-frontend:selected-subreddit";
const LEGACY_RECENT_SUBREDDITS_KEY = "reddit-frontend:recent-subreddits";
const LEGACY_SORT_KEY = "reddit-frontend:sort";
const DEFAULT_SELECTED_SUBREDDIT = "all";
const DEFAULT_RECENT_SUBREDDITS = [DEFAULT_SELECTED_SUBREDDIT];
const MAX_RECENT_SUBREDDITS = 12;
const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export function getSelectedSubreddit(fallback = DEFAULT_SELECTED_SUBREDDIT): string {
  const value = readStorageWithLegacy(SELECTED_SUBREDDIT_KEY, LEGACY_SELECTED_SUBREDDIT_KEY);
  return value ? normalizeSubreddit(value) : normalizeSubreddit(fallback);
}

export function setSelectedSubreddit(subreddit: string): string {
  const normalized = normalizeSubreddit(subreddit);
  writeStorage(SELECTED_SUBREDDIT_KEY, normalized);
  addRecentSubreddit(normalized);
  return normalized;
}

export function getRecentSubreddits(fallback: string[] = DEFAULT_RECENT_SUBREDDITS): string[] {
  const parsed = parseStringArray(readStorageWithLegacy(RECENT_SUBREDDITS_KEY, LEGACY_RECENT_SUBREDDITS_KEY));
  const source = parsed.length > 0 ? parsed : fallback;
  return dedupeSubreddits(source).slice(0, MAX_RECENT_SUBREDDITS);
}

export function setRecentSubreddits(subreddits: string[]): string[] {
  const normalized = dedupeSubreddits(subreddits).slice(0, MAX_RECENT_SUBREDDITS);
  writeStorage(RECENT_SUBREDDITS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function addRecentSubreddit(subreddit: string): string[] {
  const normalized = normalizeSubreddit(subreddit);
  return setRecentSubreddits([normalized, ...getRecentSubreddits([])]);
}

export function getSelectedSort(fallback: RedditSort = "hot"): RedditSort {
  return normalizeRedditSort(readStorageWithLegacy(SORT_KEY, LEGACY_SORT_KEY) || fallback);
}

export function setSelectedSort(sort: RedditSort | string): RedditSort {
  const normalized = normalizeRedditSort(sort);
  writeStorage(SORT_KEY, normalized);
  return normalized;
}

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference) ? (value as ThemePreference) : "system";
}

export function getThemePreference(fallback: ThemePreference = "system"): ThemePreference {
  return normalizeThemePreference(readStorage(THEME_KEY) ?? fallback);
}

export function setThemePreference(preference: ThemePreference | string): ThemePreference {
  const normalized = normalizeThemePreference(preference);
  writeStorage(THEME_KEY, normalized);
  return normalized;
}

export function getRedditPreferences(): RedditPreferences {
  return {
    selectedSubreddit: getSelectedSubreddit(),
    recentSubreddits: getRecentSubreddits(),
    sort: getSelectedSort(),
  };
}

export function readPrefs(): FeedPrefs {
  return {
    subreddit: getSelectedSubreddit(),
    sort: getSelectedSort(),
    recentSubreddits: getRecentSubreddits(),
  };
}

export function setRedditPreferences(preferences: Partial<RedditPreferences>): RedditPreferences {
  if (preferences.selectedSubreddit) {
    setSelectedSubreddit(preferences.selectedSubreddit);
  }

  if (preferences.recentSubreddits) {
    setRecentSubreddits(preferences.recentSubreddits);
  }

  if (preferences.sort && REDDIT_SORTS.includes(preferences.sort)) {
    setSelectedSort(preferences.sort);
  }

  return getRedditPreferences();
}

export function writePrefs(preferences: Partial<FeedPrefs>): FeedPrefs {
  if (preferences.subreddit) {
    setSelectedSubreddit(preferences.subreddit);
  }

  if (preferences.recentSubreddits) {
    setRecentSubreddits(preferences.recentSubreddits);
  }

  if (preferences.sort) {
    setSelectedSort(preferences.sort);
  }

  return readPrefs();
}

export function clearRedditPreferences(): void {
  removeStorage(SELECTED_SUBREDDIT_KEY);
  removeStorage(RECENT_SUBREDDITS_KEY);
  removeStorage(SORT_KEY);
  removeStorage(THEME_KEY);
  removeStorage(LEGACY_SELECTED_SUBREDDIT_KEY);
  removeStorage(LEGACY_RECENT_SUBREDDITS_KEY);
  removeStorage(LEGACY_SORT_KEY);
}

function dedupeSubreddits(subreddits: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const subreddit of subreddits) {
    const normalized = normalizeSubreddit(subreddit);
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }

  return result;
}

function parseStringArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function readStorage(key: string): string | null {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function readStorageWithLegacy(key: string, legacyKey: string): string | null {
  const value = readStorage(key);
  if (value !== null) {
    return value;
  }

  const legacyValue = readStorage(legacyKey);
  if (legacyValue !== null) {
    writeStorage(key, legacyValue);
  }

  return legacyValue;
}

function writeStorage(key: string, value: string): void {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    // localStorage can throw in private browsing or restricted frames.
  }
}

function removeStorage(key: string): void {
  try {
    getStorage()?.removeItem(key);
  } catch {
    // localStorage can throw in private browsing or restricted frames.
  }
}

function getStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}
