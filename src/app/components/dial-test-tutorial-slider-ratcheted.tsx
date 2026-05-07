import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock, MoveHorizontal } from "lucide-react";
import { saveDialData } from "../../utils/api";

interface TutorialProps {
  sessionId: string | null;
  onComplete: () => void;
  testMode?: boolean;
  progress: number;
}

export function DialTestTutorialSliderRatcheted({ sessionId, testMode = false, onComplete, progress }: TutorialProps) {
  const [intensity, setIntensity] = useState(0); // -100 to 100, snapped to 10-point increments
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [dataPoints, setDataPoints] = useState<Array<{ time: number; value: number }>>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [recordedDataPoints, setRecordedDataPoints] = useState<Array<{ timestamp: number; button: string | null; intensity: number }>>([]);
  const [sliderSide, setSliderSide] = useState<'left' | 'right'>('right'); // Default to right
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoInterval = useRef<NodeJS.Timeout | null>(null);
  const footerRef = useRef<HTMLElement>(null);
  const tutorialDuration = 24; // 24 second tutorial

  // Load slider side preference from localStorage on mount
  useEffect(() => {
    const savedSide = localStorage.getItem('sliderSide');
    if (savedSide === 'left' || savedSide === 'right') {
      setSliderSide(savedSide);
    }
  }, []);

  // Toggle slider side and save to localStorage
  const toggleSliderSide = () => {
    const newSide = sliderSide === 'right' ? 'left' : 'right';
    setSliderSide(newSide);
    localStorage.setItem('sliderSide', newSide);
  };

  // Video playback timer - only plays while touching
  useEffect(() => {
    if (isPlaying && isTouching) {
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
    } else {
      if (videoInterval.current) {
        clearInterval(videoInterval.current);
      }
    }

    return () => {
      if (videoInterval.current) {
        clearInterval(videoInterval.current);
      }
    };
  }, [isPlaying, isTouching]);

  // Record data points
  useEffect(() => {
    if (isPlaying && isTouching) {
      setDataPoints(prev => [...prev, { time: currentTime, value: intensity }]);
      
      // Record for database (every 100ms)
      setRecordedDataPoints(prev => [...prev, {
        timestamp: currentTime,
        button: intensity > 0 ? "positive" : intensity < 0 ? "negative" : null,
        intensity: intensity
      }]);
    }
  }, [currentTime, intensity, isPlaying, isTouching]);

  // Scroll to footer when tutorial ends
  useEffect(() => {
    if (currentTime >= tutorialDuration && footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [currentTime]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouching || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const relativeY = Math.max(0, Math.min(1, y / rect.height));
    
    // Map: top (0) = +100, middle (0.5) = 0, bottom (1) = -100
    const rawIntensity = (0.5 - relativeY) * 200;
    
    // Snap to nearest 10-point increment
    const snappedIntensity = Math.round(rawIntensity / 10) * 10;
    setIntensity(snappedIntensity);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsTouching(true);
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
    }
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    setIsTouching(false);
  };

  const handlePointerLeave = () => {
    setIsTouching(false);
  };

  const generateCurvePath = () => {
    if (dataPoints.length === 0) return { pathD: "", areaD: "", points: [] };

    const width = 200; // Horizontal distance trailing to the left
    const height = 192; // Match slider height (h-48 = 192px)
    const timeWindow = 5; // Show last 5 seconds of data (adjustable for scrolling speed)
    
    // Filter to only recent data points within the time window
    const now = currentTime;
    const recentPoints = dataPoints.filter(point => now - point.time <= timeWindow);
    
    if (recentPoints.length === 0) return { pathD: "", areaD: "", points: [] };

    // Map points: most recent point is at right edge (x=200), older points move left
    const points = recentPoints.map(point => {
      const timeDiff = now - point.time; // 0 = newest, timeWindow = oldest
      const x = width - (timeDiff / timeWindow) * width; // Right to left: 200 (newest) to 0 (oldest)
      const y = height / 2 - (point.value / 100) * (height / 2 - 20);
      return { x, y, value: point.value };
    });

    if (points.length === 0) return { pathD: "", areaD: "", points: [] };

    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      if (i === 1) {
        pathData += ` L ${points[i].x} ${points[i].y}`;
      } else {
        const prevPoint = points[i - 1];
        const controlX = (prevPoint.x + points[i].x) / 2;
        const controlY = prevPoint.y;
        pathData += ` Q ${controlX} ${controlY}, ${points[i].x} ${points[i].y}`;
      }
    }

    // Create area path (fill under the curve)
    const areaData = pathData + ` L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    return { pathD: pathData, areaD: areaData, points };
  };

  // Get instruction text based on current time
  const getInstructionText = () => {
    if (!hasStarted) {
      return {
        title: "Let's practice first",
        text: "👇 Touch and hold the slider",
        subtitle: "Tip: Tap the ⇄ button below to switch sides"
      };
    }
    if (currentTime < 4) {
      return {
        title: "Hold to Play",
        text: "Video plays only while you're holding the slider"
      };
    } else if (currentTime < 8) {
      return {
        title: "Slide Up",
        text: "Move your thumb up ⬆️ when you LIKE what you see"
      };
    } else if (currentTime < 12) {
      return {
        title: "Slide Down",
        text: "Move your thumb down ⬇️ when you DON'T like what you see"
      };
    } else if (currentTime < 16) {
      return {
        title: "Keep Moving",
        text: "Change your position as your feelings change"
      };
    } else if (currentTime < 20) {
      return {
        title: "Stay Engaged",
        text: "The video pauses if you let go"
      };
    } else if (currentTime < tutorialDuration) {
      return {
        title: "Almost Done!",
        text: "Keep holding until the tutorial ends..."
      };
    } else {
      return {
        title: "Perfect! 🎉",
        text: "You're ready for the real thing"
      };
    }
  };

  const handleContinue = async () => {
    if (testMode) {
      console.log("🧪 Test mode: Skipped saving tutorial data");
      if (onComplete) {
        onComplete();
      }
      return;
    }

    if (sessionId && recordedDataPoints.length > 0) {
      try {
        await saveDialData(sessionId, 'tutorial', recordedDataPoints);
        console.log(`Tutorial data saved: ${recordedDataPoints.length} points`);
      } catch (error) {
        console.error('Failed to save tutorial data:', error);
      }
    }
    
    if (onComplete) {
      onComplete();
    }
  };

  const faderPosition = 50 - (intensity / 2); // Map -100..100 to 100%..0%
  const instruction = getInstructionText();

  // Generate tick marks for every 10 points
  const tickMarks = [];
  for (let i = -100; i <= 100; i += 10) {
    const tickPosition = 50 - (i / 2); // Map value to percentage position
    const isCenter = i === 0;
    tickMarks.push(
      <div
        key={i}
        className="absolute left-1/2 -translate-x-1/2"
        style={{ top: `${tickPosition}%` }}
      >
        <div className={`h-[2px] ${isCenter ? 'w-4 bg-black/60' : 'w-3 bg-black/30'}`} />
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] bg-black flex flex-col">
      {/* Header - More Compact */}
      <header className="bg-[#3D3D3D] px-3 py-2 flex items-center justify-between flex-shrink-0 relative z-30">
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

      {/* Full-Screen Content */}
      <main className="flex-1 relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center px-4">
        {/* Instruction Box */}
        <div className="text-center mb-8 max-w-sm mx-auto px-4 z-20">
          <h2 className="text-2xl font-semibold text-white mb-2">{instruction.title}</h2>
          <p className="text-lg text-gray-300 mb-1">{instruction.text}</p>
          {instruction.subtitle && (
            <p className="text-sm text-gray-400 mt-2">{instruction.subtitle}</p>
          )}
        </div>

        {/* Vertical Slider - Dynamic Side with Toggle Button */}
        <div className={`fixed ${sliderSide === 'right' ? 'right-8' : 'left-8'} top-1/2 -translate-y-1/2 z-20`}>
          {/* Toggle Button - Below Slider - Mobile Only */}
          <button
            onClick={toggleSliderSide}
            className="md:hidden absolute -bottom-16 left-1/2 -translate-x-1/2 bg-gray-700/70 hover:bg-gray-700/80 rounded-full p-2.5 shadow-lg transition-all pointer-events-auto z-30"
            title={`Switch to ${sliderSide === 'right' ? 'left' : 'right'} hand`}
          >
            <MoveHorizontal className="w-4 h-4 text-gray-300" />
          </button>

          <div 
            className="relative h-64 flex items-center select-none"
            style={{
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              userSelect: 'none'
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Trailing ECG-style curve - positioned based on slider side */}
            {(() => {
              const curveData = generateCurvePath();
              const trackH = 256; // h-64 = 256px
              const lastPoint = curveData.points.length > 0 ? curveData.points[curveData.points.length - 1] : null;
              const neutralCurveColor = "#787896"; // Neutral gray-purple color
              
              return (
                <>
                  {/* Curve SVG - positioned opposite to slider */}
                  <div className={`absolute ${sliderSide === 'right' ? 'right-full mr-2' : 'left-full ml-2'} top-0 bottom-0 w-48 pointer-events-none overflow-visible`}>
                    <svg 
                      viewBox="0 0 200 192" 
                      preserveAspectRatio="none"
                      className="w-full h-full"
                      style={{ overflow: 'visible' }}
                    >
                      <defs>
                        {/* Gradient for the stroke - fades from left to right */}
                        <linearGradient id="ribbonLineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={neutralCurveColor} stopOpacity="0.2" />
                          <stop offset="100%" stopColor={neutralCurveColor} stopOpacity="0.9" />
                        </linearGradient>
                        {/* Gradient for area fill - vertical gradient */}
                        <linearGradient id="ribbonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={neutralCurveColor} stopOpacity="0.25" />
                          <stop offset="100%" stopColor={neutralCurveColor} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Neutral center line - dotted horizontal */}
                      <line 
                        x1="0" 
                        y1="96" 
                        x2="200" 
                        y2="96" 
                        stroke="rgba(0, 0, 0, 0.15)" 
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                      
                      {/* Area fill under curve */}
                      {curveData.areaD && (
                        <path
                          d={curveData.areaD}
                          fill="url(#ribbonAreaGradient)"
                        />
                      )}
                      
                      {/* Main curve line */}
                      {curveData.pathD && (
                        <path
                          d={curveData.pathD}
                          fill="none"
                          stroke="url(#ribbonLineGradient)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      
                      {/* Glow circles at the end point */}
                      {lastPoint && (
                        <>
                          <circle 
                            cx={lastPoint.x} 
                            cy={lastPoint.y} 
                            r="4" 
                            fill={neutralCurveColor} 
                            opacity="0.7" 
                          />
                          <circle 
                            cx={lastPoint.x} 
                            cy={lastPoint.y} 
                            r="8" 
                            fill={neutralCurveColor} 
                            opacity="0.15" 
                          />
                        </>
                      )}
                    </svg>
                  </div>

                  {/* Connecting dashed line from curve end to fader */}
                  {lastPoint && isTouching && (
                    <svg 
                      className="absolute right-full top-0 w-48 pointer-events-none mr-2"
                      style={{ height: `${trackH}px` }}
                      viewBox="0 0 200 192"
                      preserveAspectRatio="none"
                    >
                      <line
                        x1={lastPoint.x}
                        y1={lastPoint.y}
                        x2="200"
                        y2={96 - (intensity / 100) * (96 - 20)}
                        stroke={neutralCurveColor}
                        strokeWidth="1.5"
                        strokeOpacity="0.25"
                        strokeDasharray="3 2"
                      />
                    </svg>
                  )}
                </>
              );
            })()}

            {/* Slider Track with gradient background and tick marks */}
            <div 
              ref={sliderRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              className="relative w-7 h-full rounded-full cursor-pointer touch-none z-10"
              style={{
                background: 'linear-gradient(to bottom, #29A347 0%, #E8E8E8 50%, #B8392E 100%)'
              }}
            >
              {/* Center line */}
              <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/50" />
              
              {/* Tick marks */}
              {tickMarks}
              
              {/* Fader Cap */}
              <div 
                className="absolute left-1/2 w-17 h-8 bg-[#5B9FED] rounded-lg shadow-xl border-2 border-gray-300 flex items-center justify-center transition-all duration-75"
                style={{ 
                  top: `${faderPosition}%`,
                  transform: `translate(-50%, -50%) ${isTouching ? 'scale(1.1)' : 'scale(1)'}`,
                  transition: isTouching ? 'top 75ms ease-out' : 'transform 0.15s ease-out, top 75ms ease-out'
                }}
              >
                {/* Grip lines */}
                <div className="flex gap-1">
                  <div className="w-0.5 h-4 bg-white rounded" />
                  <div className="w-0.5 h-4 bg-white rounded" />
                  <div className="w-0.5 h-4 bg-white rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer ref={footerRef} className="bg-[#E8E8E8] px-4 py-4 border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Your answer is private</span>
          </div>
          {currentTime < tutorialDuration && (
            <p className="text-center text-sm text-gray-600 mb-3">
              Complete the tutorial to continue
            </p>
          )}
          <Button
            onClick={handleContinue}
            disabled={currentTime < tutorialDuration}
            className="w-full bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </footer>
    </div>
  );
}
