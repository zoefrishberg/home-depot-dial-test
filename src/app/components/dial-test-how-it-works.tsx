import { Button } from "./ui/button";
import { Gift, Play, Pointer } from "lucide-react";

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
          <SliderIllustration />
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

function SliderIllustration() {
  return (
    <div
      className="relative w-full aspect-[16/10] rounded-2xl border-2 border-[#3D3D3D] bg-[#E8E8E8]"
      style={{ maxWidth: "340px" }}
    >
      <div className="absolute inset-0 flex items-center justify-center pr-12">
        <Play className="w-12 h-12 text-[#3D3D3D]" fill="currentColor" />
      </div>

      <div className="absolute bottom-4 left-5 right-16 h-0.5 bg-[#3D3D3D]/40 rounded-full">
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-[#3D3D3D] rounded-full" />
      </div>

      <div
        className="absolute right-3 top-3 bottom-3 w-7 rounded-full"
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
        className="absolute right-0 top-1/2 w-10 h-10 text-[#3D3D3D]"
        style={{ transform: "translate(40%, -10%) rotate(8deg)" }}
        strokeWidth={2}
      />
    </div>
  );
}
