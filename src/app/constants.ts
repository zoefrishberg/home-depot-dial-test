export type DialTestVideoSlug =
  | "amazon-top-down"
  | "amazon-bottom-up";
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

export const DEFAULT_DIAL_TEST_VIDEO_SLUG: DialTestVideoSlug = "amazon-top-down";

const SUPABASE_VIDEO_BASE =
  "https://tkymslezfmtkyebnagad.supabase.co/storage/v1/object/public/amazonvideos";

// Amazon VA Combo round. Each video is fielded as its own Lucid campaign and
// routed via ?video=<slug>. Both clips are ~60s 1080p mp4 in the public
// `amazonvideos` Supabase Storage bucket (the filenames say "30" but the clips
// run ~60s — expected, not a bug). No offset or HLS player needed (the slider
// shows the 0.1s frame as a poster so there is no black intro).
export const DIAL_TEST_VIDEOS: Record<DialTestVideoSlug, DialTestVideo> = {
  "amazon-top-down": {
    slug: "amazon-top-down",
    title: "Amazon — Top Down",
    src: `${SUPABASE_VIDEO_BASE}/amazon-top-down.mp4`,
    format: "mp4",
  },
  "amazon-bottom-up": {
    slug: "amazon-bottom-up",
    title: "Amazon — Bottom Up",
    src: `${SUPABASE_VIDEO_BASE}/amazon-bottom-up.mp4`,
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
