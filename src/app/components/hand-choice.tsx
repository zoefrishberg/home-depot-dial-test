import { Check } from "lucide-react";

export type HandChoice = "left" | "right";

interface ChoiceButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function ChoiceButton({ label, selected, onClick }: ChoiceButtonProps) {
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
