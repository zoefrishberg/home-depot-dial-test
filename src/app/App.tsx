import { useState, useEffect } from "react";
import { DialTestSlider } from "./components/dial-test-slider";
import { DialTestTutorialSlider } from "./components/dial-test-tutorial-slider";
import { DialTestIntro } from "./components/dial-test-intro";
import { DialTestFirstExposure } from "./components/dial-test-first-exposure";
import { DialTestHowItWorks } from "./components/dial-test-how-it-works";
import { DialTestHandSelection } from "./components/dial-test-hand-selection";
import { FeedbackTypeform } from "./components/feedback-typeform";
import { createSession, recordPageCompletion, saveFeedback } from "../utils/api";
import { detectDevice, getDeviceSummary } from "../utils/deviceDetection";

type AppStep = "intro" | "firstExposure" | "howItWorks" | "handSelection" | "tutorial" | "dialTest" | "feedback" | "complete";

// Variant is fixed to "slider"; kept as a constant so the backend continues to
// receive a value in the same shape it expects.
const VARIANT = "slider" as const;

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>("intro");
  const [testMode, setTestMode] = useState(false);

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

  // Set document title and meta tags
  useEffect(() => {
    document.title = "NELSurveys - Dial Test Survey";

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

        const response = await createSession(VARIANT, deviceInfo, capturedParams);
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
        await recordPageCompletion(sessionId, "intro");
        console.log("Intro page completed");
      } catch (error) {
        console.error("Failed to record intro completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving intro completion");
    }

    setStep("firstExposure");
  };

  const handleFirstExposureComplete = async () => {
    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "firstExposure");
        console.log("First exposure page completed");
      } catch (error) {
        console.error("Failed to record first exposure completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving first exposure completion");
    }
    setStep("howItWorks");
  };

  const handleHowItWorksComplete = async () => {
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
    setStep("handSelection");
  };

  const handleHandSelectionComplete = async (choice: "left" | "right") => {
    const urlParams = new URLSearchParams(window.location.search);
    const skipTutorial = urlParams.get('skipTutorial');

    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "handSelection");
        console.log("Hand selection page completed:", choice);
      } catch (error) {
        console.error("Failed to record hand selection completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving hand selection completion");
    }

    setStep(skipTutorial === 'true' ? "dialTest" : "tutorial");
  };

  const handleTutorialComplete = async () => {
    if (sessionId && !testMode) {
      try {
        await recordPageCompletion(sessionId, "tutorial");
        console.log("Tutorial page completed");
      } catch (error) {
        console.error("Failed to record tutorial completion:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving tutorial completion");
    }
    setStep("dialTest");
  };

  const handleDialTestComplete = () => {
    setStep("feedback");
  };

  const handleFeedbackSubmit = async (answers: {
    easeOfUse: string;
    attentionDifficulty: string;
    expressiveness: string;
    improvements: string;
    repeatIntent: string;
  }) => {
    if (sessionId && !testMode) {
      try {
        await saveFeedback(sessionId, answers);
        await recordPageCompletion(sessionId, "feedback");
        console.log("Feedback saved successfully");
        console.log("=== Session Complete ===");
        console.log(`Session ID: ${sessionId}`);
        console.log(`To retrieve this session's data, use: getSessionData("${sessionId}")`);
      } catch (error) {
        console.error("Failed to save feedback:", error);
        alert("Failed to save feedback. Please try again.");
        return;
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving feedback");
      console.log("=== Test Session Complete (not saved) ===");
      console.log(`Mock Session ID: ${sessionId}`);
    }
    setStep("complete");
  };

  // Redirect to callback URL when complete
  useEffect(() => {
    if (step === "complete") {
      const urlParams = new URLSearchParams(window.location.search);
      const rid = urlParams.get('RID') || '';

      const callbackUrl = `https://notch.insights.supply/cb?token=23a7efa4-df2c-4b40-a3c2-c09541e276af&RID=${rid}`;

      console.log(`Redirecting to callback URL: ${callbackUrl}`);

      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 2000);
    }
  }, [step]);

  switch (step) {
    case "intro":
      return <DialTestIntro onContinue={handleIntroComplete} />;
    case "firstExposure":
      return (
        <DialTestFirstExposure
          sessionId={sessionId}
          testMode={testMode}
          onComplete={handleFirstExposureComplete}
          onBack={() => setStep("intro")}
          progress={20}
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
    case "handSelection":
      return (
        <DialTestHandSelection
          onComplete={handleHandSelectionComplete}
          onBack={() => setStep("howItWorks")}
          progress={50}
        />
      );
    case "tutorial":
      return <DialTestTutorialSlider sessionId={sessionId} testMode={testMode} onComplete={handleTutorialComplete} progress={65} />;
    case "dialTest":
      return <DialTestSlider sessionId={sessionId} testMode={testMode} onComplete={handleDialTestComplete} progress={80} />;
    case "feedback":
      return (
        <FeedbackTypeform
          sessionId={sessionId}
          onSubmit={handleFeedbackSubmit}
          onBack={() => setStep("dialTest")}
        />
      );
    case "complete":
      return (
        <div className="min-h-screen bg-[#E8E8E8] flex justify-center">
          <div className="w-full max-w-2xl min-h-screen flex flex-col border-x border-gray-300">
          <header className="bg-[#3D3D3D] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-white" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}></div>
              </div>
              <span className="text-white font-medium">NELSurveys</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full bg-[#5B9FED]" style={{ width: "100%" }}></div>
              </div>
            </div>
          </header>
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
