import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock, Heart, ThumbsDown } from "lucide-react";
import { saveDialData } from "../../utils/api";

interface TutorialProps {
  sessionId: string | null;
  onComplete: () => void;
  testMode?: boolean;
  progress: number;
}

interface ReactionBurst {
  id: number;
  type: "nope" | "love";
  x: number;
  emoji: string;
}

export function DialTestTutorialEmotiveButtons({ sessionId, testMode = false, onComplete, progress }: TutorialProps) {
  const [intensity, setIntensity] = useState(0); // -100 to 100
  const [activeButton, setActiveButton] = useState<"nope" | "love" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [dataPoints, setDataPoints] = useState<Array<{ time: number; value: number }>>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [recordedDataPoints, setRecordedDataPoints] = useState<Array<{ timestamp: number; button: string | null; intensity: number }>>([]);
  const [reactionBursts, setReactionBursts] = useState<ReactionBurst[]>([]);
  
  const intensityInterval = useRef<NodeJS.Timeout | null>(null);
  const videoInterval = useRef<NodeJS.Timeout | null>(null);
  const footerRef = useRef<HTMLElement>(null);
  const burstIdCounter = useRef(0);
  const tutorialDuration = 24; // 24 second tutorial
  const [holdDuration, setHoldDuration] = useState(0);

  // Handle intensity changes (increase while holding, decay when not)
  useEffect(() => {
    intensityInterval.current = setInterval(() => {
      setIntensity(prev => {
        if (activeButton === "love") {
          return Math.min(100, prev + 4);
        } else if (activeButton === "nope") {
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
      
      // Record for database (every 100ms)
      setRecordedDataPoints(prev => [...prev, {
        timestamp: currentTime,
        button: activeButton,
        intensity: intensity
      }]);
    }
  }, [currentTime, intensity, isPlaying, activeButton]);

  // Scroll to footer when tutorial ends
  useEffect(() => {
    if (currentTime >= tutorialDuration && footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [currentTime]);

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

  const handleButtonPress = (type: "nope" | "love") => {
    setActiveButton(type);
    setHoldDuration(0); // Reset hold duration on new press
    createReactionBurst(type);
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
    }
  };

  const handleButtonRelease = () => {
    setActiveButton(null);
    setHoldDuration(0); // Reset hold duration on release
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
        text: "👇 Press and hold the LOVE button"
      };
    }
    if (currentTime < 4) {
      return {
        title: "Press and Hold",
        text: "❤️ shows you're enjoying what you see in the video"
      };
    } else if (currentTime < 8) {
      return {
        title: "Press and Hold",
        text: "The longer you hold, the stronger your reaction"
      };
    } else if (currentTime < 12) {
      return {
        title: "Release",
        text: "The curve returns to neutral when you release"
      };
    } else if (currentTime < 16) {
      return {
        title: "Try the Other Button",
        text: "Now try holding the NOPE button"
      };
    } else if (currentTime < 20) {
      return {
        title: "Watch Your Reaction",
        text: "👎 shows you dislike what you see in the video"
      };
    } else if (currentTime < tutorialDuration) {
      return {
        title: "Practice!",
        text: "Practice switching between buttons as your feelings change"
      };
    } else {
      return {
        title: "Next you'll see the actual video",
        text: "Share how you feel as the video plays, using the same buttons"
      };
    }
  };

  const instruction = getInstructionText();

  // Save tutorial data when completed
  const handleContinue = async () => {
    console.log(`[Emotive Buttons Tutorial] Submitting tutorial data...`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Data points collected: ${recordedDataPoints.length}`);
    console.log(`Test mode: ${testMode}`);
    
    if (testMode) {
      console.log(`🧪 [Emotive Buttons Tutorial] Test mode - skipping database save`);
      console.log(`Would have saved ${recordedDataPoints.length} data points`);
      onComplete();
      return;
    }
    
    if (sessionId && recordedDataPoints.length > 0) {
      try {
        await saveDialData(sessionId, 'tutorial', recordedDataPoints);
        console.log(`✅ [Emotive Buttons Tutorial] Saved ${recordedDataPoints.length} tutorial data points`);
      } catch (error) {
        console.error("❌ [Emotive Buttons Tutorial] Failed to save tutorial data:", error);
      }
    } else {
      if (!sessionId) {
        console.warn("⚠️ [Emotive Buttons Tutorial] No session ID available - data not saved");
      }
      if (recordedDataPoints.length === 0) {
        console.warn("⚠️ [Emotive Buttons Tutorial] No data points recorded");
      }
    }
    onComplete();
  };

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col">
      {/* Header - More Compact */}
      <header className="bg-[#3D3D3D] px-3 py-2 flex items-center justify-between flex-shrink-0 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-white rounded flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}></div>
          </div>
          <span className="text-white font-medium text-sm">NELSurveys</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5B9FED] transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
          <Gift className="w-4 h-4 text-white" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {/* Full-Screen Video Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
          <div className="text-center px-8 z-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              {instruction.title}
            </h2>
            <p className="text-xl text-white/90">
              {instruction.text}
            </p>
          </div>
        </div>

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
                  stroke={intensity > 0 ? "#DD493C" : intensity < 0 ? "#F4D125" : "#9CA3AF"}
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

        {/* Reaction Burst Container - Covers video */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-15">
          {reactionBursts.map((burst) => (
            <div
              key={burst.id}
              className="absolute"
              style={{
                left: `${burst.x}%`,
                bottom: '160px',
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

        {/* Circular Buttons Overlay - Bottom */}
        <div className="absolute bottom-8 left-0 right-0 z-20 px-8">
          <div className="max-w-md mx-auto flex items-center justify-between">
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
              className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center gap-1 transition-all select-none touch-none shadow-lg ${
                activeButton === "nope"
                  ? "bg-[#F4D125]/20 border-[#F4D125] scale-95"
                  : "bg-white border-[#F4D125] hover:scale-105 active:scale-95"
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
              className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center gap-1 transition-all select-none touch-none shadow-lg ${
                activeButton === "love"
                  ? "bg-[#DD493C]/20 border-[#DD493C] scale-95"
                  : "bg-white border-[#DD493C] hover:scale-105 active:scale-95"
              }`}
            >
              <Heart className={`w-12 h-12 text-[#DD493C]`} strokeWidth={2.5} fill="currentColor" />
              <span className={`font-bold text-xs uppercase tracking-wider text-[#DD493C]`}>LOVE</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer ref={footerRef} className="bg-[#3D3D3D] px-4 py-4 border-t border-gray-700 relative z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3 text-gray-500 text-sm">
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
                setReactionBursts([]);
              }}
            >
              Restart
            </Button>
            <Button
              onClick={handleContinue}
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