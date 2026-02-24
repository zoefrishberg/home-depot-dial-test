import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock, Heart, X } from "lucide-react";

interface DataPoint {
  timestamp: number;
  value: number; // -100 to 100, where negative is "losing me" and positive is "into it"
}

export function DialTestOption2() {
  const [intensity, setIntensity] = useState(0); // -100 to 100
  const [isPlaying, setIsPlaying] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [activeButton, setActiveButton] = useState<"negative" | "positive" | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const playerRef = useRef<any>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const intensityInterval = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const intensityRef = useRef(0); // Track current intensity value

  // Keep intensityRef in sync with intensity state
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  // Load YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player-2', {
        videoId: 'PTXvuzFLYxE',
        playerVars: {
          'playsinline': 1
        },
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    };

    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
      if (intensityInterval.current) clearInterval(intensityInterval.current);
      if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current);
    };
  }, []);

  const onPlayerStateChange = (event: any) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // Record data points while video is playing
  useEffect(() => {
    if (isPlaying) {
      recordingInterval.current = setInterval(() => {
        if (playerRef.current) {
          setDataPoints(prev => [...prev, {
            timestamp: playerRef.current.getCurrentTime(),
            value: intensityRef.current // Use ref instead of closure
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
  }, [isPlaying]); // Remove intensity from dependencies

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

  // Update current time and video duration
  useEffect(() => {
    if (isPlaying) {
      timeUpdateInterval.current = setInterval(() => {
        if (playerRef.current) {
          setCurrentTime(playerRef.current.getCurrentTime());
          setVideoDuration(playerRef.current.getDuration());
        }
      }, 100);
    } else {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    }

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [isPlaying]);

  const handleButtonPress = (type: "negative" | "positive") => {
    setActiveButton(type);
  };

  const handleButtonRelease = () => {
    setActiveButton(null);
  };

  const handleSubmit = () => {
    alert(`Dial test completed! Recorded ${dataPoints.length} data points.`);
    console.log("Data points:", dataPoints);
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
            Hold a button to show how you feel. The longer you hold, the stronger the feeling.
          </p>

          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden mb-6 shadow-lg relative">
            <div id="youtube-player-2" className="w-full aspect-video"></div>
            
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
            <div className="bg-white rounded-lg px-4 py-3 flex items-center justify-between shadow-sm border border-gray-200">
              <span className="text-gray-700 font-semibold text-sm">{getEmotionLabel()}</span>
              {/* Continuous intensity meter */}
              <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden ml-4">
                <div 
                  className="h-full rounded-full transition-all duration-100"
                  style={{ 
                    width: `${Math.abs(intensity)}%`,
                    backgroundColor: intensity > 0 ? '#22C55E' : intensity < 0 ? '#EF4444' : '#9CA3AF',
                    marginLeft: intensity < 0 ? `${100 - Math.abs(intensity)}%` : '0'
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
            Hold longer for stronger feelings • Release to return to neutral
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