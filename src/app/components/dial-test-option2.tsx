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
  onComplete?: () => void;
}

export function DialTestOption2({ sessionId, onComplete }: DialTestOption2Props) {
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
          return Math.min(100, prev + 2);
        } else if (activeButton === "negative") {
          // Increase negative intensity
          return Math.max(-100, prev - 2);
        } else {
          // Decay toward neutral
          if (prev > 0) {
            return Math.max(0, prev - 1);
          } else if (prev < 0) {
            return Math.min(0, prev + 1);
          }
          return 0;
        }
      });
    }, 100);

    return () => {
      if (intensityInterval.current) {
        clearInterval(intensityInterval.current);
      }
    };
  }, [activeButton]);

  const handleButtonPress = (type: "negative" | "positive") => {
    setActiveButton(type);
  };

  const handleButtonRelease = () => {
    setActiveButton(null);
  };

  const handleSubmit = async () => {
    if (sessionId && recordedDataPoints.length > 0) {
      try {
        await saveDialData(sessionId, 'actual', recordedDataPoints);
        await recordPageCompletion(sessionId, 'dialTest');
        console.log(`Saved ${recordedDataPoints.length} dial test data points`);
        if (onComplete) {
          onComplete();
        }
      } catch (error) {
        console.error("Failed to save dial test data:", error);
        alert("Failed to save your responses. Please try again.");
      }
    } else if (onComplete) {
      onComplete();
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
    <div className="min-h-screen bg-[#E8E8E8] flex flex-col">
      {/* Header */}
      <header className="bg-[#3D3D3D] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-white" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}></div>
          </div>
          <span className="text-white font-medium">NELSurveys</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div className="h-full bg-[#5B9FED]" style={{ width: "60%" }}></div>
          </div>
          <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <Gift className="w-5 h-5 text-white" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl text-[#3D3D3D] mb-2">
            Watch the video and share your reaction
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            ⏱ Press and hold a button to show how you feel.<br />
            The longer you hold, the stronger your reaction.
          </p>

          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden mb-6 shadow-lg relative">
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
          </div>

          {/* Emotion intensity indicator - between video and buttons */}
          <div className="mb-4">
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-700 font-semibold text-sm">{getEmotionLabel()}</span>
              </div>
              {/* Centered bidirectional intensity meter */}
              <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                {/* Center marker */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 z-10 -translate-x-1/2"></div>
                {/* Fill bar */}
                <div
                  className="absolute top-0 bottom-0 rounded-full transition-all duration-100"
                  style={{
                    backgroundColor: intensity > 0 ? '#22C55E' : intensity < 0 ? '#EF4444' : 'transparent',
                    left: intensity < 0 ? `${50 - (Math.abs(intensity) / 100) * 50}%` : '50%',
                    width: `${(Math.abs(intensity) / 100) * 50}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Hold Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onPointerDown={() => handleButtonPress("negative")}
              onPointerUp={handleButtonRelease}
              onPointerLeave={handleButtonRelease}
              style={{ backgroundColor: 'rgba(235, 85, 71, 1)' }}
              className={`hover:opacity-90 active:opacity-100 border-2 border-[rgba(220,70,56,1)] rounded-lg p-4 flex flex-col items-center gap-2 transition-all select-none ${
                activeButton === "negative" ? "scale-95 shadow-inner" : "shadow-sm"
              }`}
            >
              <X className="w-8 h-8 text-white" strokeWidth={2.5} />
              <span className="font-semibold text-white text-xs">LOSING ME</span>
            </button>

            <button
              onPointerDown={() => handleButtonPress("positive")}
              onPointerUp={handleButtonRelease}
              onPointerLeave={handleButtonRelease}
              style={{ backgroundColor: 'rgba(44, 195, 82, 1)' }}
              className={`hover:opacity-90 active:opacity-100 border-2 border-[rgba(34,175,67,1)] rounded-lg p-4 flex flex-col items-center gap-2 transition-all select-none ${
                activeButton === "positive" ? "scale-95 shadow-inner" : "shadow-sm"
              }`}
            >
              <Heart className="w-8 h-8 text-white" strokeWidth={2.5} />
              <span className="font-semibold text-white text-xs">INTO IT</span>
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mb-4">
            Hold longer for stronger feelings.<br />
            Release to return to neutral.
          </p>

          {/* Recording Indicator */}
          {isPlaying && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording your responses...</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] px-4 py-6 border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Your answer is private</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-[#C8C8C8] hover:bg-[#B8B8B8] text-[#3D3D3D] border-0 h-12"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-[#5B9FED] hover:bg-[#4A8EDC] text-white border-0 h-12"
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}