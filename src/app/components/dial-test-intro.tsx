import { Button } from "./ui/button";
import { Gift, Lock } from "lucide-react";

interface IntroProps {
  onContinue: () => void;
}

export function DialTestIntro({ onContinue }: IntroProps) {
  return (
    <div className="min-h-screen bg-[#E8E8E8] flex flex-col">
      {/* Header */}
      <header className="bg-[#3D3D3D] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
            <div className="w-3 h-3 bg-white" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}></div>
          </div>
          <span className="text-white font-medium">NELSurveys</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5B9FED] transition-all duration-300" 
              style={{ width: '0%' }}
            ></div>
          </div>
          <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <Gift className="w-5 h-5 text-white" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-[#3D3D3D] mb-6">
            Your Opinion Matters!
          </h1>

          <div className="space-y-4 text-[#3D3D3D]">
            <div className="flex items-start gap-3">
              <span className="text-xl">🎬</span>
              <p className="flex-1 pt-0.5">
                Please watch the short video and share your reactions as it plays.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">⏱</span>
              <p className="flex-1 pt-0.5">
                We'll start with a brief tutorial on how to provide your reactions.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">👀</span>
              <p className="flex-1 pt-0.5">
                Some questions before and after the video may not be directly related to it.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">🔒</span>
              <p className="flex-1 pt-0.5">
                All your answers are anonymous, confidential and used only for statistical purposes.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl">🎁</span>
              <p className="flex-1 pt-0.5">
                You'll be done in a few minutes.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] px-4 py-6 border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>All answers are anonymous and confidential and used only for statistical purposes</span>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onContinue}
              className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12"
            >
              Continue
            </Button>
          </div>
          <div className="text-xs text-gray-500 text-center mt-4 space-y-2">
            <p>
              This site is protected by reCAPTCHA and the Google{" "}
              <a href="#" className="underline hover:text-gray-700">Privacy Policy</a> and{" "}
              <a href="#" className="underline hover:text-gray-700">Terms of Service</a> apply.
            </p>
            <p>
              For your responses to the survey, the Worldview Inc. Privacy Policy and Terms of Service linked below apply.
            </p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <a href="#" className="underline hover:text-gray-700">Privacy</a>
              <a href="#" className="underline hover:text-gray-700">About Us</a>
              <span className="text-gray-400">© 2026 NEL Research</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
