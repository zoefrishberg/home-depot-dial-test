import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Check, Gift, Play, Pointer } from "lucide-react";

type HandChoice = "left" | "right";

interface DialTestHandSelectionProps {
  onComplete: (choice: HandChoice) => void;
  onBack: () => void;
  progress: number;
}

export function DialTestHandSelection({
  onComplete,
  onBack,
  progress,
}: DialTestHandSelectionProps) {
  const [choice, setChoice] = useState<HandChoice | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sliderSide");
    if (saved === "left" || saved === "right") {
      setChoice(saved);
    }
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
    <div className="min-h-screen bg-[#E8E8E8] flex justify-center">
      <div className="w-full max-w-2xl min-h-screen flex flex-col border-x border-gray-300">
      <header className="bg-[#3D3D3D] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
            <div
              className="w-3 h-3 bg-white"
              style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
            ></div>
          </div>
          <span className="text-white font-medium">NELSurveys</span>
        </div>
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
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-3">
          <h1>
            Which hand will you use?
          </h1>
          <p
            className="text-[#3D3D3D]/70"
            style={{ fontSize: "18px", lineHeight: "26px" }}
          >
            We&apos;ll place the slider next to the video on the best side for you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto w-full flex justify-center">
          <HandIllustration side={choice} />
        </div>

        <div className="max-w-2xl mx-auto w-full grid grid-cols-2 gap-3">
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
                  : "bg-[#9C9C9C] text-white cursor-not-allowed opacity-70"
              }`}
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

interface ChoiceButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function ChoiceButton({ label, selected, onClick }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center justify-center gap-2 h-12 rounded-md border-2 bg-white transition-colors ${
        selected
          ? "border-[var(--azure-70)] text-[var(--azure-70)]"
          : "border-[#C8C8C8] text-[#3D3D3D] hover:border-[#9C9C9C]"
      }`}
    >
      {selected && <Check className="w-4 h-4" strokeWidth={2.5} />}
      <span className="font-medium" style={{ fontSize: "16px" }}>
        {label}
      </span>
    </button>
  );
}

interface HandIllustrationProps {
  side: HandChoice | null;
}

function HandIllustration({ side }: HandIllustrationProps) {
  // Default visual matches the "no selection" state in the mock (slider + hand on right).
  const sliderOnRight = side !== "left";

  return (
    <div
      className="relative w-full aspect-[16/10] rounded-2xl border-2 border-[#3D3D3D] bg-[#E8E8E8]"
      style={{ maxWidth: "340px" }}
    >
      <div
        className={`absolute inset-0 flex items-center justify-center ${
          sliderOnRight ? "pr-12" : "pl-12"
        }`}
      >
        <Play className="w-12 h-12 text-[#3D3D3D]" fill="currentColor" />
      </div>

      <div
        className={`absolute bottom-4 h-0.5 bg-[#3D3D3D]/40 rounded-full ${
          sliderOnRight ? "left-5 right-16" : "left-16 right-5"
        }`}
      >
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-[#3D3D3D] rounded-full" />
      </div>

      <div
        className={`absolute top-3 bottom-3 w-7 rounded-full ${
          sliderOnRight ? "right-3" : "left-3"
        }`}
        style={{
          background:
            "linear-gradient(to bottom, #29A347 0%, #E8E8E8 50%, #B8392E 100%)",
        }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-6 bg-white border-2 border-[#3D3D3D] rounded-md flex items-center justify-center gap-0.5">
          <span className="block w-px h-3 bg-[#3D3D3D]" />
          <span className="block w-px h-3 bg-[#3D3D3D]" />
          <span className="block w-px h-3 bg-[#3D3D3D]" />
        </div>
      </div>

      <Pointer
        className="absolute top-1/2 w-10 h-10 text-[#3D3D3D]"
        style={{
          ...(sliderOnRight
            ? { right: 0, transform: "translate(40%, -10%) rotate(8deg)" }
            : { left: 0, transform: "translate(-40%, -10%) scaleX(-1) rotate(8deg)" }),
        }}
        strokeWidth={2}
      />
    </div>
  );
}
