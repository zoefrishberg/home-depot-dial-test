export type DialTestVideoSlug =
  // Good Employer round 2 — 8-video dial test
  | "cnn-robotics-full"
  | "cnn-clip-1-human-robot"
  | "cnn-clip-2-full-open"
  | "cnn-clip-3-jobs-reframe"
  | "cnn-clip-4-innovation"
  | "fox-business-robotics"
  | "sanders-ai-robots"
  | "good-employer-default"
  // Dormant — Good Employer round 1
  | "amazon-robotic-tech";
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

export const DEFAULT_DIAL_TEST_VIDEO_SLUG: DialTestVideoSlug = "cnn-robotics-full";

// The bucket is literally named "Good Employer Content" (with spaces). The
// percent-encoded form ("Good%20Employer%20Content") is what actually resolves,
// so the %20 is stored verbatim and must NOT be stripped, renamed, or
// "cleaned up".
const SUPABASE_VIDEO_BASE =
  "https://tkymslezfmtkyebnagad.supabase.co/storage/v1/object/public/Good%20Employer%20Content";

// "Good Employer" dial round 2 — 8 videos (5 CNN clips, Fox Business, Sanders,
// plus a default alias). Each is fielded on its own `?video=` slug as a
// separate Lucid campaign. All clips are mp4 in the public "Good Employer
// Content" Supabase Storage bucket. The default/fallback is `cnn-robotics-full`
// (16:9) so a bare or invalid URL never lands on the portrait clip.
//
// ASPECT RATIO: sanders-ai-robots is PORTRAIT (590×1280); all others are 16:9
// landscape. The video elements use `object-contain`, so each source is
// fit/letterboxed to its own aspect ratio without cropping or stretching.
export const DIAL_TEST_VIDEOS: Record<DialTestVideoSlug, DialTestVideo> = {
  // ── Round 2 — active ───────────────────────────────────────────────────
  "cnn-robotics-full": {
    slug: "cnn-robotics-full",
    title: "CNN — Full Clip",
    src: `${SUPABASE_VIDEO_BASE}/cnn-robotics-full.mp4`,
    format: "mp4",
  },
  "cnn-clip-1-human-robot": {
    slug: "cnn-clip-1-human-robot",
    title: "CNN — Clip 1: Human-Robot Collaboration",
    src: `${SUPABASE_VIDEO_BASE}/cnn-clip-1-human-robot.mp4`,
    format: "mp4",
  },
  "cnn-clip-2-full-open": {
    slug: "cnn-clip-2-full-open",
    title: "CNN — Clip 2: Full Open",
    src: `${SUPABASE_VIDEO_BASE}/cnn-clip-2-full-open.mp4`,
    format: "mp4",
  },
  "cnn-clip-3-jobs-reframe": {
    slug: "cnn-clip-3-jobs-reframe",
    title: "CNN — Clip 3: Jobs Reframe",
    src: `${SUPABASE_VIDEO_BASE}/cnn-clip-3-jobs-reframe.mp4`,
    format: "mp4",
  },
  "cnn-clip-4-innovation": {
    slug: "cnn-clip-4-innovation",
    title: "CNN — Clip 4: Innovation",
    src: `${SUPABASE_VIDEO_BASE}/cnn-clip-4-innovation.mp4`,
    format: "mp4",
  },
  "fox-business-robotics": {
    slug: "fox-business-robotics",
    title: "Fox Business — Prime Day Robotics",
    src: `${SUPABASE_VIDEO_BASE}/fox-business-robotics.mp4`,
    format: "mp4",
  },
  "sanders-ai-robots": {
    slug: "sanders-ai-robots",
    title: "Sanders — AI Robots Bezos (portrait)",
    src: `${SUPABASE_VIDEO_BASE}/sanders-ai-robots.mp4`,
    format: "mp4",
  },
  "good-employer-default": {
    slug: "good-employer-default",
    title: "Good Employer — Default (Full CNN Clip)",
    src: `${SUPABASE_VIDEO_BASE}/cnn-robotics-full.mp4`,
    format: "mp4",
  },
  // ── Dormant — round 1 ──────────────────────────────────────────────────
  "amazon-robotic-tech": {
    slug: "amazon-robotic-tech",
    title: "Good Employer — Amazon Robotic Tech (dormant)",
    src: `${SUPABASE_VIDEO_BASE}/amazon-robotic-tech.mp4`,
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
