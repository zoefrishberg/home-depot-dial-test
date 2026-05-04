import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock, Volume2, Play, MoveHorizontal } from "lucide-react";
import { saveDialData, recordPageCompletion } from "../../utils/api";

interface DataPoint {
  timestamp: number;
  value: number; // -100 to 100, where negative is "losing me" and positive is "into it"
}

interface DialTestSliderRatchetedProps {
  sessionId: string | null;
  testMode?: boolean;
  onComplete?: () => void;
  progress: number;
}

export function DialTestSliderRatcheted({ sessionId, testMode = false, onComplete, progress }: DialTestSliderRatchetedProps) {
  const [intensity, setIntensity] = useState(0); // -100 to 100, snapped to 10-point increments
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [recordedDataPoints, setRecordedDataPoints] = useState<Array<{ timestamp: number; button: string | null; intensity: number }>>([]);
  const [sliderSide, setSliderSide] = useState<'left' | 'right'>('right'); // Default to right
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const intensityRef = useRef(0);

  const VIDEO_SRC = "https://vod-prod-02-source-u4t2w48mf8oc.s3.amazonaws.com/66e9ada2497b6eaa620de6d6-96c9c123bc405c87dfe5f25019c1a876.mp4";

  // Keep intensityRef in sync with intensity state
  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

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

  // Video event handlers
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
    };
  }, []);

  // Control video playback based on touch
  useEffect(() => {
    if (videoRef.current) {
      if (isTouching && !hasEnded) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          if (!hasStartedPlaying) {
            setHasStartedPlaying(true);
          }
        }).catch(err => console.error("Play error:", err));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isTouching, hasEnded, hasStartedPlaying]);

  // Record data points while video is playing
  useEffect(() => {
    if (isPlaying && isTouching) {
      recordingInterval.current = setInterval(() => {
        if (videoRef.current) {
          const timestamp = videoRef.current.currentTime;
          const currentIntensity = intensityRef.current;
          
          setDataPoints(prev => [...prev, {
            timestamp: timestamp,
            value: currentIntensity
          }]);
          
          // Record for database (every 100ms)
          setRecordedDataPoints(prev => [...prev, {
            timestamp: timestamp,
            button: currentIntensity > 0 ? "positive" : currentIntensity < 0 ? "negative" : null,
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
  }, [isPlaying, isTouching]);

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
    const now = videoRef.current?.currentTime || 0;
    const recentPoints = dataPoints.filter(point => now - point.timestamp <= timeWindow);
    
    if (recentPoints.length === 0) return { pathD: "", areaD: "", points: [] };

    // Map points: most recent point is at right edge (x=200), older points move left
    const points = recentPoints.map(point => {
      const timeDiff = now - point.timestamp; // 0 = newest, timeWindow = oldest
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

  const handleContinue = async () => {
    console.log(`[Slider Ratcheted Variant] Submitting dial test data...`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Data points collected: ${recordedDataPoints.length}`);
    console.log(`Test mode: ${testMode}`);
    
    if (testMode) {
      console.log(`🧪 [Slider Ratcheted Variant] Test mode - skipping database save`);
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
        console.log(`✅ [Slider Ratcheted Variant] Successfully saved ${recordedDataPoints.length} dial test data points`);
      } catch (error) {
        console.error("❌ [Slider Ratcheted Variant] Failed to save dial test data:", error);
      }
    } else {
      if (!sessionId) {
        console.warn("⚠️ [Slider Ratcheted Variant] No session ID available - data not saved");
      }
      if (recordedDataPoints.length === 0) {
        console.warn("⚠️ [Slider Ratcheted Variant] No data points recorded - user may not have interacted with slider");
      }
    }
    
    if (onComplete) {
      onComplete();
    }
  };

  const faderPosition = 50 - (intensity / 2); // Map -100..100 to 100%..0%

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
      <header className="bg-[#313131] px-3 py-2 flex items-center justify-between flex-shrink-0 relative z-30">
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

      {/* Full-Screen Video Container */}
      <main className="flex-1 relative overflow-hidden">
        {/* Video - Full Screen Background */}
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Emotion Curve Overlay on Video - Always rendered to prevent layout shift */}
        <div className={`absolute inset-0 pointer-events-none z-10 ${!hasStartedPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
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
              
              {/* Emotion curve - left to right on video timeline */}
              {dataPoints.length > 0 && (() => {
                const width = 640;
                const height = 120;
                const midY = height / 2;
                
                let pathData = "";
                dataPoints.forEach((point, index) => {
                  const x = (point.timestamp / videoDuration) * width;
                  const y = midY - (point.value / 100) * (midY - 10);
                  
                  if (index === 0) {
                    pathData += `M ${x} ${y}`;
                  } else if (index === 1) {
                    pathData += ` L ${x} ${y}`;
                  } else {
                    const prevPoint = dataPoints[index - 1];
                    const prevX = (prevPoint.timestamp / videoDuration) * width;
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
              {videoDuration > 0 && (
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

        {/* Minimalist "Touch the slider to start" instruction */}
        {!hasStartedPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <p className="text-white text-lg">Touch the slider to start</p>
          </div>
        )}

        {/* Vertical Slider Overlay - Dynamic Side with Toggle Button */}
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
                className="absolute left-1/2 w-17 h-8 bg-[#5B9FED] rounded-lg shadow-xl border-2 border-gray-300 flex items-center justify-center will-change-transform transition-all duration-75"
                style={{ 
                  top: `${faderPosition}%`,
                  transform: `translate(-50%, -50%)`,
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
      <footer className="bg-[#E8E8E8] px-4 py-4 border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Your answer is private</span>
          </div>
          {!hasEnded && hasStartedPlaying && (
            <p className="text-center text-sm text-gray-600 mb-3">
              Please watch the entire video to continue
            </p>
          )}
          <Button
            onClick={handleContinue}
            disabled={!hasEnded}
            className="w-full bg-[#5B9FED] hover:bg-[#4A8EDC] text-white border-0 h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </footer>
    </div>
  );
}