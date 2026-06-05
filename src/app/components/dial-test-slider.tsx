import React, { useState, useRef, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "./ui/button";
import { Volume2, Play } from "lucide-react";
import { saveDialData, recordPageCompletion } from "../../utils/api";
import { getDialTestVideoMetadata, type ResolvedDialTestVideo } from "../constants";
import { SurveyHeader } from "./survey-header";
import { useSliderKeyboard } from "../../utils/useSliderKeyboard";
import { useVideoSource } from "../../utils/useVideoSource";

interface DataPoint {
  timestamp: number;
  value: number; // -100 to 100, where negative is "losing me" and positive is "into it"
}

interface DialTestSliderProps {
  sessionId: string | null;
  testMode?: boolean;
  onComplete?: () => void;
  onBack: () => void;
  progress: number;
  video: ResolvedDialTestVideo;
}

export function DialTestSlider({ sessionId, testMode = false, onComplete, onBack, progress, video }: DialTestSliderProps) {
  const [intensity, setIntensity] = useState(0); // -100 to 100
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
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const intensityRef = useRef(0);

  useVideoSource(videoRef, video, video.format === "mp4" ? "#t=0.1" : undefined);

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

  // Keyboard support: hold Space to engage, ↑/↓ to move the fader.
  // Disabled once the video has ended so trailing key presses can't restart capture.
  useSliderKeyboard({
    enabled: !hasEnded,
    setIsTouching,
    setIntensity,
  });

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

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;

    // Only update if we have pointer capture (actively dragging)
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const relativeY = Math.max(0, Math.min(1, y / rect.height));

    // Map: top (0) = +100, middle (0.5) = 0, bottom (1) = -100
    // Remove rounding for smoother motion
    const newIntensity = (0.5 - relativeY) * 200;
    setIntensity(newIntensity);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsTouching(true);

    // Update position immediately
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const relativeY = Math.max(0, Math.min(1, y / rect.height));
      const newIntensity = (0.5 - relativeY) * 200;
      setIntensity(newIntensity);
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
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
    console.log(`[Slider Variant] Submitting dial test data...`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Data points collected: ${recordedDataPoints.length}`);
    console.log(`Test mode: ${testMode}`);
    
    if (testMode) {
      console.log(`🧪 [Slider Variant] Test mode - skipping database save`);
      console.log(`Would have saved ${recordedDataPoints.length} data points`);
      if (onComplete) {
        onComplete();
      }
      return;
    }
    
    if (sessionId && recordedDataPoints.length > 0) {
      try {
        await saveDialData(sessionId, 'actual', recordedDataPoints);
        await recordPageCompletion(sessionId, 'dialTest', {
          video: getDialTestVideoMetadata(video),
        });
        console.log(`✅ [Slider Variant] Successfully saved ${recordedDataPoints.length} dial test data points`);
      } catch (error) {
        console.error("❌ [Slider Variant] Failed to save dial test data:", error);
      }
    } else {
      if (!sessionId) {
        console.warn("⚠️ [Slider Variant] No session ID available - data not saved");
      }
      if (recordedDataPoints.length === 0) {
        console.warn("⚠️ [Slider Variant] No data points recorded - user may not have interacted with slider");
      }
    }
    
    if (onComplete) {
      onComplete();
    }
  };

  // Map -100..100 to constrained range 7.8125%-92.1875% to align handle with slider edges
  const faderPosition = 7.8125 + ((50 - (intensity / 2)) * 0.84375);
  const shouldHideFooter = !hasStartedPlaying || (isTouching && !hasEnded);
  const shouldHideHeader = isTouching && !hasEnded;

  return (
    <div className="h-dvh max-h-dvh bg-[#E8E8E8] flex justify-center overflow-hidden">
      <div className="w-full max-w-2xl h-full min-h-0 flex flex-col min-[672px]:border-x min-[672px]:border-gray-300 relative">
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          shouldHideHeader ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
        }`}
      >
        <SurveyHeader progress={progress} />
      </div>

      {/* Full-Screen Video Container */}
      <main className="flex-1 min-h-0 relative overflow-hidden">
        {/* Video - Full Screen Background */}
        <video
          ref={videoRef}
          // Media-fragment hash makes the browser display the frame at 0.1s
          // as the initial poster so the area isn't blank before play.
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
          onEnded={handleEnded}
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Emotion Curve Overlay on Video - Hidden, using new histogram card instead */}
        <div className={`hidden absolute inset-0 pointer-events-none z-10 ${!hasStartedPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
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


        {/* New Histogram Card - Full width at bottom */}
        <div className="absolute left-0 right-0 bottom-0 z-10 transition-all duration-300 ease-in-out select-none pointer-events-none">
          <div
            className={`bg-[rgba(0,0,0,0.4)] h-42 landscape:h-26 py-1 relative ${
              sliderSide === 'right'
                ? 'pl-4 pr-20 landscape:pr-24'
                : 'pl-20 pr-4 landscape:pl-24'
            }`}
          >
            {/* Horizontal center line */}
            <div
              className={`absolute top-1/2 h-[1px] bg-[#E0E0E0] opacity-20 ${
                sliderSide === 'right'
                  ? 'left-4 right-20 landscape:right-24'
                  : 'left-20 right-4 landscape:left-24'
              }`}
            />

            {/* ECG Curve */}
            <svg
              viewBox="0 0 297 50"
              preserveAspectRatio="none"
              className="w-full h-full"
              style={{ shapeRendering: 'geometricPrecision' }}
            >
              <defs>
                {/* Gradient for histogram curve - absolute positioning based on value range */}
                <linearGradient id="histogramGradient" x1="0" y1="5" x2="0" y2="45" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2CC353" />
                  <stop offset="50%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#EB5547" />
                </linearGradient>
              </defs>

              {/* Emotion curve - timeline based */}
              {dataPoints.length > 0 && (() => {
                const width = 297;
                const height = 50;
                const midY = height / 2;

                let pathData = "";
                dataPoints.forEach((point, index) => {
                  const x = (point.timestamp / videoDuration) * width;
                  const y = midY - (point.value / 100) * (midY - 5);

                  if (index === 0) {
                    pathData += `M ${x} ${y}`;
                  } else if (index === 1) {
                    pathData += ` L ${x} ${y}`;
                  } else {
                    const prevPoint = dataPoints[index - 1];
                    const prevX = (prevPoint.timestamp / videoDuration) * width;
                    const prevY = midY - (prevPoint.value / 100) * (midY - 5);
                    const controlX = (prevX + x) / 2;
                    const controlY = prevY;
                    pathData += ` Q ${controlX} ${controlY}, ${x} ${y}`;
                  }
                });

                return (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="url(#histogramGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Vertical Slider Overlay - Dynamic Side with Toggle Button */}
        <div
          className="fixed bottom-[105px] z-20 flex flex-col items-center gap-4"
          style={{
            [sliderSide === 'right' ? 'right' : 'left']: 'max(1rem, calc((100vw - 42rem) / 2 + 1rem))',
          }}
        >
          <div
            className="relative h-64 max-h-[calc(100dvh-180px)] landscape:max-h-[calc(100dvh-140px)] flex items-center select-none"
            style={{
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              userSelect: 'none'
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Trailing ECG-style curve - only shown when slider is on the right */}
            {sliderSide === 'right' && (() => {
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

            {/* Slider Track with gradient background */}
            <div
              ref={sliderRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-8 h-full rounded-full cursor-pointer touch-none z-10 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.16)] border border-white"
              style={{
                background: 'linear-gradient(180deg, #2CC353 0%, #FFFFFF 50%, #EB5547 100%)'
              }}
            >

              {/* Tooltip - appears when not touching and video hasn't ended */}
              {!isTouching && !hasEnded && (
                <div
                  className={`absolute top-0 ${
                    sliderSide === 'right' ? 'right-full mr-6' : 'left-full ml-6'
                  } pointer-events-none animate-pulse`}
                  style={{
                    top: `${faderPosition}%`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 whitespace-nowrap relative">
                    <p className="text-sm text-black font-medium">
                      {!hasStartedPlaying ? 'Hold the slider to begin.' : 'Hold the slider to continue.'}
                    </p>
                    {/* Triangle pointer */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-gray-200 ${
                        sliderSide === 'right'
                          ? 'right-[-4px] border-r border-b rotate-[-45deg]'
                          : 'left-[-4px] border-l border-t rotate-[-45deg]'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Fader Handle - White Rectangle */}
              <div
                className="absolute left-1/2 w-14 h-9 bg-white rounded-lg shadow-[0px_2px_4px_0px_rgba(0,0,0,0.16)] border border-[rgba(0,0,0,0.16)] flex items-center justify-center will-change-transform transition-transform duration-200 ease-out"
                style={{
                  top: `${faderPosition}%`,
                  transform: `translate(-50%, -50%) scale(${isTouching ? 1.1 : 1})`,
                }}
              >
                {/* Two horizontal grip lines */}
                <div className="flex flex-col gap-1">
                  <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
                  <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer - collapses out of layout while the user is dragging the slider */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
          shouldHideFooter ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'
        }`}
      >
        <footer className="bg-[#E8E8E8] px-4 pt-4 pb-6 border-t border-gray-300">
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1 bg-[#C8C8C8] hover:bg-[#B8B8B8] text-[#3D3D3D] border-0 h-12"
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
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
    </div>
  );
}