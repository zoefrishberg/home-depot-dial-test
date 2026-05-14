import { Gift } from "lucide-react";
import { motion } from "motion/react";
import { NelSurveysLogo } from "./nel-surveys-logo";

interface SurveyHeaderProps {
  progress: number;
  showGift?: boolean;
  animateProgress?: boolean;
}

export function SurveyHeader({
  progress,
  showGift = true,
  animateProgress = false,
}: SurveyHeaderProps) {
  return (
    <header className="bg-[#313131] px-3 py-2 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
      <div className="flex items-center">
        <NelSurveysLogo size="sm" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
          {animateProgress ? (
            <motion.div
              className="h-full bg-[#5B9FED]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          ) : (
            <div
              className="h-full bg-[#5B9FED] transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          )}
        </div>
        {showGift && <Gift className="w-4 h-4 text-white self-center" />}
      </div>
    </header>
  );
}
