import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Check } from "lucide-react";
import { Button } from "./ui/button";
import { NelSurveysLogo } from "./nel-surveys-logo";

interface FeedbackTypeformProps {
  sessionId: string | null;
  onSubmit: (answers: {
    easeOfUse: string;
    attentionDifficulty: string;
    expressiveness: string;
    improvements: string;
    repeatIntent: string;
    gender: string;
    primaryShopper: string;
    amazonFrequency: string;
    streamingFrequency: string;
  }) => void;
  onBack: () => void;
  progressStart: number;
  progressEnd: number;
}

interface Question {
  id: string;
  question: string;
  type: "single" | "text";
  options?: string[];
  placeholder?: string;
  required: boolean;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F", "G"];

export function FeedbackTypeform({
  sessionId,
  onSubmit,
  onBack,
  progressStart,
  progressEnd,
}: FeedbackTypeformProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isTransitioning, setIsTransitioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const QUESTIONS: Question[] = [
    {
      id: "easeOfUse",
      question: "How easy was it to use the slider?",
      type: "single",
      options: [
        "Very easy",
        "Somewhat easy",
        "Neither easy nor difficult",
        "Somewhat difficult",
        "Very difficult",
      ],
      required: true,
    },
    {
      id: "attentionDifficulty",
      question: "Was it difficult to pay attention to the video while using the slider?",
      type: "single",
      options: ["Not at all", "A little", "Somewhat", "A lot"],
      required: true,
    },
    {
      id: "expressiveness",
      question: "Did this method let you show how you felt?",
      type: "single",
      options: ["Yes, definitely", "Yes, somewhat", "Not really", "Not at all"],
      required: true,
    },
    {
      id: "improvements",
      question: "What could be improved about this experience?",
      type: "text",
      placeholder: "Share your thoughts...",
      required: false,
    },
    {
      id: "repeatIntent",
      question: "Would you take another survey like this?",
      type: "single",
      options: ["Yes", "Maybe", "No"],
      required: true,
    },
    {
      id: "gender",
      question: "What is your gender?",
      type: "single",
      options: ["Female", "Male", "Other"],
      required: true,
    },
    {
      id: "primaryShopper",
      question:
        "Are you the primary shopper for your household? (For things like groceries, clothing, and personal items)",
      type: "single",
      options: ["Yes", "I share this responsibility equally", "No"],
      required: true,
    },
    {
      id: "amazonFrequency",
      question: "How often do you purchase something from Amazon?",
      type: "single",
      options: [
        "Several times per week",
        "About once per week",
        "A few times per month",
        "About once per month",
        "A few times per year",
        "Less often",
        "Never",
      ],
      required: true,
    },
    {
      id: "streamingFrequency",
      question:
        "How often do you watch TV shows or movies using streaming services (such as Netflix, Hulu, Disney+, Amazon Prime Video, or similar)?",
      type: "single",
      options: [
        "Every day",
        "Several times per week",
        "About once per week",
        "A few times per month",
        "Less often",
        "Never",
      ],
      required: true,
    },
  ];

  const currentQuestion = QUESTIONS[currentIndex];
  // Map question index across the [progressStart, progressEnd] range so the
  // navbar bar continues smoothly from the previous step up to 100%.
  const progress =
    progressStart +
    (currentIndex / QUESTIONS.length) * (progressEnd - progressStart);

  // Focus textarea when text question appears
  useEffect(() => {
    if (currentQuestion.type === "text" && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 400);
    }
  }, [currentIndex, currentQuestion.type]);

