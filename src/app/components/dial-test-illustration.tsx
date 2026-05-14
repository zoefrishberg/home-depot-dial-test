import React from "react";

const CYCLE_MS = 12000;

export type DialTestIllustrationProps = {
  side: "left" | "right";
  className?: string;
};

export function DialTestIllustration({ side, className }: DialTestIllustrationProps) {
  const isLeft = side === "left";
  
  // X coordinates for elements that change based on side
  const playIconX = isLeft ? 170 : 122; // 194 - 24 : 146 - 24
  const progressX = isLeft ? 64 : 20;
  
  // Mirror the slider group for left-handed variant
  const sliderGroupTransform = isLeft ? "translate(340, 0) scale(-1, 1)" : undefined;

  return (
    <svg
      role="img"
      aria-label="Animation showing a finger tapping a slider, dragging it up and down while a video timeline plays."
      viewBox="0 0 340 213"
      className={`block w-full aspect-[16/10] rounded-[28px] border-[3px] border-[#A3A3A3] bg-[#F5F5F5] ${className || ""}`}
      style={{ maxWidth: "340px" }}
    >
      <defs>
        <style>{`
          .dial-test-anim {
            --cycle: ${CYCLE_MS}ms;
          }
          
          @media (prefers-reduced-motion: reduce) {
            .motion-frame { display: none; }
            .reduced-motion-frame { display: block; }
          }
          @media (prefers-reduced-motion: no-preference) {
            .motion-frame { display: block; }
            .reduced-motion-frame { display: none; }
          }
          
          @keyframes fader-move {
            0%, 12% { transform: translateY(0); }
            30%, 36% { transform: translateY(-46px); }
            58%, 64% { transform: translateY(46px); }
            80%, 100% { transform: translateY(0); }
          }
          
          @keyframes circle-move {
            0%, 6% { transform: translate(30px, 100px); opacity: 0; }
            10% { transform: translate(0, 0); opacity: 0.55; }
            12% { transform: translate(0, 0); opacity: 1; }
            30%, 36% { transform: translate(0, -46px); opacity: 1; }
            58%, 64% { transform: translate(0, 46px); opacity: 1; }
            80% { transform: translate(0, 0); opacity: 1; }
            82% { transform: translate(0, 0); opacity: 0.55; }
            92%, 100% { transform: translate(30px, 100px); opacity: 0; }
          }
          
          @keyframes playhead-sweep {
            0% { transform: translateX(0); opacity: 0; }
            12% { transform: translateX(0); opacity: 1; }
            80% { transform: translateX(256px); opacity: 1; }
            99.9% { transform: translateX(256px); opacity: 0; }
            100% { transform: translateX(0); opacity: 0; }
          }
          
          @keyframes ecg-sweep {
            0%, 12% { transform: translateX(0); }
            80%, 100% { transform: translateX(-200px); }
          }
          
          @keyframes ecg-opacity {
            0%, 80% { opacity: 1; }
            85%, 100% { opacity: 0; }
          }
          
          .motion-frame .anim-fader {
            animation: fader-move var(--cycle) infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
          .motion-frame .anim-circle {
            animation: circle-move var(--cycle) infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
          .motion-frame .anim-playhead {
            animation: playhead-sweep var(--cycle) infinite linear;
          }
          .anim-ecg {
            animation: ecg-sweep var(--cycle) infinite linear;
          }
          .motion-frame .anim-ecg-opacity {
            animation: ecg-opacity var(--cycle) infinite linear;
          }
        `}</style>
        <clipPath id="wave-clip">
          <rect x="0" y="0" width="291" height="213" />
        </clipPath>
        <linearGradient id="ecg-fade-mask-grad" x1="200" y1="0" x2="291" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="black" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
        <mask id="fade-mask">
          <rect x="0" y="0" width="340" height="213" fill="url(#ecg-fade-mask-grad)" />
        </mask>
      </defs>

      <g className="dial-test-anim">
        {/* Progress Line */}
        <rect x={progressX} y="196" width="256" height="2" rx="1" fill="#A3A3A3" />

        {/* Motion Frame */}
        <g className="motion-frame">
          <circle cx={progressX} cy="197" r="6" fill="#A3A3A3" className="anim-playhead" />
          
          <g transform={sliderGroupTransform}>
            {/* ECG Wave - Only show when slider is on the right */}
            <g style={{ visibility: isLeft ? "hidden" : "visible" }}>
              <g clipPath="url(#wave-clip)" className="anim-ecg-opacity">
                <g mask="url(#fade-mask)">
                  <g className="anim-ecg">
                    <path
                      d="M 291 106.5 C 312.2 106.5, 301.6 60.5, 343.9 60.5 L 361.6 60.5 C 387.5 60.5, 374.5 152.5, 426.3 152.5 L 443.9 152.5 C 462.7 152.5, 453.3 106.5, 491 106.5"
                      fill="none"
                      stroke="#A3A3A3"
                      strokeOpacity="0.6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </g>
              </g>
            </g>

            {/* Rail */}
            <rect x="300" y="12" width="28" height="189" rx="14" fill="#E8E8E8" stroke="#A3A3A3" strokeWidth="2" />
            
            {/* Fader */}
            <g className="anim-fader">
              <rect x="291" y="95.5" width="46" height="22" rx="5" fill="white" stroke="#A3A3A3" strokeWidth="1.5" />
              <rect x="308" y="102.5" width="12" height="1" fill="#A3A3A3" />
              <rect x="308" y="106" width="12" height="1" fill="#A3A3A3" />
              <rect x="308" y="109.5" width="12" height="1" fill="#A3A3A3" />
            </g>

            {/* Circle */}
            <g className="anim-circle">
              <circle cx="314" cy="106.5" r="12" fill="#A3A3A3" />
            </g>
          </g>
        </g>

        {/* Reduced Motion Frame */}
        <g className="reduced-motion-frame">
          <circle cx={progressX + 128} cy="197" r="6" fill="#A3A3A3" />
          
          <g transform={sliderGroupTransform}>
            {/* Rail */}
            <rect x="300" y="12" width="28" height="189" rx="14" fill="#E8E8E8" stroke="#A3A3A3" strokeWidth="2" />
            
            {/* Fader (slightly above neutral, e.g. -20px) */}
            <g transform="translate(0, -20)">
              <rect x="291" y="95.5" width="46" height="22" rx="5" fill="white" stroke="#A3A3A3" strokeWidth="1.5" />
              <rect x="308" y="102.5" width="12" height="1" fill="#A3A3A3" />
              <rect x="308" y="106" width="12" height="1" fill="#A3A3A3" />
              <rect x="308" y="109.5" width="12" height="1" fill="#A3A3A3" />
            </g>

            {/* Circle (at fader, opacity 1) */}
            <g transform="translate(0, -20)">
              <circle cx="314" cy="106.5" r="12" fill="#A3A3A3" />
            </g>
          </g>
        </g>

        {/* Play Icon */}
        <svg
          x={playIconX}
          y="82.5"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="#3D3D3D"
          stroke="#3D3D3D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 3l14 9-14 9V3z" />
        </svg>
      </g>
    </svg>
  );
}
