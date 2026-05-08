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
          
          .motion-frame .anim-fader {
            animation: fader-move var(--cycle) infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
          .motion-frame .anim-circle {
            animation: circle-move var(--cycle) infinite cubic-bezier(0.4, 0, 0.2, 1);
          }
          .motion-frame .anim-playhead {
            animation: playhead-sweep var(--cycle) infinite linear;
          }
        `}</style>
        <linearGradient id="slider-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#29A347" />
          <stop offset="50%" stopColor="#E8E8E8" />
          <stop offset="100%" stopColor="#B8392E" />
        </linearGradient>
      </defs>

      <g className="dial-test-anim">
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

        {/* Progress Line */}
        <rect x={progressX} y="196" width="256" height="2" rx="1" fill="#A3A3A3" />

        {/* Motion Frame */}
        <g className="motion-frame">
          <circle cx={progressX} cy="197" r="6" fill="#A3A3A3" className="anim-playhead" />
          
          <g transform={sliderGroupTransform}>
            {/* Rail */}
            <rect x="300" y="12" width="28" height="189" rx="14" fill="url(#slider-gradient)" />
            
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
            <rect x="300" y="12" width="28" height="189" rx="14" fill="url(#slider-gradient)" />
            
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
      </g>
    </svg>
  );
}