  // Keyboard shortcut for options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (currentQuestion.type === "single" && currentQuestion.options) {
        const keyIndex = e.key.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, etc.
        if (keyIndex >= 0 && keyIndex < currentQuestion.options.length) {
          handleOptionSelect(currentQuestion.options[keyIndex]);
        }
      }
      if (e.key === "Enter" && currentQuestion.type === "text") {
        if (!e.shiftKey) {
          e.preventDefault();
          goNext();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isTransitioning]);

  const handleOptionSelect = useCallback(
    (option: string) => {
      if (isTransitioning) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));

      // Auto-advance after a brief pause
      setIsTransitioning(true);
      setTimeout(() => {
        if (currentIndex < QUESTIONS.length - 1) {
          setDirection(1);
          setCurrentIndex((prev) => prev + 1);
        }
        setIsTransitioning(false);
      }, 450);
    },
    [currentIndex, currentQuestion.id, isTransitioning]
  );

  const goNext = useCallback(() => {
    if (isTransitioning) return;
    if (currentIndex < QUESTIONS.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, isTransitioning]);

  const goPrev = useCallback(() => {
    if (isTransitioning) return;
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    } else {
      onBack();
    }
  }, [currentIndex, isTransitioning, onBack]);

  const handleSubmit = () => {
    onSubmit({
      easeOfUse: answers.easeOfUse || "",
      attentionDifficulty: answers.attentionDifficulty || "",
      expressiveness: answers.expressiveness || "",
      improvements: answers.improvements || "",
      repeatIntent: answers.repeatIntent || "",
      gender: answers.gender || "",
      primaryShopper: answers.primaryShopper || "",
      amazonFrequency: answers.amazonFrequency || "",
      streamingFrequency: answers.streamingFrequency || "",
    });
  };

  const isLastQuestion = currentIndex === QUESTIONS.length - 1;
  const currentAnswer = answers[currentQuestion.id];

  // Check if all required questions are answered for final submit
  const canSubmit = QUESTIONS.filter((q) => q.required).every(
    (q) => answers[q.id] && answers[q.id].trim() !== ""
  );

  const slideVariants = {
    enter: (dir: number) => ({
      y: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-dvh bg-[#E8E8E8] flex justify-center">
      <div className="w-full max-w-2xl min-h-dvh flex flex-col min-[672px]:border-x min-[672px]:border-gray-300">
      {/* Header */}
      <header className="bg-[#3D3D3D] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <NelSurveysLogo />
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#5B9FED]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <Gift className="w-5 h-5 text-white" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center px-4 py-6 overflow-hidden">
        <div className="max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Question text */}
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-6 leading-snug">
                {currentQuestion.question}
              </h2>

              {/* Options or text input */}
              {currentQuestion.type === "single" &&
                currentQuestion.options && (
                  <div className="flex flex-col gap-2">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = currentAnswer === option;
                      return (
                        <motion.button
                          key={option}
                          onClick={() => handleOptionSelect(option)}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06, duration: 0.3 }}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm flex items-center gap-3 ${
                            isSelected
                              ? "border-[#5B9FED] bg-[#5B9FED]/10 text-[#3D3D3D]"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                              isSelected
                                ? "bg-[#5B9FED] text-white"
                                : "bg-gray-100 text-gray-500 border border-gray-200"
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              OPTION_KEYS[idx]
                            )}
                          </span>
                          <span className={isSelected ? "font-medium" : ""}>
                            {option}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

              {currentQuestion.type === "text" && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <textarea
                    ref={textareaRef}
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: e.target.value,
                      }))
                    }
                    placeholder={currentQuestion.placeholder}
                    rows={4}
                    className="w-full px-4 py-3.5 rounded-lg border-2 border-gray-200 bg-white text-gray-700 text-sm resize-none focus:outline-none focus:border-[#5B9FED] transition-colors placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    {currentQuestion.required ? "" : "Optional — "}Press Enter or
                    tap the button to continue
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] px-4 pt-4 pb-6 border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={goPrev}
              className="flex-1 bg-[#C8C8C8] hover:bg-[#B8B8B8] text-[#3D3D3D] border-0 h-12"
            >
              Back
            </Button>
            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12 disabled:bg-[var(--dark-40)] disabled:opacity-100 disabled:cursor-not-allowed"
              >
                Submit
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={
                  currentQuestion.required && !currentAnswer?.trim()
                }
                className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12 disabled:bg-[var(--dark-40)] disabled:opacity-100 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}