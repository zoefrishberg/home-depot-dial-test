import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Gift } from "lucide-react";
import { NelSurveysLogo } from "./nel-surveys-logo";
import { DialTestIllustration } from "./dial-test-illustration";

interface DialTestHowItWorksProps {
  onComplete: () => void;
  onBack: () => void;
  progress: number;
}

export function DialTestHowItWorks({
  onComplete,
  onBack,
  progress,
}: DialTestHowItWorksProps) {
  const resolvedSide = (typeof window !== "undefined" && localStorage.getItem("sliderSide") === "left") ? "left" : "right";

  // Detect a likely physical keyboard. There is no direct browser API for this,
  // so we infer from a fine pointer + hover capability (desktop-class input),
  // and upgrade to true on the first real keydown event.
  const [hasKeyboard, setHasKeyboard] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(any-pointer: fine) and (any-hover: hover)");
    setHasKeyboard(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setHasKeyboard(prev => prev || e.matches);
    const onKey = () => setHasKeyboard(true);
    mq.addEventListener?.("change", onChange);
    window.addEventListener("keydown", onKey, { once: true });
    return () => {
      mq.removeEventListener?.("change", onChange);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-[#E8E8E8] flex justify-center">
      <div className="w-full max-w-2xl min-h-dvh flex flex-col min-[672px]:border-x min-[672px]:border-gray-300">
      <header className="bg-[#3D3D3D] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <NelSurveysLogo />
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--azure-70)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <Gift className="w-5 h-5 text-white" />
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 py-8 gap-10">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
          <h1>
            Share how the video makes you feel as you watch it again.
          </h1>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-black/10 text-sm font-medium text-black/80 shrink-0">
              1
            </span>
            <p
              className="flex-1 text-[#3D3D3D] font-medium pt-0.5"
              style={{ fontSize: "20px", lineHeight: "28px" }}
            >
              Keep your finger on the slider to play the video.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-black/10 text-sm font-medium text-black/80 shrink-0">
              2
            </span>
            <p
              className="flex-1 text-[#3D3D3D] font-medium pt-0.5"
              style={{ fontSize: "20px", lineHeight: "28px" }}
            >
              Slide up when you feel{" "}
              <mark
                className="rounded px-1 text-[#3D3D3D]"
                style={{ backgroundColor: "rgba(41, 163, 71, 0.4)" }}
              >
                positive
              </mark>
              , down when you feel{" "}
              <mark
                className="rounded px-1 text-[#3D3D3D]"
                style={{ backgroundColor: "rgba(184, 57, 46, 0.4)" }}
              >
                negative
              </mark>
              .
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex items-center justify-center min-w-8 h-8 px-2 rounded-full bg-black/10 text-sm font-medium text-black/80 shrink-0">
              3
            </span>
            <p
              className="flex-1 text-[#3D3D3D] font-medium pt-0.5"
              style={{ fontSize: "20px", lineHeight: "28px" }}
            >
              Stay in the middle if you feel neutral.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full flex justify-center">
          <DialTestIllustration side={resolvedSide} />
        </div>

        {hasKeyboard && (
          <p className="max-w-2xl mx-auto w-full text-center text-sm text-[#3D3D3D]/70">
            Prefer keyboard? Hold{" "}
            <kbd className="inline-flex items-center justify-center rounded border border-black/15 bg-white px-1.5 py-0.5 font-mono text-xs text-[#3D3D3D] shadow-sm">
              Space
            </kbd>{" "}
            to play the content, and press{" "}
            <kbd className="inline-flex items-center justify-center rounded border border-black/15 bg-white px-1.5 py-0.5 font-mono text-xs text-[#3D3D3D] shadow-sm">
              ↑
            </kbd>{" "}
            and{" "}
            <kbd className="inline-flex items-center justify-center rounded border border-black/15 bg-white px-1.5 py-0.5 font-mono text-xs text-[#3D3D3D] shadow-sm">
              ↓
            </kbd>{" "}
            to move the slider.
          </p>
        )}
      </main>

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
              onClick={onComplete}
              className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12"
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
