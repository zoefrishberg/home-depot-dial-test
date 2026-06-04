import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { SurveyHeader } from "./survey-header";

export type AnswerValue = string | number;
export type SurveyAnswers = Record<string, AnswerValue>;

type SurveyKind = "segmentation" | "feedback";

interface FeedbackTypeformProps {
  survey: SurveyKind;
  initialAnswers?: SurveyAnswers;
  onSubmit: (answers: SurveyAnswers) => void;
  onBack: () => void;
  progressStart: number;
  progressEnd: number;
  submitLabel?: string;
}

interface SingleQuestion {
  id: string;
  question: string;
  type: "single";
  options: string[];
  required: boolean;
}

interface TextQuestion {
  id: string;
  question: string;
  type: "text";
  placeholder?: string;
  required: boolean;
}

interface SliderQuestion {
  id: string;
  question: string;
  type: "slider";
  leftLabel: string;
  centerLabel: string;
  rightLabel: string;
  required: boolean;
}

type Question = SingleQuestion | TextQuestion | SliderQuestion;

interface Step {
  questions: Question[];
}

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F", "G"];
const SLIDER_DEFAULT = 50;

const SEGMENTATION_STEPS: Step[] = [
  {
    questions: [
      {
        id: "gender",
        question: "What is your gender?",
        type: "single",
        options: ["Female", "Male", "Other"],
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "primaryShopper",
        question:
          "Are you the primary shopper for your household? (For things like groceries, clothing, and personal items)",
        type: "single",
        options: ["Yes", "I share this responsibility equally", "No"],
        required: true,
      },
    ],
  },
  {
    questions: [
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
    ],
  },
  {
    questions: [
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
    ],
  },
];

const FINAL_SURVEY_STEPS: Step[] = [
  {
    questions: [
      {
        id: "AmazonFavorableOpinion-v1",
        question:
          "Please indicate whether you have a favorable or unfavorable opinion of Amazon.",
        type: "slider",
        leftLabel: "Very Unfavorable",
        centerLabel: "No Opinion",
        rightLabel: "Very Favorable",
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "doYouHaveAFavorableOrUnfavorableOpinionOfAndyJassy",
        question:
          "Do you have a favorable or unfavorable opinion of Andy Jassy, President & CEO Amazon?",
        type: "slider",
        leftLabel: "Very Unfavorable",
        centerLabel: "No Opinion",
        rightLabel: "Very Favorable",
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "amazonAlexaFavorableOpinion",
        question:
          "Please indicate whether you have a favorable or unfavorable opinion of Amazon Alexa.",
        type: "slider",
        leftLabel: "Very Unfavorable",
        centerLabel: "No Opinion",
        rightLabel: "Very Favorable",
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "toWhatExtentDoYouAgreeOrDisagreeThatAmazonIsALeaderInAI",
        question:
          "To what extent do you agree or disagree that Amazon is a leader in artificial intelligence?",
        type: "slider",
        leftLabel: "Strongly Disagree",
        centerLabel: "Neutral",
        rightLabel: "Strongly Agree",
        required: true,
      },
      {
        id: "toWhatExtentDoYouAgreeOrDisagreeThatAmazonIsInnovatingInAITools",
        question:
          "To what extent do you agree or disagree that Amazon is innovating in artificial intelligence tools?",
        type: "slider",
        leftLabel: "Strongly Disagree",
        centerLabel: "Neutral",
        rightLabel: "Strongly Agree",
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "AmazonPurchaseWithinMonth-v1",
        question:
          "Please indicate whether you are likely to purchase from Amazon in the next month.",
        type: "slider",
        leftLabel: "Not at All Likely",
        centerLabel: "Somewhat",
        rightLabel: "Very Likely",
        required: true,
      },
    ],
  },
  {
    questions: [
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
    ],
  },
  {
    questions: [
      {
        id: "attentionDifficulty",
        question:
          "Was it difficult to pay attention to the video while using the slider?",
        type: "single",
        options: ["Not at all", "A little", "Somewhat", "A lot"],
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "expressiveness",
        question: "Did this method let you show how you felt?",
        type: "single",
        options: ["Yes, definitely", "Yes, somewhat", "Not really", "Not at all"],
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "improvements",
        question: "What could be improved about this experience?",
        type: "text",
        placeholder: "Share your thoughts...",
        required: false,
      },
    ],
  },
  {
    questions: [
      {
        id: "repeatIntent",
        question: "Would you take another survey like this?",
        type: "single",
        options: ["Yes", "Maybe", "No"],
        required: true,
      },
    ],
  },
];

