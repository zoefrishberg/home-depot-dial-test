import { useState, useEffect } from "react";
import { DialTestOption2 } from "./components/dial-test-option2";
import { DialTestTutorial } from "./components/dial-test-tutorial";
import { DialTestSlider } from "./components/dial-test-slider";
import { DialTestTutorialSlider } from "./components/dial-test-tutorial-slider";
import { DialTestSliderRatcheted } from "./components/dial-test-slider-ratcheted";
import { DialTestTutorialSliderRatcheted } from "./components/dial-test-tutorial-slider-ratcheted";
import { DialTestEmotiveButtons } from "./components/dial-test-emotive-buttons";
import { DialTestTutorialEmotiveButtons } from "./components/dial-test-tutorial-emotive-buttons";
import { DialTestIntro } from "./components/dial-test-intro";
import { DialTestFirstExposure } from "./components/dial-test-first-exposure";
import { FeedbackTypeform } from "./components/feedback-typeform";
import { createSession, recordPageCompletion, saveFeedback } from "../utils/api";
import { detectDevice, getDeviceSummary } from "../utils/deviceDetection";

type AppStep = "intro" | "firstExposure" | "tutorial" | "dialTest" | "feedback" | "complete";
type Variant = "buttons" | "slider" | "slider-ratcheted" | "emotive-buttons";

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>("intro");
  const [variant, setVariant] = useState<Variant>("buttons");
  const [testMode, setTestMode] = useState(false);

  // A/B test: Randomly assign variant on mount
  useEffect(() => {
    // Check URL parameter first for testing
    const urlParams = new URLSearchParams(window.location.search);
    const urlVariant = urlParams.get('variant');
    const urlTestMode = urlParams.get('test');
    const skipTutorial = urlParams.get('skipTutorial');
    
    // Enable test mode if ?test=true
    if (urlTestMode === 'true') {
      setTestMode(true);
      console.log("🧪 TEST MODE ENABLED - Data will NOT be saved to database");
    }
    
    // Skip tutorial if ?skipTutorial=true
    if (skipTutorial === 'true') {
      console.log("⏭️ SKIP TUTORIAL - Starting at dial test");
    }
    
    let assignedVariant: Variant;
    
    if (urlVariant === 'slider' || urlVariant === 'slider-ratcheted' || urlVariant === 'buttons' || urlVariant === 'button' || urlVariant === 'emotive-buttons') {
      // Manual override via URL parameter (handle both 'button' and 'buttons')
      if (urlVariant === 'button') {
        assignedVariant = 'buttons';
      } else {
        assignedVariant = urlVariant as Variant;
      }
      console.log("A/B Test - Manual variant from URL:", assignedVariant);
    } else {
      // Random assignment for actual users
      assignedVariant = Math.random() < 0.5 ? "buttons" : "slider";
      console.log("A/B Test - Randomly assigned variant:", assignedVariant);
    }
    
    setVariant(assignedVariant);
  }, []);

  // Set document title and meta tags
  useEffect(() => {
    // Set title
    document.title = "NELSurveys - Dial Test Survey";

    // Helper function to set or update meta tags
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

    // Set meta description
    setMetaTag("description", "NELSurveys dial test application for measuring emotional responses to video content.");

    // Set Open Graph tags
    setMetaTag("og:title", "NELSurveys - Dial Test Survey", true);
    setMetaTag("og:description", "Measure emotional responses to video content with our dial test survey.", true);
    setMetaTag("og:site_name", "NELSurveys", true);
    setMetaTag("og:type", "website", true);

    // Set Twitter Card tags
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", "NELSurveys - Dial Test Survey");
    setMetaTag("twitter:description", "Measure emotional responses to video content with our dial test survey.");
  }, []);

  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      if (testMode) {
        // In test mode, generate a mock session ID but don't save to database
        const mockSessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(mockSessionId);
        console.log("🧪 Test mode: Mock session created (not saved):", mockSessionId);
        return;
      }
      
      try {
        // Detect device information
        const deviceInfo = detectDevice();
        console.log("Device detected:", getDeviceSummary(deviceInfo));
        
        // Capture all URL parameters from survey provider
        const urlParams = new URLSearchParams(window.location.search);
        const capturedParams: Record<string, string> = {};
        urlParams.forEach((value, key) => {
          capturedParams[key] = value;
        });
        console.log("URL parameters captured:", capturedParams);
        
        const response = await createSession(variant, deviceInfo, capturedParams);
        if (response.success) {
          setSessionId(response.sessionId);
          console.log("Session created:", response.sessionId, "Variant:", variant);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    }

    if (variant) {
      initSession();
    }
  }, [variant, testMode]);

  const handleIntroComplete = async () => {
    // Check if skipTutorial URL parameter is set
    const urlParams = new URLSearchParams(window.location.search);
    const skipTutorial = urlParams.get('skipTutorial');
    
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
    
    // Skip to dial test if parameter is set
    if (skipTutorial === 'true') {
      console.log("⏭️ Skipping tutorial, going directly to dial test");
      setStep("dialTest");
    } else {
      setStep("firstExposure");
    }
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
    setStep("tutorial");
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
        console.log(`Variant: ${variant}`);
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
      console.log(`Variant: ${variant}`);
    }
    setStep("complete");
  };

  // Redirect to callback URL when complete
  useEffect(() => {
    if (step === "complete") {
      // Get RID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const rid = urlParams.get('RID') || '';
      
      // Construct callback URL
      const callbackUrl = `https://notch.insights.supply/cb?token=23a7efa4-df2c-4b40-a3c2-c09541e276af&RID=${rid}`;
      
      console.log(`Redirecting to callback URL: ${callbackUrl}`);
      
      // Redirect after a brief delay to show thank you message
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
          progress={25}
        />
      );
    case "tutorial":
      if (variant === "emotive-buttons") {
        return <DialTestTutorialEmotiveButtons sessionId={sessionId} testMode={testMode} onComplete={handleTutorialComplete} progress={50} />;
      } else if (variant === "buttons") {
        return <DialTestTutorial sessionId={sessionId} testMode={testMode} onComplete={handleTutorialComplete} progress={50} />;
      } else if (variant === "slider-ratcheted") {
        return <DialTestTutorialSliderRatcheted sessionId={sessionId} testMode={testMode} onComplete={handleTutorialComplete} progress={50} />;
      } else {
        return <DialTestTutorialSlider sessionId={sessionId} testMode={testMode} onComplete={handleTutorialComplete} progress={50} />;
      }
    case "dialTest":
      if (variant === "buttons") {
        return <DialTestOption2 sessionId={sessionId} testMode={testMode} onComplete={handleDialTestComplete} progress={75} />;
      } else if (variant === "emotive-buttons") {
        return <DialTestEmotiveButtons sessionId={sessionId} testMode={testMode} onComplete={handleDialTestComplete} progress={75} />;
      } else if (variant === "slider-ratcheted") {
        return <DialTestSliderRatcheted sessionId={sessionId} testMode={testMode} onComplete={handleDialTestComplete} progress={75} />;
      } else {
        return <DialTestSlider sessionId={sessionId} testMode={testMode} onComplete={handleDialTestComplete} progress={75} />;
      }
    case "feedback":
      return (
        <FeedbackTypeform
          sessionId={sessionId}
          variant={variant}
          onSubmit={handleFeedbackSubmit}
          onBack={() => setStep("dialTest")}
        />
      );
    case "complete":
      return (
        <div className="min-h-screen bg-[#E8E8E8] flex flex-col">
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
              <h1 className="text-2xl font-semibold text-[#3D3D3D] mb-2">Thank you!</h1>
              <p className="text-gray-600">Your responses have been recorded. We appreciate your time and feedback.</p>
            </div>
          </main>
        </div>
      );
  }
}