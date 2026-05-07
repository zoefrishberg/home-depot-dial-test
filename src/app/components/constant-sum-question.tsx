import { useState, useEffect } from "react";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { AlertCircle, CheckCircle2, Gift, Lock } from "lucide-react";

interface Option {
  id: string;
  label: string;
  value: number;
}

export function ConstantSumQuestion() {
  const [options, setOptions] = useState<Option[]>([
    { id: "1", label: "Product Quality", value: 0 },
    { id: "2", label: "Customer Service", value: 0 },
    { id: "3", label: "Price", value: 0 },
    { id: "4", label: "Brand Reputation", value: 0 },
  ]);

  const total = options.reduce((sum, option) => sum + option.value, 0);
  const remaining = 100 - total;
  const isValid = total === 100;
  const isOverAllocated = total > 100;

  const handleSliderChange = (id: string, newValue: number[]) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, value: newValue[0] } : opt))
    );
  };

  const handleInputChange = (id: string, inputValue: string) => {
    const numValue = parseInt(inputValue) || 0;
    const clampedValue = Math.max(0, Math.min(100, numValue));
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, value: clampedValue } : opt))
    );
  };

  const handleSubmit = () => {
    if (isValid) {
      alert("Response submitted successfully!");
      console.log("Submitted values:", options);
    }
  };

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
            <div className="h-full bg-[#5B9FED]" style={{ width: "60%" }}></div>
          </div>
          <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <Gift className="w-5 h-5 text-white" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl text-[#3D3D3D] mb-8">
            Please allocate 100% across the following options based on their importance to you.
          </h1>

          {/* Total Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#3D3D3D]">Total Allocated</span>
              <span
                className={`font-semibold ${
                  isValid
                    ? "text-green-600"
                    : isOverAllocated
                    ? "text-red-600"
                    : "text-[#3D3D3D]"
                }`}
              >
                {total}%
              </span>
            </div>
            <Progress
              value={Math.min(total, 100)}
              className="h-2 bg-gray-300"
              indicatorClassName={
                isValid
                  ? "bg-green-600"
                  : isOverAllocated
                  ? "bg-red-600"
                  : "bg-[#5B9FED]"
              }
            />
            <div className="flex items-center gap-2 mt-2">
              {isValid ? (
                <span className="text-xs text-green-600">
                  Perfect! You can now continue.
                </span>
              ) : (
                <span
                  className={`text-xs ${
                    isOverAllocated ? "text-red-600" : "text-[#3D3D3D]"
                  }`}
                >
                  {isOverAllocated
                    ? `Over by ${Math.abs(remaining)}%`
                    : `${remaining}% remaining`}
                </span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-6">
            {options.map((option, index) => (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-base text-[#3D3D3D]" htmlFor={`option-${option.id}`}>
                    {option.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`option-${option.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={option.value}
                      onChange={(e) => handleInputChange(option.id, e.target.value)}
                      className="w-14 h-8 text-center text-sm border-gray-300 bg-white"
                    />
                    <span className="text-sm text-[#3D3D3D]">%</span>
                  </div>
                </div>
                <Slider
                  value={[option.value]}
                  onValueChange={(value) => handleSliderChange(option.id, value)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Your answer is private</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-[#C8C8C8] hover:bg-[#B8B8B8] text-[#3D3D3D] border-0 h-12"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12 disabled:bg-gray-400 disabled:text-gray-600"
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}