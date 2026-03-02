import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock, Heart, ThumbsDown, Play, Volume2 } from "lucide-react";
import { saveDialData, recordPageCompletion } from "../../utils/api";

interface DataPoint {
  timestamp: number;
  value: number; // -100 to 100, where negative is "nope" and positive is "love"
}

interface DialTestEmotiveButtonsProps {
  sessionId: string | null;
  testMode?: boolean;
  onComplete?: () => void;
}

interface ReactionBurst {
  id: number;
  type: "nope" | "love";
  x: number;
  emoji: string;
}

export function DialTestEmotiveButtons({ sessionId, testMode = false, onComplete }: DialTestEmotiveButtonsProps) {
  const [intensity, setIntensity] = useState(0); // -100 to 100
  const [isPlaying, setIsPlaying] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [activeButton, setActiveButton] = useState<"nope" | "love" | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [recordedDataPoints, setRecordedDataPoints] = useState<Array<{ timestamp: number; button: string | null; intensity: number }>>([]);
  const [reactionBursts, setReactionBursts] = useState<ReactionBurst[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const intensityInterval = useRef<NodeJS.Timeout | null>(null);
  const intensityRef = useRef(0);
  const activeButtonRef = useRef<"nope" | "love" | null>(null);
  const [holdDuration, setHoldDuration] = useState(0);
  const burstIdCounter = useRef(0);

  const VIDEO_SRC = "https://vod-prod-02-source-u4t2w48mf8oc.s3.amazonaws.com/5ad7d3c623a9b5d7aec16c1c-38b5d74b0144255d9279ac39376df9de.mp4";

  // Keep intensityRef in sync with intensity state
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  // Keep activeButtonRef in sync with activeButton state
  useEffect(() => {
    activeButtonRef.current = activeButton;
  }, [activeButton]);

  // Video event handlers
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => {
    setIsPlaying(false);
    setHasEnded(true);
  };
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      if (intensityInterval.current) clearInterval(intensityInterval.current);
    };
  }, []);

  // Record data points while video is playing
  useEffect(() => {
    if (isPlaying) {
      console.log("[Emotive Buttons Variant] Started recording data points...");
      recordingInterval.current = setInterval(() => {
        if (videoRef.current) {
          const timestamp = videoRef.current.currentTime;
          const currentIntensity = intensityRef.current;
          const currentButton = activeButtonRef.current;
          
          setDataPoints(prev => [...prev, {
            timestamp: timestamp,
            value: currentIntensity
          }]);
          
          // Record for database (every 100ms)
          setRecordedDataPoints(prev => [...prev, {
            timestamp: timestamp,
            button: currentButton,
            intensity: currentIntensity
          }]);
        }
      }, 100);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        if (recordedDataPoints.length > 0) {
          console.log(`[Emotive Buttons Variant] Paused recording. Total points so far: ${recordedDataPoints.length}`);
        }
      }
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isPlaying]);

  // Handle intensity changes (increase while holding, decay when not)
  useEffect(() => {
    intensityInterval.current = setInterval(() => {
      setIntensity(prev => {
        if (activeButton === "love") {
          // Increase positive intensity
          return Math.min(100, prev + 4);
        } else if (activeButton === "nope") {
          // Increase negative intensity
          return Math.max(-100, prev - 4);
        } else {
          // Decay toward neutral
          if (prev > 0) {
            return Math.max(0, prev - 2);
          } else if (prev < 0) {
            return Math.min(0, prev + 2);
          }
          return 0;
        }
      });
      
      // Increment hold duration when button is active
      if (activeButton) {
        setHoldDuration(prev => prev + 100);
      }
    }, 100);

    return () => {
      if (intensityInterval.current) {
        clearInterval(intensityInterval.current);
      }
    };
  }, [activeButton]);

  const handleButtonPress = (type: "nope" | "love") => {
    setActiveButton(type);
    setHoldDuration(0);
    
    // Create reaction burst animation
    createReactionBurst(type);
  };

  const handleButtonRelease = () => {
    setActiveButton(null);
    setHoldDuration(0);
  };

  const createReactionBurst = (type: "nope" | "love") => {
    const emoji = type === "nope" ? "👎" : "❤️";
    
    const baseX = type === "nope" ? 15 : 85; // Left 15% or right 85%
    const randomOffset = (Math.random() - 0.5) * 20; // -10 to +10
    
    const newBurst: ReactionBurst = {
      id: burstIdCounter.current++,
      type,
      x: baseX + randomOffset,
      emoji,
    };
    
    setReactionBursts(prev => [...prev, newBurst]);
    
    // Remove burst after animation completes
    setTimeout(() => {
      setReactionBursts(prev => prev.filter(b => b.id !== newBurst.id));
    }, 3000);
  };

  // Continuously create bursts while holding
  useEffect(() => {
    if (!activeButton || !isPlaying) return;
    
    const burstInterval = setInterval(() => {
      createReactionBurst(activeButton);
    }, 400); // Create burst every 400ms while holding
    
    return () => clearInterval(burstInterval);
  }, [activeButton, isPlaying]);

  const handleSubmit = async () => {
    console.log(`[Emotive Buttons Variant] Submitting dial test data...`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Data points collected: ${recordedDataPoints.length}`);
    console.log(`Test mode: ${testMode}`);
    
    if (testMode) {
      console.log(`🧪 [Emotive Buttons Variant] Test mode - skipping database save`);
      console.log(`Would have saved ${recordedDataPoints.length} data points`);
      if (onComplete) {
        onComplete();
      }
      return;
    }
    
    if (sessionId && recordedDataPoints.length > 0) {
      try {
        await saveDialData(sessionId, 'actual', recordedDataPoints);
        await recordPageCompletion(sessionId, 'dialTest');
        console.log(`✅ [Emotive Buttons Variant] Successfully saved ${recordedDataPoints.length} dial test data points`);
        if (onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error("❌ [Emotive Buttons Variant] Failed to save dial test data:", error);
        alert("Failed to save your responses. Please try again.");
      }
    } else {
      if (!sessionId) {
        console.warn("⚠️ [Emotive Buttons Variant] No session ID available - data not saved");
      }
      if (recordedDataPoints.length === 0) {
        console.warn("⚠️ [Emotive Buttons Variant] No data points recorded - user may not have interacted with buttons");
      }
      if (onComplete) {
        onComplete();
      }
    }
  };

  const handleStartVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setHasStartedPlaying(true);
    }
  };

  // Function to generate SVG path for the emotion curve
  const generateCurvePath = () => {
    if (dataPoints.length < 2) return "M0,60 L640,60"; // Neutral line if not enough data

    const points = dataPoints.map(dp => ({
      x: (dp.timestamp / videoDuration) * 640,
      y: 60 - (dp.value / 100) * 60
    }));

    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L${points[i].x},${points[i].y}`;
    }

    return path;
  };

  return (
    <div className="min-h-[100dvh] bg-[#E8E8E8] flex flex-col">
      {/* Header */}
      <header className="bg-[#3D3D3D] px-3 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-white rounded flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}></div>
          </div>
          <span className="text-white font-medium text-sm">NELSurveys</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-[#5B9FED]" style={{ width: "60%" }}></div>
          </div>
          <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
          <Gift className="w-4 h-4 text-white" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 py-2 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto relative">
          <h1 className="text-lg text-[#3D3D3D] mb-1">
            Watch the video and share your reaction
          </h1>
          <p className="text-xs text-gray-600 mb-2">
            ⏱ Press and hold a button to show how you feel as you watch.
          </p>

          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden mb-2 shadow-lg relative">
            <video
              ref={videoRef}
              className="w-full aspect-video"
              src={VIDEO_SRC}
              playsInline
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              controls={hasStartedPlaying}
            >
              Your browser does not support the video tag.
            </video>

            {/* Pre-play overlay */}
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

            {/* Emotion Curve Overlay */}
            {hasStartedPlaying && dataPoints.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Bottom timeline curve */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent">
                  <svg 
                    viewBox="0 0 640 120" 
                    preserveAspectRatio="none"
                    className="w-full h-full"
                  >
                    {/* Neutral center line */}
                    <line 
                      x1="0" 
                      y1="60" 
                      x2="640" 
                      y2="60" 
                      stroke="rgba(255, 255, 255, 0.3)" 
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    
                    {/* Emotion curve */}
                    <path
                      d={generateCurvePath()}
                      fill="none"
                      stroke={intensity > 0 ? "#DD493C" : intensity < 0 ? "#F4D125" : "#9CA3AF"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.9"
                    />
                    
                    {/* Current position indicator */}
                    {isPlaying && videoDuration > 0 && (
                      <line 
                        x1={`${(currentTime / videoDuration) * 100}%`}
                        y1="0" 
                        x2={`${(currentTime / videoDuration) * 100}%`}
                        y2="120" 
                        stroke="rgba(91, 159, 237, 0.8)" 
                        strokeWidth="2"
                      />
                    )}
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Reaction Burst Container - Covers video and buttons */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {reactionBursts.map((burst) => (
              <div
                key={burst.id}
                className="absolute"
                style={{
                  left: `${burst.x}%`,
                  bottom: '60px',
                  animation: `floatUp 3s ease-out forwards`,
                }}
              >
                <span className="opacity-0" style={{
                  fontSize: '1.8rem',
                  animation: `fadeInOut 3s ease-out forwards`
                }}>
                  {burst.emoji}
                </span>
              </div>
            ))}
          </div>

          {/* Circular Buttons - Below Video */}
          <div className="relative flex items-center justify-between px-4 mb-4">
            {/* NOPE Button - Far Left */}
            <button
              onPointerDown={() => handleButtonPress("nope")}
              onPointerUp={handleButtonRelease}
              onPointerLeave={handleButtonRelease}
              onContextMenu={(e) => e.preventDefault()}
              style={{ 
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                userSelect: 'none'
              }}
              className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center gap-1 transition-all select-none touch-none ${
                activeButton === "nope"
                  ? "bg-[#F4D125]/20 border-[#F4D125] scale-95"
                  : "bg-white border-[#F4D125] hover:scale-105 active:scale-95 shadow-lg"
              }`}
            >
              <ThumbsDown className={`w-12 h-12 text-[#F4D125]`} strokeWidth={2.5} />
              <span className={`font-bold text-xs uppercase tracking-wider text-[#F4D125]`}>NOPE</span>
            </button>

            {/* LOVE Button - Far Right */}
            <button
              onPointerDown={() => handleButtonPress("love")}
              onPointerUp={handleButtonRelease}
              onPointerLeave={handleButtonRelease}
              onContextMenu={(e) => e.preventDefault()}
              style={{ 
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                userSelect: 'none'
              }}
              className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center gap-1 transition-all select-none touch-none ${
                activeButton === "love"
                  ? "bg-[#DD493C]/20 border-[#DD493C] scale-95"
                  : "bg-white border-[#DD493C] hover:scale-105 active:scale-95 shadow-lg"
              }`}
            >
              <Heart className={`w-12 h-12 text-[#DD493C]`} strokeWidth={2.5} fill="currentColor" />
              <span className={`font-bold text-xs uppercase tracking-wider text-[#DD493C]`}>LOVE</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] px-4 py-6 border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Your answer is private</span>
          </div>
          {!hasEnded && hasStartedPlaying && (
            <p className="text-center text-sm text-gray-600 mb-3">
              Please watch the entire video to continue
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-[#C8C8C8] hover:bg-[#B8B8B8] text-[#3D3D3D] border-0 h-12"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasEnded}
              className={`flex-1 h-12 border-0 transition-all ${
                hasEnded 
                  ? 'bg-[#5B9FED] hover:bg-[#4A8EDC] text-white cursor-pointer' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-60'
              }`}
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}