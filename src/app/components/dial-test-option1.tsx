import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Gift, Lock } from "lucide-react";

interface DataPoint {
  timestamp: number;
  value: number;
}

export function DialTestOption1() {
  const [sliderValue, setSliderValue] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const playerRef = useRef<any>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    // Load the YouTube IFrame Player API code asynchronously
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Create YouTube player when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        videoId: 'PTXvuzFLYxE',
        playerVars: {
          'playsinline': 1
        },
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    };

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  const onPlayerStateChange = (event: any) => {
    if (event.data === (window as any).YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  // Record data points while video is playing
  useEffect(() => {
    if (isPlaying) {
      recordingInterval.current = setInterval(() => {
        if (playerRef.current) {
          setDataPoints(prev => [...prev, {
            timestamp: playerRef.current.getCurrentTime(),
            value: sliderValue
          }]);
        }
      }, 100); // Record every 100ms
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isPlaying, sliderValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value));
  };

  const handleSubmit = () => {
    alert(`Dial test completed! Recorded ${dataPoints.length} data points.`);
    console.log("Data points:", dataPoints);
  };

  // Get emotion based on slider value
  const getEmotionDisplay = () => {
    if (sliderValue < 25) return { emoji: "😠", label: "Negative", color: "#EF4444" };
    if (sliderValue < 50) return { emoji: "😐", label: "Neutral", color: "#F59E0B" };
    if (sliderValue < 75) return { emoji: "😊", label: "Positive", color: "#84CC16" };
    return { emoji: "😄", label: "Very Positive", color: "#22C55E" };
  };

  const emotion = getEmotionDisplay();

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
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl text-[#3D3D3D] mb-2">
            Watch the video and share your reaction
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Adjust the slider continuously as you watch to show how you feel about each moment.
          </p>

          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden mb-6 shadow-lg relative">
            <div id="youtube-player" className="w-full aspect-video"></div>
            
            {/* Emotion Overlay */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3 pointer-events-none">
              <span className="text-4xl">{emotion.emoji}</span>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm">{emotion.label}</span>
                <div className="w-20 h-1.5 bg-gray-600 rounded-full mt-1">
                  <div 
                    className="h-full rounded-full transition-all duration-150"
                    style={{ 
                      width: `${sliderValue}%`,
                      backgroundColor: emotion.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Slider Control */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl flex-shrink-0">😠</span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #EF4444 0%, #FCD34D ${sliderValue}%, #22C55E 100%)`
                  }}
                />
                <style>{`
                  .slider-thumb::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    background: #5B9FED;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  }
                  .slider-thumb::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    background: #5B9FED;
                    border-radius: 50%;
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  }
                `}</style>
              </div>
              <span className="text-3xl flex-shrink-0">😄</span>
            </div>
            <p className="text-center text-sm text-gray-600">
              Keep adjusting as you watch
            </p>
          </div>

          {/* Recording Indicator */}
          {isPlaying && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Recording your responses...</span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#E8E8E8] px-4 py-6 border-t border-gray-300">
        <div className="max-w-2xl mx-auto">
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
              className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)] text-white border-0 h-12"
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}