import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  clearRedditPreferences,
  getThemePreference,
  normalizeThemePreference,
  setThemePreference,
} from "../src/lib/storage";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  globalThis.window = {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    },
  } as Window & typeof globalThis;
});

test("normalizes missing and invalid theme preferences to system", () => {
  assert.equal(getThemePreference(), "system");
  assert.equal(normalizeThemePreference("sepia"), "system");
  assert.equal(normalizeThemePreference(null), "system");

  window.localStorage.setItem("redditall:theme", "sepia");
  assert.equal(getThemePreference(), "system");
});

test("round-trips valid theme preferences through storage", () => {
  assert.equal(setThemePreference("dark"), "dark");
  assert.equal(getThemePreference(), "dark");

  assert.equal(setThemePreference("light"), "light");
  assert.equal(getThemePreference(), "light");

  assert.equal(setThemePreference("system"), "system");
  assert.equal(getThemePreference(), "system");
});

test("clearing preferences removes the stored theme preference", () => {
  setThemePreference("dark");

  clearRedditPreferences();

  assert.equal(getThemePreference(), "system");
});
