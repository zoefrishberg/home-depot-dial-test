export type DialTestVideoSlug =
  | "tx-water-bottom-up-v1"
  | "tx-top-down"
  | "tx-joyride"
  | "tx-bottom-up-v1"
  | "tx-bottom-up-v2";
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

export const DEFAULT_DIAL_TEST_VIDEO_SLUG: DialTestVideoSlug = "tx-water-bottom-up-v1";

const SUPABASE_VIDEO_BASE =
  "https://tkymslezfmtkyebnagad.supabase.co/storage/v1/object/public/amazonvideos";

// Amazon Texas dial round — now fielding a SINGLE cell: `tx-water-bottom-up-v1`,
// which is also the default/fallback so both the bare URL and the explicit
// ?video= link serve it. All clips are mp4 in the public `amazonvideos` Supabase
// Storage bucket. No offset or HLS player needed (the slider shows the 0.1s
// frame as a poster so there is no black intro).
//
// The four `tx-top-down` / `tx-joyride` / `tx-bottom-up-v1` / `tx-bottom-up-v2`
// entries are DORMANT this round (no Lucid campaign points at them) — kept in
// config, not deleted, and none is the default.
//
// ASPECT RATIO: tx-joyride is square (1:1); the rest are 16:9. The video
// elements use `object-contain`, so each source is fit/letterboxed to its own
// aspect ratio without cropping or stretching.
export const DIAL_TEST_VIDEOS: Record<DialTestVideoSlug, DialTestVideo> = {
  "tx-water-bottom-up-v1": {
    slug: "tx-water-bottom-up-v1",
    title: "Texas — Water + Bottom Up V1",
    src: `${SUPABASE_VIDEO_BASE}/TexasConnectsWater30_x_BottomUp_V1.mp4`,
    format: "mp4",
  },
  "tx-top-down": {
    slug: "tx-top-down",
    title: "Texas — Top Down",
    src: `${SUPABASE_VIDEO_BASE}/TX_Top_Down_30_compressed.mp4`,
    format: "mp4",
  },
  "tx-joyride": {
    slug: "tx-joyride",
    title: "Texas — Joyride",
    src: `${SUPABASE_VIDEO_BASE}/AMZN_2026_DCJC_JOYRIDE-TEXAS_15s_INSITU-1080_1x1_R1V8_260624_ANJ.mp4`,
    format: "mp4",
  },
  "tx-bottom-up-v1": {
    slug: "tx-bottom-up-v1",
    title: "Texas — Bottom Up V1",
    src: `${SUPABASE_VIDEO_BASE}/BOTTOM_UP_TEXAS_V1.mp4`,
    format: "mp4",
  },
  "tx-bottom-up-v2": {
    slug: "tx-bottom-up-v2",
    title: "Texas — Bottom Up V2",
    src: `${SUPABASE_VIDEO_BASE}/BOTTOM_UP_TEXAS_V2.mp4`,
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
