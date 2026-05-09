import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Check, Gift } from "lucide-react";
import { NelSurveysLogo } from "./nel-surveys-logo";
import { DialTestIllustration } from "./dial-test-illustration";

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
          <DialTestIllustration side={choice ?? "right"} />
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
              Start Practice
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
