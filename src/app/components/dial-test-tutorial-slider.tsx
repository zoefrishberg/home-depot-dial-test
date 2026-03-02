import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock } from "lucide-react";
import { saveDialData } from "../../utils/api";

interface TutorialProps {
  sessionId: string | null;
  onComplete: () => void;
}

export function DialTestTutorialSlider({ sessionId, onComplete }: TutorialProps) {
  const [intensity, setIntensity] = useState(0); // -100 to 100
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [dataPoints, setDataPoints] = useState<Array<{ time: number; value: number }>>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [recordedDataPoints, setRecordedDataPoints] = useState<Array<{ timestamp: number; button: string | null; intensity: number }>>([]);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoInterval = useRef<NodeJS.Timeout | null>(null);
  const tutorialDuration = 24; // 24 second tutorial

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

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouching || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const relativeY = Math.max(0, Math.min(1, y / rect.height));
    
    // Map: top (0) = +100, middle (0.5) = 0, bottom (1) = -100
    // Remove rounding for smoother motion
    const newIntensity = (0.5 - relativeY) * 200;
    setIntensity(newIntensity);
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
        text: "👇 Touch and hold the slider"
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
        text: "Move your thumb down ⬇️ when you DISLIKE what you see"
      };
    } else if (currentTime < 16) {
      return {
        title: "Stay in the Middle",
        text: "Keep it centered when you feel neutral"
      };
    } else if (currentTime < 20) {
      return {
        title: "Keep Holding!",
        text: "Video will pause if you release the slider"
      };
    } else if (currentTime < tutorialDuration) {
      return {
        title: "Practice!",
        text: "Move the slider up and down as your feelings change"
      };
    } else {
      return {
        title: "Next you'll see the actual video",
        text: "Use the same slider to show how you feel."
      };
    }
  };

  const instruction = getInstructionText();
  const progress = ((currentTime / tutorialDuration) * 100);

  // Save tutorial data when completed
  const handleContinue = async () => {
    if (sessionId && recordedDataPoints.length > 0) {
      try {
        await saveDialData(sessionId, 'tutorial', recordedDataPoints);
        console.log(`Saved ${recordedDataPoints.length} tutorial data points`);
      } catch (error) {
        console.error("Failed to save tutorial data:", error);
      }
    }
    onComplete();
  };

  // Calculate fader cap position (0-100%)
  const faderPosition = 50 - (intensity / 2); // Map -100..100 to 100%..0%

  return (
    <div className="min-h-[100dvh] bg-[#E8E8E8] flex flex-col">
      {/* Header - More Compact */}
      <header className="bg-[#3D3D3D] px-3 py-2 flex items-center justify-between flex-shrink-0">
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

      {/* Main Content - Optimized spacing */}
      <main className="flex-1 px-3 py-2 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg text-[#3D3D3D] mb-1">
            Tutorial
          </h1>
          <p className="text-xs text-gray-600 mb-2">
            ⏱ Hold and slide to show how you feel.<br />
            Video plays only while you're touching the slider.
          </p>

          {/* Video Player with Slider - More compact */}
          <div className="bg-black rounded-lg overflow-hidden mb-2 shadow-lg">
            {/* Adjusted aspect ratio for better mobile fit */}
            <div className="w-full aspect-[4/3] bg-black relative">
              {/* Tutorial content with letterboxing */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-start pt-16 justify-center relative">
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

              {/* Emotion Curve Overlay on Tutorial */}
              {dataPoints.length > 0 && (
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
                      
                      {/* Emotion curve - left to right on timeline */}
                      {(() => {
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
                        
                        return (
                          <path
                            d={pathData}
                            fill="none"
                            stroke="#787896"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.9"
                          />
                        );
                      })()}
                      
                      {/* Current position indicator */}
                      <line 
                        x1={`${(currentTime / tutorialDuration) * 100}%`}
                        y1="0" 
                        x2={`${(currentTime / tutorialDuration) * 100}%`}
                        y2="120" 
                        stroke="rgba(91, 159, 237, 0.8)" 
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Vertical Slider below the video - centered and thinner */}
            <div className="flex justify-center py-6 px-4 bg-[#E8E8E8]">
              <div 
                className="relative h-48 flex items-center select-none"
                style={{
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                  userSelect: 'none'
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* Trailing ECG-style curve to the left of slider */}
                {(() => {
                  const curveData = generateCurvePath();
                  const trackH = 192; // h-48 = 192px
                  const lastPoint = curveData.points.length > 0 ? curveData.points[curveData.points.length - 1] : null;
                  const neutralCurveColor = "#787896"; // Neutral gray-purple color
                  
                  return (
                    <>
                      {/* Curve SVG */}
                      <div className="absolute right-full top-0 bottom-0 w-48 pointer-events-none mr-2 overflow-visible">
                        <svg 
                          viewBox="0 0 200 192" 
                          preserveAspectRatio="none"
                          className="w-full h-full"
                          style={{ overflow: 'visible' }}
                        >
                          <defs>
                            {/* Gradient for the stroke - fades from left to right */}
                            <linearGradient id="ribbonLineGradientTutorial" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={neutralCurveColor} stopOpacity="0.2" />
                              <stop offset="100%" stopColor={neutralCurveColor} stopOpacity="0.9" />
                            </linearGradient>
                            {/* Gradient for area fill - vertical gradient */}
                            <linearGradient id="ribbonAreaGradientTutorial" x1="0" y1="0" x2="0" y2="1">
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
                              fill="url(#ribbonAreaGradientTutorial)"
                            />
                          )}
                          
                          {/* Main curve line */}
                          {curveData.pathD && (
                            <path
                              d={curveData.pathD}
                              fill="none"
                              stroke="url(#ribbonLineGradientTutorial)"
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

                {/* Slider Track with gradient background */}
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
                  
                  {/* Fader Cap */}
                  <div 
                    className="absolute left-1/2 w-17 h-8 bg-[#5B9FED] rounded-lg shadow-xl border-2 border-gray-300 flex items-center justify-center"
                    style={{ 
                      top: `${faderPosition}%`,
                      transform: `translate(-50%, -50%) ${isTouching ? 'scale(1.1)' : 'scale(1)'}`,
                      transition: isTouching ? 'none' : 'transform 0.15s ease-out'
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
          </div>

          {/* Status Indicator */}
          <div className="text-center mb-3">
            {isTouching ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Video Playing
              </div>
            ) : (
              null
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] px-4 py-4 border-t border-gray-300">
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
                setIsTouching(false);
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