import { useState, useEffect } from "react";
import { DialTestOption2 } from "./components/dial-test-option2";
import { DialTestTutorial } from "./components/dial-test-tutorial";
import { DialTestSlider } from "./components/dial-test-slider";
import { DialTestTutorialSlider } from "./components/dial-test-tutorial-slider";
import { DialTestIntro } from "./components/dial-test-intro";
import { FeedbackTypeform } from "./components/feedback-typeform";
import { createSession, recordPageCompletion, saveFeedback } from "../utils/api";
import { detectDevice, getDeviceSummary } from "../utils/deviceDetection";

type AppStep = "intro" | "tutorial" | "dialTest" | "feedback" | "complete";
type Variant = "buttons" | "slider";

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
    
    // Enable test mode if ?test=true
    if (urlTestMode === 'true') {
      setTestMode(true);
      console.log("🧪 TEST MODE ENABLED - Data will NOT be saved to database");
    }
    
    let assignedVariant: Variant;
    
    if (urlVariant === 'slider' || urlVariant === 'buttons' || urlVariant === 'button') {
      // Manual override via URL parameter (handle both 'button' and 'buttons')
      assignedVariant = urlVariant === 'button' ? 'buttons' : urlVariant as Variant;
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
        
        const response = await createSession(variant, deviceInfo);
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
        console.log(`To retrieve all sessions, use: getAllSessions()`);
      } catch (error) {
        console.error("Failed to save feedback:", error);
      }
    } else if (testMode) {
      console.log("🧪 Test mode: Skipped saving feedback");
      console.log("=== Test Session Complete (not saved) ===");
      console.log(`Mock Session ID: ${sessionId}`);
      console.log(`Variant: ${variant}`);
    }
    setStep("complete");
  };

  switch (step) {
    case "intro":
      return <DialTestIntro onContinue={handleIntroComplete} />;
    case "tutorial":
      return variant === "buttons"
        ? <DialTestTutorial sessionId={sessionId} testMode={testMode} onComplete={handleTutorialComplete} />
        : <DialTestTutorialSlider sessionId={sessionId} testMode={testMode} onComplete={handleTutorialComplete} />;
    case "dialTest":
      return variant === "buttons"
        ? <DialTestOption2 sessionId={sessionId} testMode={testMode} onComplete={handleDialTestComplete} />
        : <DialTestSlider sessionId={sessionId} testMode={testMode} onComplete={handleDialTestComplete} />;
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