// NEL Surveys logo + wordmark, mirrored from
// sway/packages/ui/components/quiz/QuizLogo.vue so the prototype matches the
// real survey app.
interface NelSurveysLogoProps {
  size?: "sm" | "md";
}

export function NelSurveysLogo({ size = "md" }: NelSurveysLogoProps) {
  const iconClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  const textClass = size === "sm" ? "text-sm leading-none" : "";

  return (
    <div className="flex items-center gap-2 text-white">
      <svg
        className={`${iconClass} stroke-current`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="23" height="23" x="0.5" y="0.5" rx="3.5" />
        <path
          strokeLinecap="round"
          strokeWidth="3"
          d="M19.5 4.5l-15 15M9.5 4.5l-5 5M19.5 14.5l-5 5"
        />
      </svg>
      <span className={textClass}>
        <span className="font-semibold">NEL</span>
        <span>Surveys</span>
      </span>
    </div>
  );
}
