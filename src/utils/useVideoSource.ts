import { useEffect, type RefObject } from "react";
import type { DialTestVideo } from "../app/constants";

const HLS_MIME_TYPE = "application/vnd.apple.mpegurl";

export function useVideoSource(
  videoRef: RefObject<HTMLVideoElement>,
  video: DialTestVideo,
  mediaFragment?: string
) {
  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;

    const src = mediaFragment ? `${video.src}${mediaFragment}` : video.src;

    if (video.format === "mp4") {
      element.src = src;
      return;
    }

    if (element.canPlayType(HLS_MIME_TYPE)) {
      element.src = src;
      return;
    }

    let isCancelled = false;
    let hls: { destroy: () => void } | null = null;

    import("hls.js/light").then(({ default: Hls }) => {
      if (isCancelled) return;

      if (!Hls.isSupported()) {
        console.error("HLS playback is not supported in this browser.", {
          videoSlug: video.slug,
          videoSrc: video.src,
        });
        return;
      }

      hls = new Hls();
      hls.loadSource(video.src);
      hls.attachMedia(element);
    });

    return () => {
      isCancelled = true;
      hls?.destroy();
    };
  }, [mediaFragment, video, videoRef]);
}