const getSurveySteps = (survey: SurveyKind): Step[] =>
  survey === "segmentation" ? SEGMENTATION_STEPS : FINAL_SURVEY_STEPS;

const seedAnswers = (
  steps: Step[],
  initialAnswers: SurveyAnswers = {}
): SurveyAnswers => {
  const seeded: SurveyAnswers = {};
  steps.forEach((step) => {
    step.questions.forEach((question) => {
      if (question.type === "slider") {
        seeded[question.id] = SLIDER_DEFAULT;
      }
    });
  });
  return { ...seeded, ...initialAnswers };
};

const seedTouched = (
  steps: Step[],
  initialAnswers: SurveyAnswers = {}
): Record<string, boolean> => {
  const seeded: Record<string, boolean> = {};
  steps.forEach((step) => {
    step.questions.forEach((question) => {
      const answer = initialAnswers[question.id];
      if (question.type === "slider") {
        seeded[question.id] = typeof answer === "number";
      } else {
        seeded[question.id] =
          typeof answer === "string" && answer.trim().length > 0;
      }
    });
  });
  return seeded;
};

const isAnswered = (
  question: Question,
  value: AnswerValue | undefined,
  touched: boolean
): boolean => {
  if (!question.required) return true;
  if (question.type === "slider") return touched;
  if (typeof value !== "string") return false;
  return value.trim().length > 0;
};

const getStepAnswers = (steps: Step[], answers: SurveyAnswers): SurveyAnswers => {
  const result: SurveyAnswers = {};
  steps.forEach((step) => {
    step.questions.forEach((question) => {
      const answer = answers[question.id];
      if (question.type === "slider") {
        result[question.id] =
          typeof answer === "number" ? answer : SLIDER_DEFAULT;
      } else {
        result[question.id] = typeof answer === "string" ? answer : "";
      }
    });
  });
  return result;
};

