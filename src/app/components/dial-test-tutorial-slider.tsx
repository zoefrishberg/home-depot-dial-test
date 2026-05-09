import React, { useState, useRef, useEffect, useCallback, type PointerEvent as ReactPointerEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Gift, CheckCircle2, ChevronUp, ChevronDown } from "lucide-react";
import { saveDialData } from "../../utils/api";
import { NelSurveysLogo } from "./nel-surveys-logo";
import { useSliderKeyboard } from "../../utils/useSliderKeyboard";

interface DataPoint {
  timestamp: number;
  value: number;
}

interface RecordedDataPoint {
  timestamp: number;
  button: string | null;
  intensity: number;
}

interface TutorialProps {
  sessionId: string | null;
  onComplete: () => void;
  onBack: () => void;
  progress: number;
}

const GATE_THRESHOLD = 33;
// Used only as the x-axis scale for the bottom histogram while practicing;
// it does not gate progression in any way.
const TUTORIAL_X_AXIS_DURATION = 20;

export function DialTestTutorialSlider({ sessionId, onComplete, onBack, progress }: TutorialProps) {
  const [intensity, setIntensity] = useState(0); // -100 to 100
  const [isTouching, setIsTouching] = useState(false);
  const [hasTouched, setHasTouched] = useState(false);
  const [hasReachedUpper, setHasReachedUpper] = useState(false);
  const [hasReachedLower, setHasReachedLower] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [recordedDataPoints, setRecordedDataPoints] = useState<RecordedDataPoint[]>([]);
  const [sliderSide, setSliderSide] = useState<'left' | 'right'>('right');

  const sliderRef = useRef<HTMLDivElement>(null);
  const intensityRef = useRef(0);
  const tutorialClockRef = useRef(0);
  const recordingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const gatesComplete = hasReachedUpper && hasReachedLower;

  useEffect(() => {
    intensityRef.current = intensity;
    if (intensity >= GATE_THRESHOLD) setHasReachedUpper(true);
    if (intensity <= -GATE_THRESHOLD) setHasReachedLower(true);
  }, [intensity]);

  useEffect(() => {
    const savedSide = localStorage.getItem('sliderSide');
    if (savedSide === 'left' || savedSide === 'right') {
      setSliderSide(savedSide);
    }
  }, []);

  // Keyboard support: hold Space to engage (also marks the tutorial as
  // touched so the headline copy advances) and ↑/↓ to move the fader.
  const handleKeyboardTouch = useCallback((held: boolean) => {
    setIsTouching(held);
    if (held) setHasTouched(true);
  }, []);
  useSliderKeyboard({
    setIsTouching: handleKeyboardTouch,
    setIntensity,
  });

  useEffect(() => {
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, []);

  // Tutorial clock + data recording — advances only while the user is holding
  // the slider. Continues past gatesComplete so users who keep playing with
  // the slider after success see the histogram keep responding.
  useEffect(() => {
    if (isTouching) {
      recordingInterval.current = setInterval(() => {
        const nextClock = tutorialClockRef.current + 0.1;
        tutorialClockRef.current = nextClock;

        const currentIntensity = intensityRef.current;
        setDataPoints(prev => [...prev, { timestamp: nextClock, value: currentIntensity }]);
        setRecordedDataPoints(prev => [...prev, {
          timestamp: nextClock,
          button: currentIntensity > 0 ? "positive" : currentIntensity < 0 ? "negative" : null,
          intensity: currentIntensity,
        }]);
      }, 100);
    } else if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }

    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [isTouching]);

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const relativeY = Math.max(0, Math.min(1, y / rect.height));
    const newIntensity = (0.5 - relativeY) * 200;
    setIntensity(newIntensity);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsTouching(true);
    if (!hasTouched) setHasTouched(true);

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

    const width = 200;
    const height = 192;
    const timeWindow = 5;

    const now = tutorialClockRef.current;
    const recentPoints = dataPoints.filter(point => now - point.timestamp <= timeWindow);

    if (recentPoints.length === 0) return { pathD: "", areaD: "", points: [] };

    const points = recentPoints.map(point => {
      const timeDiff = now - point.timestamp;
      const x = width - (timeDiff / timeWindow) * width;
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

    const areaData = pathData + ` L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;
    return { pathD: pathData, areaD: areaData, points };
  };

  // Headline is the primary communicator. It does NOT depend on isTouching —
  // pause is signaled by the chevron freeze and the tooltip, never by mutating
  // the headline into a scolding "Paused." state. Chevrons own the directional
  // mechanic, so copy stays short and conversational and never says
  // "all the way" (the gate is backstage detection, not a foreground goal).
  const getHeadlineCopy = () => {
    if (gatesComplete) {
      return {
        title: "You're ready.",
        body: "",
      };
    }
    if (hasReachedUpper !== hasReachedLower) {
      return {
        title: "Now try the other direction.",
        body: "",
      };
    }
    return {
      title: "Let's warm up first.",
      body: "Slide up when you feel positive, down when negative.",
    };
  };

  // Tooltip lives only as a paused-state signal: it appears when the user
  // has engaged once and then released without completing. Pre-touch and
  // active-practice states surface no tooltip — the headline + chevrons
  // carry everything. The actual `showPauseTooltip` boolean is computed
  // below using `effectivelyPaused` (post-grace) instead of raw `!isTouching`,
  // so a slipped finger doesn't immediately flip the tooltip on.

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

  // Map -100..100 to constrained range 7.8125%-92.1875% to align handle with slider edges
  const faderPosition = 7.8125 + ((50 - (intensity / 2)) * 0.84375);

  // Pause grace — a brief release shouldn't punish the user with a full
  // pause UI flip. Only after `isTouching` has been false for ~300ms do we
  // treat the practice as actually paused (chevrons dim/freeze, tooltip
  // appears). Re-engaging within the grace window cancels the pending
  // pause and keeps the active state intact.
  const PAUSE_GRACE_MS = 300;
  const [effectivelyPaused, setEffectivelyPaused] = useState(false);
  const pauseGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasTouched || isTouching) {
      if (pauseGraceTimerRef.current) {
        clearTimeout(pauseGraceTimerRef.current);
        pauseGraceTimerRef.current = null;
      }
      setEffectivelyPaused(false);
      return;
    }
    if (pauseGraceTimerRef.current) clearTimeout(pauseGraceTimerRef.current);
    pauseGraceTimerRef.current = setTimeout(() => {
      setEffectivelyPaused(true);
      pauseGraceTimerRef.current = null;
    }, PAUSE_GRACE_MS);
    return () => {
      if (pauseGraceTimerRef.current) {
        clearTimeout(pauseGraceTimerRef.current);
        pauseGraceTimerRef.current = null;
      }
    };
  }, [isTouching, hasTouched]);

  // Headline dwell — once the displayed headline updates, hold it for at
  // least HEADLINE_DWELL_MS before the next change can land. Prevents copy
  // snapping faster than the user can read on fast crossings (e.g. keyboard
  // user swinging from +100 to -100 in <500ms).
  const HEADLINE_DWELL_MS = 400;
  const targetHeadline = getHeadlineCopy();
  const [displayedHeadline, setDisplayedHeadline] = useState(targetHeadline);
  const lastHeadlineChangeRef = useRef(0);
  const headlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (
      targetHeadline.title === displayedHeadline.title &&
      targetHeadline.body === displayedHeadline.body
    ) {
      return;
    }
    const elapsed = Date.now() - lastHeadlineChangeRef.current;
    const dwellRemaining = Math.max(0, HEADLINE_DWELL_MS - elapsed);
    if (headlineTimerRef.current) clearTimeout(headlineTimerRef.current);
    headlineTimerRef.current = setTimeout(() => {
      setDisplayedHeadline(targetHeadline);
      lastHeadlineChangeRef.current = Date.now();
      headlineTimerRef.current = null;
    }, dwellRemaining);
    return () => {
      if (headlineTimerRef.current) {
        clearTimeout(headlineTimerRef.current);
        headlineTimerRef.current = null;
      }
    };
  }, [targetHeadline.title, targetHeadline.body, displayedHeadline.title, displayedHeadline.body]);

  const showPauseTooltip = effectivelyPaused && !gatesComplete;

  return (
    <div className="min-h-dvh bg-[#E8E8E8] flex justify-center">
      <div className="w-full max-w-2xl min-h-dvh flex flex-col min-[672px]:border-x min-[672px]:border-gray-300 relative">
        <header className="bg-[#313131] px-3 py-2 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
          <NelSurveysLogo size="sm" />
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5B9FED] transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <Gift className="w-4 h-4 text-white" />
          </div>
        </header>

        <main
          className={`flex-1 relative overflow-hidden transition-colors duration-300 ease-in-out ${
            gatesComplete ? 'bg-[#2CC353]/5' : 'bg-[#E8E8E8]'
          }`}
        >
          {/* Headline copy — vertically centered in the upper portion of the white area */}
          <div
            className="absolute inset-0 flex items-center justify-center px-8 pb-[168px] pointer-events-none select-none"
            style={{
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
              userSelect: 'none',
            }}
          >
            <div className="text-center max-w-sm">
              {gatesComplete && (
                <CheckCircle2
                  className="mx-auto mb-3 w-12 h-12 text-[#2CC353]"
                  strokeWidth={2}
                />
              )}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={displayedHeadline.title}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <h1 className="text-[#3D3D3D] text-pretty">{displayedHeadline.title}</h1>
                  {displayedHeadline.body && (
                    <p
                      className="mt-3 text-[#3D3D3D]/80 font-medium text-pretty"
                      style={{ fontSize: "18px", lineHeight: "26px" }}
                    >
                      {displayedHeadline.body}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom histogram card — always visible. Empty (just the dashed
              midline) until the user touches; the curve draws in real-time as
              they practice, providing continuous cause→effect feedback. */}
          <div
            className="absolute left-0 right-0 bottom-0 z-10 select-none pointer-events-none"
          >
            <div
              className={`bg-[rgba(0,0,0,0.4)] h-42 landscape:h-26 py-1 relative ${
                sliderSide === 'right'
                  ? 'pl-4 pr-20 landscape:pr-24'
                  : 'pl-20 pr-4 landscape:pl-24'
              }`}
            >
              <div
                className={`absolute top-1/2 h-[1px] bg-[#E0E0E0] opacity-20 ${
                  sliderSide === 'right'
                    ? 'left-4 right-20 landscape:right-24'
                    : 'left-20 right-4 landscape:left-24'
                }`}
              />

              <svg
                viewBox="0 0 297 50"
                preserveAspectRatio="none"
                className="w-full h-full"
                style={{ shapeRendering: 'geometricPrecision' }}
              >
                <defs>
                  <linearGradient id="tutorialHistogramGradient" x1="0" y1="5" x2="0" y2="45" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#2CC353" />
                    <stop offset="50%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#EB5547" />
                  </linearGradient>
                </defs>

                {dataPoints.length > 0 && (() => {
                  const width = 297;
                  const height = 50;
                  const midY = height / 2;

                  // Stretch the recorded curve to fill the full card width so the
                  // reveal visually reads as "tutorial complete", regardless of
                  // how long the user took to cross both gates.
                  const lastTimestamp = dataPoints[dataPoints.length - 1].timestamp;
                  const xScale = lastTimestamp > 0 ? lastTimestamp : TUTORIAL_X_AXIS_DURATION;

                  let pathData = "";
                  dataPoints.forEach((point, index) => {
                    const x = (point.timestamp / xScale) * width;
                    const y = midY - (point.value / 100) * (midY - 5);

                    if (index === 0) {
                      pathData += `M ${x} ${y}`;
                    } else if (index === 1) {
                      pathData += ` L ${x} ${y}`;
                    } else {
                      const prevPoint = dataPoints[index - 1];
                      const prevX = (prevPoint.timestamp / xScale) * width;
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
                      stroke="url(#tutorialHistogramGradient)"
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

          {/* Vertical slider overlay — handedness-respecting position. Stays
              visible and active throughout, including after gates complete,
              so users can keep playing with it while the histogram below
              continues to record their movement. */}
          <div
            className={`absolute ${sliderSide === 'right' ? 'right-4' : 'left-4'} bottom-4 z-20 flex flex-col items-center gap-4`}
          >
            <div
              className="relative h-64 max-h-[calc(100dvh-180px)] landscape:max-h-[calc(100dvh-140px)] flex items-center select-none"
              style={{
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                userSelect: 'none',
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Trailing ECG-style ghost histogram — only when slider is on the right */}
              {sliderSide === 'right' && (() => {
                const curveData = generateCurvePath();
                const trackH = 256;
                const lastPoint = curveData.points.length > 0 ? curveData.points[curveData.points.length - 1] : null;
                const neutralCurveColor = "#787896";

                return (
                  <>
                    <div className="absolute right-full mr-2 top-0 bottom-0 w-48 pointer-events-none overflow-visible">
                      <svg
                        viewBox="0 0 200 192"
                        preserveAspectRatio="none"
                        className="w-full h-full"
                        style={{ overflow: 'visible' }}
                      >
                        <defs>
                          <linearGradient id="tutorialRibbonLineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={neutralCurveColor} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={neutralCurveColor} stopOpacity="0.9" />
                          </linearGradient>
                          <linearGradient id="tutorialRibbonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={neutralCurveColor} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={neutralCurveColor} stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        <line
                          x1="0"
                          y1="96"
                          x2="200"
                          y2="96"
                          stroke="rgba(0, 0, 0, 0.15)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />

                        {curveData.areaD && (
                          <path
                            d={curveData.areaD}
                            fill="url(#tutorialRibbonAreaGradient)"
                          />
                        )}

                        {curveData.pathD && (
                          <path
                            d={curveData.pathD}
                            fill="none"
                            stroke="url(#tutorialRibbonLineGradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}

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

              {/* Slider track */}
              <div
                ref={sliderRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-8 h-full rounded-full cursor-pointer touch-none z-10 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.16)] border border-white"
                style={{
                  background: 'linear-gradient(180deg, #2CC353 0%, #FFFFFF 50%, #EB5547 100%)',
                }}
              >
                {/* Chevron pulse — non-verbal "you can move this up/down" cue.
                    Each stack settles permanently when its gate is crossed,
                    freezes-and-dims if the user releases mid-practice. */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-1/2 flex flex-col items-center justify-center gap-1 pointer-events-none ${
                    hasReachedUpper
                      ? 'tutorial-chevron-stack--settled'
                      : effectivelyPaused
                        ? 'tutorial-chevron-stack--paused'
                        : 'tutorial-chevron-stack--active'
                  }`}
                >
                  <ChevronUp size={18} strokeWidth={2.5} className="text-white tutorial-chevron tutorial-chevron--3" />
                  <ChevronUp size={18} strokeWidth={2.5} className="text-white tutorial-chevron tutorial-chevron--2" />
                  <ChevronUp size={18} strokeWidth={2.5} className="text-white tutorial-chevron tutorial-chevron--1" />
                </div>
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-1/2 flex flex-col items-center justify-center gap-1 pointer-events-none ${
                    hasReachedLower
                      ? 'tutorial-chevron-stack--settled'
                      : effectivelyPaused
                        ? 'tutorial-chevron-stack--paused'
                        : 'tutorial-chevron-stack--active'
                  }`}
                >
                  <ChevronDown size={18} strokeWidth={2.5} className="text-white tutorial-chevron tutorial-chevron--1" />
                  <ChevronDown size={18} strokeWidth={2.5} className="text-white tutorial-chevron tutorial-chevron--2" />
                  <ChevronDown size={18} strokeWidth={2.5} className="text-white tutorial-chevron tutorial-chevron--3" />
                </div>

                {/* Pause tooltip — only surfaces when the user has engaged
                    once and then released without completing. Pre-touch and
                    active practice states use the headline + chevrons. */}
                <div
                  className={`absolute ${
                    sliderSide === 'right' ? 'right-full mr-6' : 'left-full ml-6'
                  } pointer-events-none`}
                  style={{
                    top: `${faderPosition}%`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  <AnimatePresence>
                    {showPauseTooltip && (
                      <motion.div
                        key="pause-tooltip"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                      >
                        <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200 whitespace-nowrap relative">
                          <p className="text-sm text-black font-medium">
                            Hold the slider to continue.
                          </p>
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-gray-200 ${
                              sliderSide === 'right'
                                ? 'right-[-4px] border-r border-b rotate-[-45deg]'
                                : 'left-[-4px] border-l border-t rotate-[-45deg]'
                            }`}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Fader handle */}
                <div
                  className="absolute left-1/2 w-14 h-9 bg-white rounded-lg shadow-[0px_2px_4px_0px_rgba(0,0,0,0.16)] border border-[rgba(0,0,0,0.16)] flex items-center justify-center will-change-transform transition-transform duration-200 ease-out"
                  style={{
                    top: `${faderPosition}%`,
                    transform: `translate(-50%, -50%) scale(${isTouching ? 1.1 : 1})`,
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
                    <div className="w-4 h-0.5 bg-gray-300 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-[#E8E8E8] px-4 pt-4 pb-6 border-t border-gray-300 flex-shrink-0 relative z-30">
          <div className="max-w-2xl mx-auto">
            {!gatesComplete && (
              <div className="flex items-center justify-center mb-3 text-gray-500 text-sm">
                <span>Complete the tutorial to continue.</span>
              </div>
            )}
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
                disabled={!gatesComplete}
                className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12 disabled:bg-[var(--dark-40)] disabled:opacity-100 disabled:cursor-not-allowed"
              >
                Continue
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
