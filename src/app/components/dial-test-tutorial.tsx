import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock, Heart, X } from "lucide-react";

interface TutorialProps {
  onComplete: () => void;
}

export function DialTestTutorial({ onComplete }: TutorialProps) {
  const [intensity, setIntensity] = useState(0); // -100 to 100
  const [activeButton, setActiveButton] = useState<"negative" | "positive" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [dataPoints, setDataPoints] = useState<Array<{ time: number; value: number }>>([]);
  const [hasStarted, setHasStarted] = useState(false);
  
  const intensityInterval = useRef<NodeJS.Timeout | null>(null);
  const videoInterval = useRef<NodeJS.Timeout | null>(null);
  const tutorialDuration = 20; // 20 second tutorial

  // Handle intensity changes (increase while holding, decay when not)
  useEffect(() => {
    intensityInterval.current = setInterval(() => {
      setIntensity(prev => {
        if (activeButton === "positive") {
          return Math.min(100, prev + 2);
        } else if (activeButton === "negative") {
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

  // Video playback timer
  useEffect(() => {
    if (isPlaying) {
      videoInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= tutorialDuration) {
            setIsPlaying(false);
            return tutorialDuration;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (videoInterval.current) {
        clearInterval(videoInterval.current);
      }
    };
  }, [isPlaying]);

  // Record data points
  useEffect(() => {
    if (isPlaying) {
      setDataPoints(prev => [...prev, { time: currentTime, value: intensity }]);
    }
  }, [currentTime, intensity, isPlaying]);

  const handleButtonPress = (type: "negative" | "positive") => {
    setActiveButton(type);
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
    }
  };

  const handleButtonRelease = () => {
    setActiveButton(null);
  };

  const getEmotionLabel = () => {
    if (intensity === 0) return "Neutral";
    if (intensity > 0) return `Positive ${intensity}%`;
    return `Negative ${Math.abs(intensity)}%`;
  };

  const getCurrentPositionX = () => {
    return (currentTime / tutorialDuration) * 100;
  };

  const generateCurvePath = () => {
    if (dataPoints.length === 0) return "";

    const width = 640;
    const height = 120;
    const midY = height / 2;

    let pathData = "";
    
    dataPoints.forEach((point, index) => {
      const x = (point.time / tutorialDuration) * width;
      const y = midY - (point.value / 100) * (midY - 10);
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else if (index === 1) {
        pathData += ` L ${x} ${y}`;
      } else {
        const prevPoint = dataPoints[index - 1];
        const prevX = (prevPoint.time / tutorialDuration) * width;
        const prevY = midY - (prevPoint.value / 100) * (midY - 10);
        const controlX = (prevX + x) / 2;
        const controlY = prevY;
        pathData += ` Q ${controlX} ${controlY}, ${x} ${y}`;
      }
    });

    return pathData;
  };

  // Get instruction text based on current time
  const getInstructionText = () => {
    if (!hasStarted) {
      return {
        title: "Let's practice first",
        text: "👇 Press and hold the red LOSING ME button"
      };
    }
    if (currentTime < 2) {
      return {
        title: "Press and Hold",
        text: "Press and hold the red LOSING ME button"
      };
    } else if (currentTime < 5) {
      return {
        title: "Watch Your Reaction",
        text: "See how the curve moves as you hold the button"
      };
    } else if (currentTime < 10) {
      return {
        title: "Try the Other Button",
        text: "Now try holding the green INTO IT button"
      };
    } else if (currentTime < 15) {
      return {
        title: "Control Intensity",
        text: "Hold longer for stronger feelings. Release to return to neutral."
      };
    } else if (currentTime < tutorialDuration) {
      return {
        title: "Practice!",
        text: "Practice switching between buttons as your feelings change"
      };
    } else {
      return {
        title: "You're Ready!",
        text: "Great job! Click Continue to start the actual video."
      };
    }
  };

  const instruction = getInstructionText();
  const progress = ((currentTime / tutorialDuration) * 100);

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
            <div 
              className="h-full bg-[#5B9FED] transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
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
            Tutorial: How to Respond
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            ⏱ Press and hold a button to show how you feel.<br />
            The longer you hold, the stronger your reaction.
          </p>

          {/* Video Player with Instructions */}
          <div className="bg-black rounded-lg overflow-hidden mb-6 shadow-lg relative">
            {/* Full square (1:1) container like real video */}
            <div className="w-full aspect-square bg-black relative">
              {/* 4:3 Tutorial content with letterboxing */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center relative">
                  <div className="text-center px-8 z-10">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      {instruction.title}
                    </h2>
                    <p className="text-xl text-white/90">
                      {instruction.text}
                    </p>
                  </div>
                </div>
              </div>

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
                    {isPlaying && (
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
            Hold longer for stronger feelings.<br />
            Release to return to neutral.
          </p>

          {/* Recording Indicator */}
          {isPlaying && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording your practice responses...</span>
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
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
                setDataPoints([]);
                setHasStarted(false);
                setIntensity(0);
              }}
            >
              Restart
            </Button>
            <Button
              onClick={onComplete}
              disabled={currentTime < tutorialDuration}
              className="flex-1 bg-[#5B9FED] hover:bg-[#4A8EDC] text-white border-0 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}