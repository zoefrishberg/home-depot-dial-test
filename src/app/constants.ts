export type DialTestVideoSlug = "alexa-voice" | "ai-work" | "trump-mature";
export type DialTestVideoFormat = "mp4" | "hls";

export interface DialTestVideo {
  slug: DialTestVideoSlug;
  title: string;
  src: string;
  format: DialTestVideoFormat;
}

export interface ResolvedDialTestVideo extends DialTestVideo {
  requestedSlug: string | null;
  usedFallback: boolean;
}

export const DEFAULT_DIAL_TEST_VIDEO_SLUG: DialTestVideoSlug = "alexa-voice";

export const DIAL_TEST_VIDEOS: Record<DialTestVideoSlug, DialTestVideo> = {
  "alexa-voice": {
    slug: "alexa-voice",
    title: "Alexa Loses Her Voice",
    src: "https://customer-tg9n91e7s2q4xczb.cloudflarestream.com/057e932f41eca59c21012a8d95a3e5ee/manifest/video.m3u8",
    format: "hls",
  },
  "ai-work": {
    slug: "ai-work",
    title: "AI will elevate people at work, not replace jobs",
    src: "https://customer-tg9n91e7s2q4xczb.cloudflarestream.com/5f9d3e182e4c7d907434bbc2986e269e/manifest/video.m3u8",
    format: "hls",
  },
  "trump-mature": {
    slug: "trump-mature",
    title: "Trump is more mature, more disciplined than in his first term",
    src: "https://customer-tg9n91e7s2q4xczb.cloudflarestream.com/99bb8f79249ebe79ff996bb89bc8c650/manifest/video.m3u8",
    format: "hls",
  },
};

export function resolveDialTestVideo(
  requestedSlug: string | null
): ResolvedDialTestVideo {
  const normalizedSlug = requestedSlug?.trim().toLowerCase() || null;
  const video =
    normalizedSlug && normalizedSlug in DIAL_TEST_VIDEOS
      ? DIAL_TEST_VIDEOS[normalizedSlug as DialTestVideoSlug]
      : DIAL_TEST_VIDEOS[DEFAULT_DIAL_TEST_VIDEO_SLUG];

  return {
    ...video,
    requestedSlug,
    usedFallback: video.slug !== normalizedSlug,
  };
}

export function getDialTestVideoMetadata(video: ResolvedDialTestVideo) {
  return {
    slug: video.slug,
    title: video.title,
    src: video.src,
    format: video.format,
    requestedSlug: video.requestedSlug,
    usedFallback: video.usedFallback,
  };
}

export function getDialTestVideoFeedbackFields(video: ResolvedDialTestVideo) {
  return {
    videoSlug: video.slug,
    videoTitle: video.title,
    videoSrc: video.src,
    videoFormat: video.format,
    videoRequestedSlug: video.requestedSlug,
    videoUsedFallback: video.usedFallback,
  };
}
