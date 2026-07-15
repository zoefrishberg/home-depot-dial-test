import { Button } from "./ui/button";
import { SurveyHeader } from "./survey-header";

interface PreExposureInterstitialProps {
  onContinue: () => void;
  onBack: () => void;
  progress: number;
}

export function PreExposureInterstitial({
  onContinue,
  onBack,
  progress,
}: PreExposureInterstitialProps) {
  return (
    <div className="min-h-dvh bg-[#E8E8E8] flex justify-center">
      <div className="w-full max-w-2xl min-h-dvh flex flex-col min-[672px]:border-x min-[672px]:border-gray-300">
        <SurveyHeader progress={progress} />

        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-lg leading-7 text-[#3D3D3D] font-medium">
              You are about to see a rough cut of a TV commercial. If selected,
              it will be professionally produced as TV-ready content, without any
              draft language (e.g., &ldquo;FPO&rdquo;) superimposed. Please
              watch it in full. Once you&rsquo;ve finished watching, you&rsquo;ll
              continue on to instructions for the next part of the survey.
            </p>
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
                onClick={onContinue}
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
