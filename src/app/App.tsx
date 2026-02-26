import { useState, useEffect } from "react";
import { DialTestOption2 } from "./components/dial-test-option2";
import { DialTestTutorial } from "./components/dial-test-tutorial";
import { DialTestIntro } from "./components/dial-test-intro";
import { FeedbackTypeform } from "./components/feedback-typeform";
import { createSession, recordPageCompletion, saveFeedback } from "../utils/api";

type AppStep = "intro" | "tutorial" | "dialTest" | "feedback" | "complete";

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>("intro");

  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await createSession();
        if (response.success) {
          setSessionId(response.sessionId);
          console.log("Session created:", response.sessionId);
        }
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };

    initSession();
  }, []);

  const handleIntroComplete = async () => {
    if (sessionId) {
      try {
        await recordPageCompletion(sessionId, "intro");
        console.log("Intro page completed");
      } catch (error) {
        console.error("Failed to record intro completion:", error);
      }
    }
    setStep("tutorial");
  };

  const handleTutorialComplete = async () => {
    if (sessionId) {
      try {
        await recordPageCompletion(sessionId, "tutorial");
        console.log("Tutorial page completed");
      } catch (error) {
        console.error("Failed to record tutorial completion:", error);
      }
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
    if (sessionId) {
      try {
        await saveFeedback(sessionId, answers);
        await recordPageCompletion(sessionId, "feedback");
        console.log("Feedback saved successfully");
      } catch (error) {
        console.error("Failed to save feedback:", error);
      }
    }
    setStep("complete");
  };

  switch (step) {
    case "intro":
      return <DialTestIntro onContinue={handleIntroComplete} />;
    case "tutorial":
      return <DialTestTutorial sessionId={sessionId} onComplete={handleTutorialComplete} />;
    case "dialTest":
      return <DialTestOption2 sessionId={sessionId} onComplete={handleDialTestComplete} />;
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