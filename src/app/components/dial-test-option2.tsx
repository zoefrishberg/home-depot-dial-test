import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock, Heart, X, Volume2, Play } from "lucide-react";
import { saveDialData, recordPageCompletion } from "../../utils/api";

interface DataPoint {
  timestamp: number;
  value: number; // -100 to 100, where negative is "losing me" and positive is "into it"
}

interface DialTestOption2Props {
  sessionId: string | null;
  testMode?: boolean;
  onComplete?: () => void;
  progress: number;
}

export function DialTestOption2({ sessionId, testMode = false, onComplete, progress }: DialTestOption2Props) {
  const [intensity, setIntensity] = useState(0); // -100 to 100
  const [isPlaying, setIsPlaying] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [activeButton, setActiveButton] = useState<"negative" | "positive" | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [recordedDataPoints, setRecordedDataPoints] = useState<Array<{ timestamp: number; button: string | null; intensity: number }>>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const intensityInterval = useRef<NodeJS.Timeout | null>(null);
  const intensityRef = useRef(0);
  const activeButtonRef = useRef<"negative" | "positive" | null>(null);
  const [holdDuration, setHoldDuration] = useState(0);

  const VIDEO_SRC = "https://vod-prod-02-source-u4t2w48mf8oc.s3.amazonaws.com/66e9ada2497b6eaa620de6d6-96c9c123bc405c87dfe5f25019c1a876.mp4";

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
      console.log("[Button Variant] Started recording data points...");
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
          console.log(`[Button Variant] Paused recording. Total points so far: ${recordedDataPoints.length}`);
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
        if (activeButton === "positive") {
          // Increase positive intensity
          return Math.min(100, prev + 4);
        } else if (activeButton === "negative") {
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

  const handleButtonPress = (type: "negative" | "positive") => {
    setActiveButton(type);
    setHoldDuration(0); // Reset hold duration on new press
  };

  const handleButtonRelease = () => {
    setActiveButton(null);
    setHoldDuration(0); // Reset hold duration on release
  };

  const handleSubmit = async () => {
    console.log(`[Button Variant] Submitting dial test data...`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Data points collected: ${recordedDataPoints.length}`);
    console.log(`Test mode: ${testMode}`);
    
    if (testMode) {
      console.log(`🧪 [Button Variant] Test mode - skipping database save`);
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
        console.log(`✅ [Button Variant] Successfully saved ${recordedDataPoints.length} dial test data points`);
        if (onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error("❌ [Button Variant] Failed to save dial test data:", error);
        alert("Failed to save your responses. Please try again.");
      }
    } else {
      if (!sessionId) {
        console.warn("⚠️ [Button Variant] No session ID available - data not saved");
      }
      if (recordedDataPoints.length === 0) {
        console.warn("⚠️ [Button Variant] No data points recorded - user may not have interacted with buttons");
      }
      if (onComplete) {
        onComplete();
      }
    }
  };

  // Get visual properties based on intensity
  const getIntensityColor = () => {
    if (intensity > 0) {
      const alpha = intensity / 100;
      return `rgba(34, 197, 94, ${alpha * 0.6})`;
    } else if (intensity < 0) {
      const alpha = Math.abs(intensity) / 100;
      return `rgba(239, 68, 68, ${alpha * 0.6})`;
    }
    return "rgba(156, 163, 175, 0.3)";
  };

  const getEmotionLabel = () => {
    if (intensity === 0) return "Neutral";
    if (intensity > 0) return `Positive ${intensity}%`;
    return `Negative ${Math.abs(intensity)}%`;
  };

  // Generate SVG path for the emotion curve
  const generateCurvePath = () => {
    if (dataPoints.length === 0 || videoDuration === 0) {
      return "";
    }

    const width = 640; // SVG viewBox width
    const height = 120; // Height of the curve area
    const midY = height / 2;

    // Create smooth curve using bezier curves
    let pathData = "";
    
    dataPoints.forEach((point, index) => {
      const x = (point.timestamp / videoDuration) * width;
      const y = midY - (point.value / 100) * (midY - 10); // Map -100 to 100 -> height range with padding

      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else if (index === 1) {
        // For the second point, just draw a line
        pathData += ` L ${x} ${y}`;
      } else {
        // Use quadratic bezier curve for smooth transitions
        const prevPoint = dataPoints[index - 1];
        const prevX = (prevPoint.timestamp / videoDuration) * width;
        const prevY = midY - (prevPoint.value / 100) * (midY - 10);
        
        // Calculate control point for smooth curve
        const controlX = (prevX + x) / 2;
        const controlY = prevY;
        
        pathData += ` Q ${controlX} ${controlY}, ${x} ${y}`;
      }
    });

    return pathData;
  };

  // Get current position indicator on timeline
  const getCurrentPositionX = () => {
    if (videoDuration === 0) return 0;
    return (currentTime / videoDuration) * 100;
  };

  const handleStartVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setHasStartedPlaying(true);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col">
      {/* Header - More Compact */}
      <header className="bg-[#313131] px-3 py-2 flex items-center justify-between flex-shrink-0 relative z-30">
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

      {/* Full-Screen Video Container */}
      <main className="flex-1 relative overflow-hidden">
        {/* Video - Full Screen Background */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={VIDEO_SRC}
          playsInline
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          controls={false}
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
        <div className="absolute inset-0 pointer-events-none z-10">
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
              {dataPoints.length > 0 && (
                <path
                  d={generateCurvePath()}
                  fill="none"
                  stroke={intensity > 0 ? "#22C55E" : intensity < 0 ? "#EF4444" : "#9CA3AF"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
              )}
              
              {/* Current position indicator */}
              {videoDuration > 0 && (
                <line 
                  x1={`${getCurrentPositionX()}%`}
                  y1="0" 
                  x2={`${getCurrentPositionX()}%`}
                  y2="120" 
                  stroke="rgba(91, 159, 237, 0.8)" 
                  strokeWidth="2"
                />
              )}
            </svg>
          </div>
        </div>

        {/* Hold-to-Feel Buttons - Overlaid */}
        <div className="absolute bottom-8 left-0 right-0 z-20 px-6">
          <div className="max-w-md mx-auto">
            {/* Recording Indicator */}
            {isPlaying && (
              <div className="flex items-center justify-center gap-2 text-sm text-white mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Recording your responses...</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                {/* Horizontal LED intensity bars - above button */}
                <div className="flex gap-1 mb-2 justify-center">
                  {[1, 2, 3, 4, 5].map((level) => {
                    // Each LED lights up at 1s intervals 
                    const thresholdMs = level * 1000;
                    const isActive = activeButton === "negative" && holdDuration >= thresholdMs;
                    return (
                      <div
                        key={level}
                        className={`w-4 h-2 rounded-[1px] transition-all duration-100 ${
                          isActive ? 'bg-[#EB5547]' : 'bg-[#E8E8E8]'
                        }`}
                      />
                    );
                  })}
                </div>

                <button
                  onPointerDown={() => handleButtonPress("negative")}
                  onPointerUp={handleButtonRelease}
                  onPointerLeave={handleButtonRelease}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ 
                    backgroundColor: 'rgba(235, 85, 71, 1)',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    userSelect: 'none'
                  }}
                  className={`hover:opacity-90 active:opacity-100 border-2 border-[rgba(220,70,56,1)] rounded-lg p-4 flex flex-col items-center gap-2 transition-all select-none touch-none ${
                    activeButton === "negative" ? "scale-95 shadow-inner" : "shadow-sm"
                  }`}
                >
                  <X className="w-8 h-8 text-white" strokeWidth={2.5} />
                  <span className="font-semibold text-white text-xs">LOSING ME</span>
                </button>
              </div>

              <div className="flex flex-col">
                {/* Horizontal LED intensity bars - above button */}
                <div className="flex gap-1 mb-2 justify-center">
                  {[1, 2, 3, 4, 5].map((level) => {
                    // Each LED lights up at 1s intervals 
                    const thresholdMs = level * 1000;
                    const isActive = activeButton === "positive" && holdDuration >= thresholdMs;
                    return (
                      <div
                        key={level}
                        className={`w-4 h-2 rounded-[1px] transition-all duration-100 ${
                          isActive ? 'bg-[#2CC352]' : 'bg-[#E8E8E8]'
                        }`}
                      />
                    );
                  })}
                </div>

                <button
                  onPointerDown={() => handleButtonPress("positive")}
                  onPointerUp={handleButtonRelease}
                  onPointerLeave={handleButtonRelease}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ 
                    backgroundColor: 'rgba(44, 195, 82, 1)',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    userSelect: 'none'
                  }}
                  className={`hover:opacity-90 active:opacity-100 border-2 border-[rgba(34,175,67,1)] rounded-lg p-4 flex flex-col items-center gap-2 transition-all select-none touch-none ${
                    activeButton === "positive" ? "scale-95 shadow-inner" : "shadow-sm"
                  }`}
                >
                  <Heart className="w-8 h-8 text-white" strokeWidth={2.5} />
                  <span className="font-semibold text-white text-xs">INTO IT</span>
                </button>
              </div>
            </div>
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