import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Gift, Play, Volume2 } from "lucide-react";
import { DIAL_TEST_VIDEO_SRC } from "../constants";
import { NelSurveysLogo } from "./nel-surveys-logo";

interface DialTestFirstExposureProps {
  sessionId: string | null;
  testMode?: boolean;
  onComplete: () => void;
  onBack: () => void;
  progress: number;
}

export function DialTestFirstExposure({
  onComplete,
  onBack,
  progress,
}: DialTestFirstExposureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

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
    <div className="min-h-dvh bg-[#E8E8E8] flex justify-center">
      <div className="w-full max-w-2xl min-h-dvh flex flex-col min-[672px]:border-x min-[672px]:border-gray-300">
      <header className="bg-[#3D3D3D] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <NelSurveysLogo />
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5B9FED] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <Gift className="w-5 h-5 text-white" />
        </div>
      </header>

      <main className="flex-1 py-6 overflow-y-auto flex items-center">
        <div className="max-w-2xl w-full mx-auto">
          <h1 className="mb-6 px-4">
            Please watch the following video with sound.
          </h1>

          <div className="relative w-full max-h-[70vh] aspect-video bg-black overflow-hidden mx-auto">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain"
              src={DIAL_TEST_VIDEO_SRC}
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
                className="absolute inset-0 bg-black flex flex-col items-center justify-center cursor-pointer z-20"
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

      <footer className="bg-[#E8E8E8] px-4 pt-4 pb-6 border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
          {!hasEnded && (
            <div className="flex items-center justify-center mb-4 text-gray-500 text-sm">
              <span>Please watch the entire video to continue</span>
            </div>
          )}
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
              disabled={!hasEnded}
              className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12 disabled:bg-[var(--dark-40)] disabled:opacity-100 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
