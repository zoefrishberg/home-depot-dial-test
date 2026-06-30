export type DialTestVideoSlug =
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

export const DEFAULT_DIAL_TEST_VIDEO_SLUG: DialTestVideoSlug = "tx-top-down";

const SUPABASE_VIDEO_BASE =
  "https://tkymslezfmtkyebnagad.supabase.co/storage/v1/object/public/amazonvideos";

// Amazon Texas dial round. Four clips, each fielded as its own Lucid campaign
// and routed via ?video=<slug>; the slug is tagged on the session so each cell's
// data stays separated. All clips are mp4 in the public `amazonvideos` Supabase
// Storage bucket. No offset or HLS player needed (the slider shows the 0.1s
// frame as a poster so there is no black intro).
//
// ASPECT RATIO: tx-joyride is square (1:1); the other three are 16:9. The video
// elements use `object-contain`, so each source is fit/letterboxed to its own
// aspect ratio without cropping or stretching — the square clip renders
// correctly inside the same container.
export const DIAL_TEST_VIDEOS: Record<DialTestVideoSlug, DialTestVideo> = {
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
