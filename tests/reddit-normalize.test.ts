import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRedditPost } from "../src/lib/reddit/listing";

test("normalizes media posts with selftext and spoiler preview variants", () => {
  const post = normalizeRedditPost({
    kind: "t3",
    data: {
      id: "1t6meoa",
      name: "t3_1t6meoa",
      subreddit: "survivor",
      subreddit_name_prefixed: "r/survivor",
      title: "_____'s farewell post to _____",
      author: "castaway",
      permalink: "/r/survivor/comments/1t6meoa/farewell/",
      url: "https://i.redd.it/example.png",
      url_overridden_by_dest: "https://i.redd.it/example.png",
      domain: "i.redd.it",
      score: 1488,
      num_comments: 56,
      created_utc: 1_778_185_552,
      post_hint: "image",
      is_self: false,
      selftext: "Love these two",
      thumbnail: "spoiler",
      spoiler: true,
      preview: {
        images: [
          {
            source: {
              url: "https://preview.redd.it/example.png?auto=webp&amp;s=original",
              width: 974,
              height: 1094,
            },
            variants: {
              obfuscated: {
                source: {
                  url: "https://preview.redd.it/example.png?blur=40&amp;format=pjpg&amp;s=hidden",
                  width: 974,
                  height: 1094,
                },
              },
            },
          },
        ],
      },
    },
  });

  assert.ok(post);
  assert.equal(post.mediaKind, "image");
  assert.equal(post.selftext, "Love these two");
  assert.equal(post.excerpt, "Love these two");
  assert.equal(post.spoiler, true);
  assert.equal(post.thumbnail, null);
  assert.equal(post.imageUrl, "https://preview.redd.it/example.png?auto=webp&s=original");
  assert.equal(post.obfuscatedImageUrl, "https://preview.redd.it/example.png?blur=40&format=pjpg&s=hidden");
});
