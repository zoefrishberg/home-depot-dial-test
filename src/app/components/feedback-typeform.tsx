import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { SurveyHeader } from "./survey-header";

export type AnswerValue = string | number;
export type SurveyAnswers = Record<string, AnswerValue>;

type SurveyKind = "segmentation" | "postVideo";

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

interface MultiQuestion {
  id: string;
  question: string;
  type: "multi";
  // Non-anchor options. These are the ones that get randomized per session when
  // `randomize` is true.
  options: string[];
  // Pinned to the bottom in fixed order, never randomized (e.g. "Other",
  // "None of the above").
  anchorOptions?: string[];
  // Selecting one of these clears every other selection, and selecting any other
  // option clears these (e.g. "None of the above").
  exclusiveOptions?: string[];
  randomize?: boolean;
  required: boolean;
}

interface TextQuestion {
  id: string;
  question: string;
  type: "text";
  placeholder?: string;
  required: boolean;
}

interface YearQuestion {
  id: string;
  question: string;
  type: "year";
  placeholder?: string;
  min: number;
  max: number;
  required: boolean;
}

interface ZipQuestion {
  id: string;
  question: string;
  type: "zip";
  placeholder?: string;
  required: boolean;
}

interface DollarQuestion {
  id: string;
  question: string;
  type: "dollar";
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

type Question =
  | SingleQuestion
  | MultiQuestion
  | TextQuestion
  | YearQuestion
  | ZipQuestion
  | DollarQuestion
  | SliderQuestion;

interface Step {
  questions: Question[];
  // Optional predicate; when it returns false the step is skipped entirely.
  showIf?: (answers: SurveyAnswers) => boolean;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E", "F", "G"];
const SLIDER_DEFAULT = 50;

// Multi-select answers are stored as a single delimited string so they fit the
// existing string|number answer shape and persist cleanly in the session record.
// No option label contains this delimiter.
const MULTI_DELIM = " | ";
const parseMulti = (value: AnswerValue | undefined): string[] =>
  typeof value === "string" && value.length > 0 ? value.split(MULTI_DELIM) : [];
const joinMulti = (values: string[]): string => values.join(MULTI_DELIM);

const shuffle = <T,>(input: T[]): T[] => {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Amazon VA Combo round.
//
// Pre-video segmentation: demographics + two bipolar sliders, asked before the
// respondent ever sees the clip. These are covariates Mike/Anshuk break the
// outcome metrics down by, so their answers are stored in the segmentation /
// preVideoAnswers blob (NOT the post-video feedback row).
//
// IMPORTANT — order is intentional and must not be randomized. Each item is
// asked exactly once (either pre- OR post-video, never both); there is no
// pre/post pairing. One question per step.
const PRE_VIDEO_STEPS: Step[] = [
  {
    questions: [
      {
        // Age — same input style (year of birth) as prior rounds.
        id: "yearOfBirth",
        question: "What is your year of birth?",
        type: "year",
        placeholder: "YYYY",
        min: 1900,
        max: 2026,
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "gender",
        question: "What is your gender?",
        type: "single",
        options: ["Male", "Female", "Other"],
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        // Support DC Development (bipolar slider).
        id: "supportDcDevelopment",
        question:
          "Do you support or oppose data center development in your local community?",
        type: "slider",
        leftLabel: "Strongly Oppose",
        centerLabel: "Neutral",
        rightLabel: "Strongly Support",
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        // Positive Impact — Large Tech Companies (bipolar slider).
        id: "positiveImpactLargeTech",
        question:
          "To what extent do you agree or disagree that large tech companies have a positive impact on your local community?",
        type: "slider",
        leftLabel: "Strongly Disagree",
        centerLabel: "Neutral",
        rightLabel: "Strongly Agree",
        required: true,
      },
    ],
  },
];

// Post-video outcomes: 8 bipolar sliders, post-only, in this exact fixed order.
// No randomization. Stored in the feedback row (the post-video answers blob),
// separate from the pre-video segmentation answers.
//
// Analyst note: the two Regulation items are reverse-valence vs. favorability —
// a pro-Amazon respondent lands on the "disagree/left" side. Slider direction is
// kept as written; reverse-scoring is handled downstream by Mike/Anshuk.
const POST_VIDEO_STEPS: Step[] = [
  {
    questions: [
      {
        id: "dcBuiltResponsibly",
        question:
          "To what extent do you agree or disagree that data centers are built responsibly in your community?",
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
        id: "regulateLargeTech",
        question:
          "To what extent do you agree or disagree that the government should regulate large tech companies more?",
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
        id: "amazonFavorability",
        question:
          "Please indicate whether you have a favorable or unfavorable opinion of Amazon.",
        type: "slider",
        leftLabel: "Very Unfavorable",
        centerLabel: "Neutral",
        rightLabel: "Very Favorable",
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "amazonPositiveImpactVirginia",
        question:
          "To what extent do you agree or disagree that Amazon has a positive impact on Virginia and its communities?",
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
        id: "amazonGoodEmployer",
        question:
          "To what extent do you agree or disagree that Amazon is a good employer?",
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
        id: "amazonDcBuiltResponsibly",
        question:
          "To what extent do you agree or disagree that Amazon data centers are built responsibly?",
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
        id: "supportAmazonDcDevelopment",
        question:
          "Do you support or oppose Amazon data center development in your local community?",
        type: "slider",
        leftLabel: "Strongly Oppose",
        centerLabel: "Neutral",
        rightLabel: "Strongly Support",
        required: true,
      },
    ],
  },
  {
    questions: [
      {
        id: "regulateAmazon",
        question:
          "To what extent do you agree or disagree that the government should regulate Amazon data centers more?",
        type: "slider",
        leftLabel: "Strongly Disagree",
        centerLabel: "Neutral",
        rightLabel: "Strongly Agree",
        required: true,
      },
    ],
  },
];

const getSurveySteps = (survey: SurveyKind): Step[] =>
  survey === "postVideo" ? POST_VIDEO_STEPS : PRE_VIDEO_STEPS;

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
  if (question.type === "multi") return parseMulti(value).length > 0;
  if (question.type === "year") {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!/^\d{4}$/.test(raw)) return false;
    const year = Number(raw);
    return year >= question.min && year <= question.max;
  }
  if (question.type === "zip") {
    const raw = typeof value === "string" ? value.trim() : "";
    return /^\d{5}$/.test(raw);
  }
  if (question.type === "dollar") {
    const raw = typeof value === "string" ? value.trim() : "";
    const digitsOnly = raw.replace(/[^\d]/g, "");
    return digitsOnly.length > 0 && Number(digitsOnly) >= 0;
  }
  if (typeof value !== "string") return false;
  return value.trim().length > 0;
};

const formatDollar = (raw: string): string => {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 0) return "";
  return Number(digits).toLocaleString("en-US");
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
  const allSteps = getSurveySteps(survey);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>(() =>
    seedAnswers(allSteps, initialAnswers)
  );
  const [touched, setTouched] = useState<Record<string, boolean>>(() =>
    seedTouched(allSteps, initialAnswers)
  );
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Randomized non-anchor option order, computed once per session so the order
  // is stable across re-renders within a respondent's run.
  const [randomizedOptions] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    allSteps.forEach((step) =>
      step.questions.forEach((question) => {
        if (question.type === "multi") {
          map[question.id] = question.randomize
            ? shuffle(question.options)
            : [...question.options];
        }
      })
    );
    return map;
  });

  // Steps that should currently be shown, after applying conditional logic.
  const visibleSteps = useMemo(
    () => allSteps.filter((step) => !step.showIf || step.showIf(answers)),
    [allSteps, answers]
  );

  // If a conditional step disappears while we're past it, keep the index valid.
  useEffect(() => {
    if (currentIndex > visibleSteps.length - 1) {
      setCurrentIndex(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, currentIndex]);

  const currentStep =
    visibleSteps[currentIndex] ?? visibleSteps[visibleSteps.length - 1];
  const isLastStep = currentIndex === visibleSteps.length - 1;
  const progress =
    progressStart +
    (currentIndex / visibleSteps.length) * (progressEnd - progressStart);
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

    const firstInputQuestion = currentStep.questions.find(
      (question) =>
        question.type === "year" ||
        question.type === "zip" ||
        question.type === "dollar"
    );
    if (firstInputQuestion && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [currentIndex, currentStep.questions]);

  const goNext = useCallback(() => {
    if (isTransitioning || !canAdvance) return;
    if (currentIndex < visibleSteps.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [canAdvance, currentIndex, isTransitioning, visibleSteps.length]);

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
    onSubmit(getStepAnswers(allSteps, answers));
  };

  const handleOptionSelect = useCallback(
    (question: SingleQuestion, option: string) => {
      if (isTransitioning) return;
      setAnswers((prev) => ({ ...prev, [question.id]: option }));
      setTouched((prev) => ({ ...prev, [question.id]: true }));

      if (!autoAdvanceEnabled) return;
      setIsTransitioning(true);
      setTimeout(() => {
        if (currentIndex < visibleSteps.length - 1) {
          setDirection(1);
          setCurrentIndex((prev) => prev + 1);
        }
        setIsTransitioning(false);
      }, 450);
    },
    [autoAdvanceEnabled, currentIndex, isTransitioning, visibleSteps.length]
  );

  const handleMultiToggle = useCallback(
    (question: MultiQuestion, option: string) => {
      if (isTransitioning) return;
      const exclusive = question.exclusiveOptions ?? [];
      setAnswers((prev) => {
        const current = parseMulti(prev[question.id]);
        const isSelected = current.includes(option);
        let next: string[];
        if (exclusive.includes(option)) {
          // Toggling an exclusive option: select it alone, or clear it.
          next = isSelected ? [] : [option];
        } else if (isSelected) {
          next = current.filter((o) => o !== option);
        } else {
          // Selecting a normal option clears any exclusive selection.
          next = [...current.filter((o) => !exclusive.includes(o)), option];
        }
        return { ...prev, [question.id]: joinMulti(next) };
      });
      setTouched((prev) => ({ ...prev, [question.id]: true }));
    },
    [isTransitioning]
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
      const isInputStep =
        currentStep.questions.length === 1 &&
        (currentStep.questions[0].type === "year" ||
          currentStep.questions[0].type === "zip" ||
          currentStep.questions[0].type === "dollar");
      if ((isTextStep || isInputStep) && e.key === "Enter" && !e.shiftKey) {
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
    const inputClass =
      "w-full px-4 py-3.5 rounded-lg border-2 border-gray-200 bg-white text-gray-700 text-sm focus:outline-none focus:border-[#5B9FED] transition-colors placeholder:text-gray-400";

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
                      OPTION_KEYS[idx] ?? ""
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

    if (question.type === "multi") {
      const selected = parseMulti(questionAnswer);
      const nonAnchor = randomizedOptions[question.id] ?? question.options;
      const anchors = question.anchorOptions ?? [];
      const displayOptions = [...nonAnchor, ...anchors];

      return (
        <div key={question.id} className={blockSpacing}>
          <h2 className="text-xl font-semibold text-[#3D3D3D] mb-2 leading-snug">
            {question.question}
          </h2>
          <p className="text-xs text-gray-400 mb-5">Select all that apply.</p>
          <div className="flex flex-col gap-2">
            {displayOptions.map((option, idx) => {
              const isSelected = selected.includes(option);
              return (
                <motion.button
                  key={option}
                  onClick={() => handleMultiToggle(question, option)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm flex items-center gap-3 ${
                    isSelected
                      ? "border-[#5B9FED] bg-[#5B9FED]/10 text-[#3D3D3D]"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "bg-[#5B9FED] text-white"
                        : "bg-white border-2 border-gray-300"
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
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

    if (question.type === "year") {
      const value = typeof questionAnswer === "string" ? questionAnswer : "";
      const showRangeHint = value.length > 0 && !isAnswered(question, value, true);

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
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="bday-year"
              maxLength={4}
              value={value}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                setAnswers((prev) => ({ ...prev, [question.id]: next }));
                setTouched((prev) => ({ ...prev, [question.id]: true }));
              }}
              placeholder={question.placeholder}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-2">
              {showRangeHint
                ? `Enter a year between ${question.min} and ${question.max}.`
                : `Enter a 4-digit year (${question.min}-${question.max}).`}
            </p>
          </motion.div>
        </div>
      );
    }

    if (question.type === "zip") {
      const value = typeof questionAnswer === "string" ? questionAnswer : "";

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
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              value={value}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d]/g, "").slice(0, 5);
                setAnswers((prev) => ({ ...prev, [question.id]: next }));
                setTouched((prev) => ({ ...prev, [question.id]: true }));
              }}
              placeholder={question.placeholder}
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-2">
              Enter a 5-digit US zip code.
            </p>
          </motion.div>
        </div>
      );
    }

    if (question.type === "dollar") {
      const rawValue = typeof questionAnswer === "string" ? questionAnswer : "";
      const displayValue = rawValue.length > 0 ? formatDollar(rawValue) : "";

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
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                $
              </span>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, "");
                  setAnswers((prev) => ({ ...prev, [question.id]: digits }));
                  setTouched((prev) => ({ ...prev, [question.id]: true }));
                }}
                placeholder={question.placeholder}
                className={`${inputClass} pl-8`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Approximate total - digits only.
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
