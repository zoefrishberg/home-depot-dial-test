import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { DialTestIllustration } from "./dial-test-illustration";
import { ChoiceButton, type HandChoice } from "./hand-choice";
import { SurveyHeader } from "./survey-header";

interface DialTestHowItWorksProps {
  onComplete: (choice: HandChoice) => void;
  onBack: () => void;
  progress: number;
}

export function DialTestHowItWorks({
  onComplete,
  onBack,
  progress,
}: DialTestHowItWorksProps) {
  const [choice, setChoice] = useState<HandChoice | null>(null);
  const resolvedSide = choice ?? "right";

  useEffect(() => {
    const saved = localStorage.getItem("sliderSide");
    if (saved === "left" || saved === "right") {
      setChoice(saved);
    }
  }, []);

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

  const handleSelect = (next: HandChoice) => {
    setChoice(next);
    localStorage.setItem("sliderSide", next);
  };

  const handleContinue = () => {
    if (!choice) return;
    onComplete(choice);
  };

  return (
    <div className="min-h-dvh bg-[#E8E8E8] flex justify-center">
      <div className="w-full max-w-2xl min-h-dvh flex flex-col min-[672px]:border-x min-[672px]:border-gray-300">
      <SurveyHeader progress={progress} />

      <main className="flex-1 flex flex-col px-4 py-8 gap-10">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
          <h1>
            Share how the video makes you feel as you watch it again.
          </h1>

          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-black/10 text-xs font-medium text-black/80 shrink-0">
                1
              </span>
              <p
                className="flex-1 text-[#3D3D3D] text-md leading-6 font-medium pt-0.5"
              >
                Keep your finger on the slider to play the video.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-black/10 text-xs font-medium text-black/80 shrink-0">
                2
              </span>
              <p
                className="flex-1 text-[#3D3D3D] text-md leading-6 font-medium pt-0.5"
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
              <span className="flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-black/10 text-xs font-medium text-black/80 shrink-0">
                3
              </span>
              <p
                className="flex-1 text-[#3D3D3D] text-md leading-6 font-medium pt-0.5"
              >
                Stay in the middle if you feel neutral.
              </p>
            </div>
          </div>
        </div>

        {hasKeyboard && (
          <p className="max-w-2xl mx-auto w-full text-left text-sm text-[#3D3D3D]/70">
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

        <div className="max-w-2xl mx-auto w-full flex justify-center">
          <DialTestIllustration side={resolvedSide} />
        </div>

        <div className="max-w-2xl mx-auto w-full flex flex-col gap-3">
          <h2 className="text-center text-lg leading-7 font-medium text-[#3D3D3D]">
            Which hand will you use?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ChoiceButton
              label="Left hand"
              selected={choice === "left"}
              onClick={() => handleSelect("left")}
            />
            <ChoiceButton
              label="Right hand"
              selected={choice === "right"}
              onClick={() => handleSelect("right")}
            />
          </div>
        </div>
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
              onClick={handleContinue}
              disabled={!choice}
              className={`flex-1 h-12 border-0 transition-colors ${
                choice
                  ? "bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white cursor-pointer"
                  : "bg-[var(--dark-40)] text-white cursor-not-allowed disabled:opacity-100"
              }`}
            >
              Start Practice
            </Button>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
