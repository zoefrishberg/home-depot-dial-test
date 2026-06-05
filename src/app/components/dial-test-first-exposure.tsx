import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Play, Volume2 } from "lucide-react";
import type { DialTestVideo } from "../constants";
import { SurveyHeader } from "./survey-header";
import { useVideoSource } from "../../utils/useVideoSource";

interface DialTestFirstExposureProps {
  sessionId: string | null;
  testMode?: boolean;
  onComplete: () => void;
  onBack: () => void;
  progress: number;
  video: DialTestVideo;
}

export function DialTestFirstExposure({
  onComplete,
  onBack,
  progress,
  video,
}: DialTestFirstExposureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const isPlaying = hasStartedPlaying && !hasEnded;
  const shouldShowHeadline = !hasStartedPlaying;

  useVideoSource(videoRef, video);

  const handleStartVideo = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Failed to start video:", err);
      });
      setHasStartedPlaying(true);
    }
  };

  // Prevent pausing once playback has started, until the video has ended.
  // Read `ended` from the video element directly: the `pause` event fires
  // immediately after `ended`, before React has flushed setHasEnded, so the
  // captured `hasEnded` state would still be stale and trigger a replay.
  const handlePause = () => {
    const video = videoRef.current;
    if (video && hasStartedPlaying && !video.ended) {
      video.play().catch((err) => {
        console.error("Failed to resume video:", err);
      });
    }
  };

  const handleEnded = () => {
    setHasEnded(true);
  };

  return (
    <div className="h-dvh max-h-dvh bg-[#E8E8E8] flex justify-center overflow-hidden">
      <div className="w-full max-w-2xl h-full min-h-0 flex flex-col min-[672px]:border-x min-[672px]:border-gray-300">
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          isPlaying ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
        }`}
      >
        <SurveyHeader progress={progress} />
      </div>

      <main
        className={`flex-1 min-h-0 overflow-hidden transition-[padding] duration-300 ease-in-out ${
          isPlaying ? "pt-0" : "pt-6"
        }`}
      >
        <div
          className="max-w-2xl w-full h-full min-h-0 mx-auto flex flex-col"
        >
          <div
            className={`shrink-0 overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-in-out ${
              shouldShowHeadline ? "max-h-24 opacity-100 mb-6" : "max-h-0 opacity-0 mb-0"
            }`}
          >
            <h1 className="px-4">
              Please watch the following video with sound.
            </h1>
          </div>

          <div className="relative w-full flex-1 min-h-0 overflow-hidden mx-auto">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain object-center"
              playsInline
              controls={false}
              onPause={handlePause}
              onEnded={handleEnded}
              onContextMenu={(e) => e.preventDefault()}
            >
              Your browser does not support the video tag.
            </video>

            {!hasStartedPlaying && (
              <div
                className="absolute inset-0 bg-[var(--dark-70)] flex flex-col items-center justify-center cursor-pointer z-20"
                onClick={handleStartVideo}
              >
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-6 hover:bg-white/30 transition-colors">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Volume2 className="w-5 h-5" />
                  <span>Turn your sound on before playing</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          hasEnded ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <footer className="bg-[#E8E8E8] px-4 pt-4 pb-6 border-t border-gray-300">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 bg-[#C8C8C8] hover:bg-[#B8B8B8] text-[#3D3D3D] border-0 h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={onComplete}
                  className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12"
                >
                  Continue
                </Button>
              </div>
            </div>
          </footer>
      </div>
      </div>
    </div>
  );
}
