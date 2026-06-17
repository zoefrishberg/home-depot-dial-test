export type DialTestVideoSlug =
  | "kitchen"
  | "fifa-acceptance"
  | "fifa-convenience"
  | "fifa-security"
  | "fifa-tap-in";
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

export const DEFAULT_DIAL_TEST_VIDEO_SLUG: DialTestVideoSlug = "kitchen";

const SUPABASE_VIDEO_BASE =
  "https://tkymslezfmtkyebnagad.supabase.co/storage/v1/object/public/visavideos";

// Each video is fielded as its own Lucid campaign and routed via ?video=<slug>.
// All clips are plain, pre-trimmed/compressed mp4 in Supabase Storage — no
// offset or HLS player needed (the slider already shows the 0.1s frame as a
// poster so there is no black intro).
export const DIAL_TEST_VIDEOS: Record<DialTestVideoSlug, DialTestVideo> = {
  kitchen: {
    slug: "kitchen",
    title: "Kitchen",
    src: `${SUPABASE_VIDEO_BASE}/kitchen.mp4`,
    format: "mp4",
  },
  "fifa-acceptance": {
    slug: "fifa-acceptance",
    title: "FIFA — Acceptance",
    src: `${SUPABASE_VIDEO_BASE}/fifa-acceptance.mp4`,
    format: "mp4",
  },
  "fifa-convenience": {
    slug: "fifa-convenience",
    title: "FIFA — Convenience",
    src: `${SUPABASE_VIDEO_BASE}/fifa-convenience.mp4`,
    format: "mp4",
  },
  "fifa-security": {
    slug: "fifa-security",
    title: "FIFA — Security",
    src: `${SUPABASE_VIDEO_BASE}/fifa-security.mp4`,
    format: "mp4",
  },
  "fifa-tap-in": {
    slug: "fifa-tap-in",
    title: "FIFA — Tap In",
    src: `${SUPABASE_VIDEO_BASE}/fifa-tap-in.mp4`,
    format: "mp4",
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