export function FeedbackTypeform({
  survey,
  initialAnswers,
  onSubmit,
  onBack,
  progressStart,
  progressEnd,
  submitLabel = "Submit",
}: FeedbackTypeformProps) {
  const steps = getSurveySteps(survey);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>(() =>
    seedAnswers(steps, initialAnswers)
  );
  const [touched, setTouched] = useState<Record<string, boolean>>(() =>
    seedTouched(steps, initialAnswers)
  );
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentStep = steps[currentIndex];
  const isLastStep = currentIndex === steps.length - 1;
  const progress =
    progressStart + (currentIndex / steps.length) * (progressEnd - progressStart);
  const autoAdvanceEnabled =
    currentStep.questions.length === 1 &&
    currentStep.questions[0].type === "single";
  const canAdvance = currentStep.questions.every((question) =>
    isAnswered(question, answers[question.id], !!touched[question.id])
  );

  useEffect(() => {
    const firstTextQuestion = currentStep.questions.find(
      (question) => question.type === "text"
    );
    if (firstTextQuestion && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 400);
    }
  }, [currentIndex, currentStep.questions]);

  const goNext = useCallback(() => {
    if (isTransitioning || !canAdvance) return;
    if (currentIndex < steps.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [canAdvance, currentIndex, isTransitioning, steps.length]);

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
    if (!canAdvance) return;
    onSubmit(getStepAnswers(steps, answers));
  };

  const handleOptionSelect = useCallback(
    (question: SingleQuestion, option: string) => {
      if (isTransitioning) return;
      setAnswers((prev) => ({ ...prev, [question.id]: option }));
      setTouched((prev) => ({ ...prev, [question.id]: true }));

      if (!autoAdvanceEnabled) return;
      setIsTransitioning(true);
      setTimeout(() => {
        if (currentIndex < steps.length - 1) {
          setDirection(1);
          setCurrentIndex((prev) => prev + 1);
        }
        setIsTransitioning(false);
      }, 450);
    },
    [autoAdvanceEnabled, currentIndex, isTransitioning, steps.length]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;

      const isSingleQuestionStep =
        currentStep.questions.length === 1 &&
        currentStep.questions[0].type === "single";
      if (isSingleQuestionStep) {
        const question = currentStep.questions[0] as SingleQuestion;
        const keyIndex = e.key.toUpperCase().charCodeAt(0) - 65;
        if (keyIndex >= 0 && keyIndex < question.options.length) {
          handleOptionSelect(question, question.options[keyIndex]);
        }
      }

      const isTextStep =
        currentStep.questions.length === 1 &&
        currentStep.questions[0].type === "text";
      if (isTextStep && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, goNext, handleOptionSelect, isTransitioning]);

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

  const renderQuestion = (question: Question, indexInStep: number) => {
    const questionAnswer = answers[question.id];
    const isTouched = !!touched[question.id];
    const blockSpacing = indexInStep > 0 ? "mt-10" : undefined;

    if (question.type === "single") {
      return (
        <div key={question.id} className={blockSpacing}>
          <h2 className="text-xl font-semibold text-[#3D3D3D] mb-6 leading-snug">
            {question.question}
          </h2>
          <div className="flex flex-col gap-2">
            {question.options.map((option, idx) => {
              const isSelected = questionAnswer === option;
              return (
                <motion.button
                  key={option}
                  onClick={() => handleOptionSelect(question, option)}
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
        </div>
      );
    }

    if (question.type === "text") {
      return (
        <div key={question.id} className={blockSpacing}>
          <h2 className="text-xl font-semibold text-[#3D3D3D] mb-6 leading-snug">
            {question.question}
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <textarea
              ref={textareaRef}
              value={typeof questionAnswer === "string" ? questionAnswer : ""}
              onChange={(e) => {
                setAnswers((prev) => ({
                  ...prev,
                  [question.id]: e.target.value,
                }));
                setTouched((prev) => ({ ...prev, [question.id]: true }));
              }}
              placeholder={question.placeholder}
              rows={4}
              className="w-full px-4 py-3.5 rounded-lg border-2 border-gray-200 bg-white text-gray-700 text-sm resize-none focus:outline-none focus:border-[#5B9FED] transition-colors placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-2">
              {question.required ? "" : "Optional — "}Press Enter or tap the
              button to continue
            </p>
          </motion.div>
        </div>
      );
    }

    const value =
      typeof questionAnswer === "number" ? questionAnswer : SLIDER_DEFAULT;

    return (
      <div key={question.id} className={blockSpacing}>
        <h2 className="text-xl font-semibold text-[#3D3D3D] mb-2 leading-snug">
          {question.question}
        </h2>
        {question.required && !isTouched ? (
          <p className="text-xs text-gray-400 mb-6">
            Drag the slider to choose a value.
          </p>
        ) : (
          <div className="mb-6" />
        )}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-1"
        >
          <Slider
            value={[value]}
            onValueChange={(next) => {
              setAnswers((prev) => ({ ...prev, [question.id]: next[0] }));
              setTouched((prev) => ({ ...prev, [question.id]: true }));
            }}
            min={0}
            max={100}
            step={1}
            className={[
              "w-full py-3",
              "[&_[data-slot=slider-track]]:bg-black/15",
              "[&_[data-slot=slider-track]]:h-1.5",
              "[&_[data-slot=slider-range]]:hidden",
              "[&_[data-slot=slider-thumb]]:size-9",
              "[&_[data-slot=slider-thumb]]:border-0",
              "[&_[data-slot=slider-thumb]]:shadow-[0_1px_3px_1px_rgba(0,0,0,0.32)]",
              "[&_[data-slot=slider-thumb]]:transition-colors",
              isTouched
                ? "[&_[data-slot=slider-thumb]]:bg-[var(--azure-70)]"
                : "[&_[data-slot=slider-thumb]]:bg-white",
            ].join(" ")}
          />
          <div className="mt-3 grid grid-cols-3 text-xs text-gray-500">
            <span className="text-left">{question.leftLabel}</span>
            <span className="text-center">{question.centerLabel}</span>
            <span className="text-right">{question.rightLabel}</span>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-dvh bg-[#E8E8E8] flex justify-center">
      <div className="w-full max-w-2xl min-h-dvh flex flex-col min-[672px]:border-x min-[672px]:border-gray-300">
        <SurveyHeader progress={progress} animateProgress />

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
                transition={{
                  duration: 0.35,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {currentStep.questions.map((question, index) =>
                  renderQuestion(question, index)
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

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
              {isLastStep ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!canAdvance}
                  className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12 disabled:bg-[var(--dark-40)] disabled:opacity-100 disabled:cursor-not-allowed"
                >
                  {submitLabel}
                </Button>
              ) : (
                <Button
                  onClick={goNext}
                  disabled={!canAdvance}
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
