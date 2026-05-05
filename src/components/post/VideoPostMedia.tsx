import Hls from "hls.js";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { RedditPostCardData } from "../feed/types";
import { Icon } from "../ui/Icon";
import { getAspectRatio, withAutoplay } from "./postUtils";

export function VideoPostMedia({
  post,
  posterUrl,
}: {
  post: RedditPostCardData;
  posterUrl?: string | null;
}) {
  const rawVideoUrl = post.videoUrl ?? post.video ?? undefined;
  const hlsUrl = post.hlsUrl ?? (rawVideoUrl?.includes(".m3u8") ? rawVideoUrl : undefined);
  const fallbackVideoUrl = post.fallbackVideoUrl ?? (rawVideoUrl && !rawVideoUrl.includes(".m3u8") ? rawVideoUrl : undefined);
  const richVideoEmbedUrl = post.richVideoEmbedUrl ?? undefined;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState<string | null>(
    getAspectRatio(post.videoWidth, post.videoHeight),
  );
  const [sourceKind, setSourceKind] = useState<"hls" | "fallback">(hlsUrl ? "hls" : "fallback");
  const [failed, setFailed] = useState(false);
  const redditUrl = post.redditUrl ?? post.url ?? "#";
  const mediaStyle: CSSProperties | undefined = mediaAspectRatio
    ? { aspectRatio: mediaAspectRatio }
    : undefined;

  const rememberAspectRatio = (width: number, height: number) => {
    if (width > 0 && height > 0) {
      setMediaAspectRatio((currentRatio) => currentRatio ?? `${width} / ${height}`);
    }
  };

  useEffect(() => {
    if (!active || failed || richVideoEmbedUrl) return;

    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    let cancelled = false;

    const failPlayback = () => {
      if (cancelled) return;

      if (sourceKind === "hls" && fallbackVideoUrl) {
        setSourceKind("fallback");
        return;
      }

      setFailed(true);
    };

    const playVideo = () => {
      video.play().catch(failPlayback);
    };

    video.addEventListener("error", failPlayback);

    if (sourceKind === "hls" && hlsUrl) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        playVideo();
      } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.on(Hls.Events.ERROR, (_event: string, data: { fatal?: boolean }) => {
          if (data.fatal) failPlayback();
        });
        hls.on(Hls.Events.MANIFEST_PARSED, playVideo);
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
      } else {
        failPlayback();
      }
    } else if (fallbackVideoUrl) {
      video.src = fallbackVideoUrl;
      playVideo();
    } else {
      failPlayback();
    }

    return () => {
      cancelled = true;
      video.removeEventListener("error", failPlayback);
      hls?.destroy();
    };
  }, [active, failed, fallbackVideoUrl, hlsUrl, richVideoEmbedUrl, sourceKind]);

  if (failed) {
    return (
      <div className="ar-video-fallback">
        <a href={redditUrl} target="_blank" rel="noreferrer">
          Open on reddit.com
        </a>
      </div>
    );
  }

  if (active) {
    if (richVideoEmbedUrl) {
      return (
        <div className="ar-video-player-wrap" style={mediaStyle}>
          <iframe
            className="ar-video-player ar-video-embed"
            src={withAutoplay(richVideoEmbedUrl)}
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <div className="ar-video-player-wrap" style={mediaStyle}>
        <video
          ref={videoRef}
          className="ar-video-player"
          controls
          playsInline
          autoPlay
          poster={posterUrl ?? undefined}
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            rememberAspectRatio(video.videoWidth, video.videoHeight);
          }}
        />
      </div>
    );
  }

  return (
    <button className="ar-video-poster" type="button" style={mediaStyle} onClick={() => setActive(true)} aria-label={`Play video: ${post.title}`}>
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          loading="lazy"
          onLoad={(event) => {
            const image = event.currentTarget;
            rememberAspectRatio(image.naturalWidth, image.naturalHeight);
          }}
        />
      ) : (
        <span className="ar-video-empty" aria-hidden="true" />
      )}
      <span className="ar-video-badge">
        <Icon name="video" />
        Video
      </span>
      <span className="ar-video-play" aria-hidden="true">
        <span />
      </span>
    </button>
  );
}
