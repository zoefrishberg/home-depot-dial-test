import React, { useState, useEffect, useMemo } from "react";
import { DialTestSlider } from "./components/dial-test-slider";
import { DialTestTutorialSlider } from "./components/dial-test-tutorial-slider";
import { DialTestIntro } from "./components/dial-test-intro";
import { DialTestFirstExposure } from "./components/dial-test-first-exposure";
import { DialTestHowItWorks } from "./components/dial-test-how-it-works";
import { FeedbackTypeform, type SurveyAnswers } from "./components/feedback-typeform";
import { SurveyHeader } from "./components/survey-header";
import type { HandChoice } from "./components/hand-choice";
import { createSession, recordPageCompletion } from "../utils/api";
import {
  getDialTestVideoMetadata,
  resolveDialTestVideo,
} from "./constants";
import { detectDevice, getDeviceSummary } from "../utils/deviceDetection";

type AppStep = "intro" | "segmentation" | "firstExposure" | "howItWorks" | "tutorial" | "dialTest" | "complete";

// Variant is fixed to "slider"; kept as a constant so the backend continues to
// receive a value in the same shape it expects.
const VARIANT = "slider" as const;

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>("intro");
  const [testMode, setTestMode] = useState(false);
  const [segmentationAnswers, setSegmentationAnswers] = useState<SurveyAnswers>({});
  const selectedVideo = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return resolveDialTestVideo(urlParams.get("video"));
  }, []);
  const selectedVideoMetadata = useMemo(
    () => getDialTestVideoMetadata(selectedVideo),
    [selectedVideo]
  );
  // Lucid respondent ID, captured once on load so it survives the whole flow.
  const respondentId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("RID") ?? "";
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTestMode = urlParams.get('test');
    const skipTutorial = urlParams.get('skipTutorial');

    if (urlTestMode === 'true') {
      setTestMode(true);
      console.log("🧪 TEST MODE ENABLED - Data will NOT be saved to database");
    }

    if (skipTutorial === 'true') {
      console.log("⏭️ SKIP TUTORIAL - Starting at dial test");
    }
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    window.requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>("#root *").forEach((element) => {
        element.scrollTop = 0;
        element.scrollLeft = 0;
      });
    });
  }, [step]);

  // Set document title and meta tags
  useEffect(() => {
    document.title = "NELSurveys – Complete a survey";

    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? "property" : "name";
      let tag = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }

      tag.setAttribute("content", content);
    };

    setMetaTag("description", "NELSurveys dial test application for measuring emotional responses to video content.");

    setMetaTag("og:title", "NELSurveys - Dial Test Survey", true);
    setMetaTag("og:description", "Measure emotional responses to video content with our dial test survey.", true);
    setMetaTag("og:site_name", "NELSurveys", true);
    setMetaTag("og:type", "website", true);

    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", "NELSurveys - Dial Test Survey");
    setMetaTag("twitter:description", "Measure emotional responses to video content with our dial test survey.");
  }, []);

  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      if (testMode) {
        const mockSessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(mockSessionId);
        console.log("🧪 Test mode: Mock session created (not saved):", mockSessionId);
        return;
      }

      try {
        const deviceInfo = detectDevice();
        console.log("Device detected:", getDeviceSummary(deviceInfo));

        const urlParams = new URLSearchParams(window.location.search);
        const capturedParams: Record<string, string> = {};
        urlParams.forEach((value, key) => {
          capturedParams[key] = value;
        });
        console.log("URL parameters captured:", capturedParams);

        const response = await createSession(VARIANT, deviceInfo, capturedParams, selectedVideoMetadata.slug, respondentId || undefined);
        if (response.success) {
          setSessionId(response.sessionId);
          console.log("Session created:", response.sessionId, "Variant:", VARIANT);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    }

    initSession();
  }, [testMode]);

  const handleIntroComplete = async () => {
    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "intro", {
          video: selectedVideoMetadata,
        });
        console.log("Intro page completed");
      } catch (error) {
        console.error("Failed to record intro completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving intro completion");
    }

    setStep("segmentation");
  };

  const handleSegmentationSubmit = async (answers: SurveyAnswers) => {
    setSegmentationAnswers(answers);

    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "segmentation", {
          answers,
          video: selectedVideoMetadata,
        });
        console.log("Segmentation questions completed");
      } catch (error) {
        console.error("Failed to record segmentation completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving segmentation completion");
    }

    setStep("firstExposure");
  };

  const handleFirstExposureComplete = async () => {
    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "firstExposure", {
          video: selectedVideoMetadata,
        });
        console.log("First exposure page completed");
      } catch (error) {
        console.error("Failed to record first exposure completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving first exposure completion");
    }
    setStep("howItWorks");
  };

  const handleHowItWorksComplete = async (choice: HandChoice) => {
    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "howItWorks");
        console.log("How it works page completed");
      } catch (error) {
        console.error("Failed to record how it works completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving how it works completion");
    }
    await handleHandSelectionComplete(choice);
  };

  const handleHandSelectionComplete = async (choice: HandChoice) => {
    const urlParams = new URLSearchParams(window.location.search);
    const skipTutorial = urlParams.get('skipTutorial');

    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "handSelection", { handedness: choice });
        console.log("Hand selection page completed:", choice);
      } catch (error) {
        console.error("Failed to record hand selection completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving hand selection completion");
    }

    setStep(skipTutorial === 'true' ? "dialTest" : "tutorial");
  };

  const handleTutorialComplete = async (durationMs: number) => {
    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "tutorial", {
          durationMs,
          durationSeconds: Math.round((durationMs / 1000) * 10) / 10,
        });
        console.log("Tutorial page completed");
      } catch (error) {
        console.error("Failed to record tutorial completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving tutorial completion");
    }
    setStep("dialTest");
  };

  // End of the dial: no post-video questions this round. Save pre-video
  // covariates + video metadata + RID, then redirect to Lucid.
  const handleDialTestComplete = async () => {
    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "completion", {
          preVideoAnswers: segmentationAnswers,
          video: selectedVideoMetadata,
          rid: respondentId || null,
        });
        console.log("Pre-video covariates saved before redirect");
        console.log("=== Session Complete ===");
        console.log(`Session ID: ${sessionId}`);
        console.log(`Video: ${selectedVideoMetadata.slug} | RID: ${respondentId || "none"}`);
        console.log(`To retrieve this session's data, use: getSessionData("${sessionId}")`);
      } catch (error) {
        console.error("Failed to save final completion record:", error);
        // Still proceed to the redirect so the respondent is returned to Lucid;
        // the session, dial data, and per-step segmentation save already exist.
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped final completion save");
      console.log("=== Test Session Complete (not saved) ===");
      console.log(`Mock Session ID: ${sessionId}`);
    }
    setStep("complete");
  };

  // Redirect to callback URL when complete
  useEffect(() => {
    if (step === "complete") {
      const callbackUrl = `https://notch.insights.supply/cb?token=23a7efa4-df2c-4b40-a3c2-c09541e276af&RID=${encodeURIComponent(respondentId)}`;

      console.log(`Redirecting to callback URL: ${callbackUrl}`);

      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 2000);
    }
  }, [step, respondentId]);

  switch (step) {
    case "intro":
      return <DialTestIntro onContinue={handleIntroComplete} />;
    case "segmentation":
      return (
        <FeedbackTypeform
          survey="segmentation"
          initialAnswers={segmentationAnswers}
          onSubmit={handleSegmentationSubmit}
          onBack={() => setStep("intro")}
          progressStart={0}
          progressEnd={20}
          submitLabel="Continue"
        />
      );
    case "firstExposure":
      return (
        <DialTestFirstExposure
          sessionId={sessionId}
          testMode={testMode}
          onComplete={handleFirstExposureComplete}
          onBack={() => setStep("segmentation")}
          progress={20}
          video={selectedVideo}
        />
      );
    case "howItWorks":
      return (
        <DialTestHowItWorks
          onComplete={handleHowItWorksComplete}
          onBack={() => setStep("firstExposure")}
          progress={35}
        />
      );
    case "tutorial":
      return (
        <DialTestTutorialSlider
          sessionId={sessionId}
          onComplete={handleTutorialComplete}
          onBack={() => setStep("howItWorks")}
          progress={65}
        />
      );
    case "dialTest": {
      const skipTutorial = new URLSearchParams(window.location.search).get("skipTutorial") === "true";
      return (
        <DialTestSlider
          sessionId={sessionId}
          testMode={testMode}
          onComplete={handleDialTestComplete}
          onBack={() => setStep(skipTutorial ? "howItWorks" : "tutorial")}
          progress={80}
          video={selectedVideo}
        />
      );
    }
    case "complete":
      return (
        <div className="min-h-dvh bg-[#E8E8E8] flex justify-center">
          <div className="w-full max-w-2xl min-h-dvh flex flex-col min-[672px]:border-x min-[672px]:border-gray-300">
          <SurveyHeader progress={100} showGift={false} />
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-[#5B9FED] rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mb-2">Thank you!</h1>
              <p className="text-gray-600">Your responses have been recorded. We appreciate your time and feedback.</p>
            </div>
          </main>
          </div>
        </div>
      );
  }
}
