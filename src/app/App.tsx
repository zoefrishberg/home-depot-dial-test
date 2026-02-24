import { useState, useEffect } from "react";
import { DialTestOption1 } from "./components/dial-test-option1";
import { DialTestOption2 } from "./components/dial-test-option2";
import { DialTestTutorial } from "./components/dial-test-tutorial";
import { DialTestIntro } from "./components/dial-test-intro";

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setShowTutorial(true);
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  if (showIntro) {
    return <DialTestIntro onContinue={handleIntroComplete} />;
  }

  if (showTutorial) {
    return <DialTestTutorial onComplete={handleTutorialComplete} />;
  }

  return <DialTestOption2 />;
}