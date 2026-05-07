import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Gift, Lock, X, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

interface Highlight {
  id: string;
  text: string;
  sentiment: "positive" | "negative";
  comment?: string;
  startIndex: number;
  endIndex: number;
}

export function TextHighlightSurvey() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedSentiment, setSelectedSentiment] = useState<"positive" | "negative">("positive");
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [currentComment, setCurrentComment] = useState("");
  const [pendingHighlight, setPendingHighlight] = useState<Highlight | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  const articleHeadline = "Climate Change Summit Reaches Historic Agreement";
  
  const articleBody = `World leaders gathered in Geneva yesterday to finalize a groundbreaking climate accord that aims to reduce global carbon emissions by 50% within the next decade. The agreement, signed by 195 countries, represents the most ambitious international effort to combat climate change to date.

Key provisions include substantial investments in renewable energy infrastructure, with developed nations committing $500 billion annually to support clean energy transitions in developing countries. Critics argue that the targets may be too ambitious and could harm economic growth, while environmental advocates claim the measures don't go far enough to prevent catastrophic warming.

The summit also addressed deforestation, with new protections for the Amazon rainforest and other critical ecosystems. However, enforcement mechanisms remain a point of contention, as some nations resist external oversight of their environmental policies.`;

  // Full article text for indexing (headline + body)
  const fullArticleText = articleHeadline + "\n\n" + articleBody;

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    const range = selection.getRangeAt(0);
    const articleElement = articleRef.current;
    
    if (!articleElement || !articleElement.contains(range.commonAncestorContainer)) {
      return;
    }

    // Calculate character positions
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(articleElement);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preSelectionRange.toString().length;
    const endIndex = startIndex + selectedText.length;

    // Check for overlapping highlights
    const hasOverlap = highlights.some(
      (h) => (startIndex < h.endIndex && endIndex > h.startIndex)
    );

    if (hasOverlap) {
      alert("This text overlaps with an existing highlight. Please select different text.");
      selection.removeAllRanges();
      return;
    }

    const newHighlight: Highlight = {
      id: Date.now().toString(),
      text: selectedText,
      sentiment: selectedSentiment,
      startIndex,
      endIndex,
    };

    setPendingHighlight(newHighlight);
    setShowCommentDialog(true);
    selection.removeAllRanges();
  };

  const saveHighlight = () => {
    if (pendingHighlight) {
      setHighlights([...highlights, {
        ...pendingHighlight,
        comment: currentComment || undefined
      }]);
    }
    setShowCommentDialog(false);
    setCurrentComment("");
    setPendingHighlight(null);
  };

  const skipComment = () => {
    if (pendingHighlight) {
      setHighlights([...highlights, pendingHighlight]);
    }
    setShowCommentDialog(false);
    setCurrentComment("");
    setPendingHighlight(null);
  };

  const removeHighlight = (id: string) => {
    setHighlights(highlights.filter(h => h.id !== id));
  };

  const renderHighlightedText = () => {
    const headlineEnd = articleHeadline.length;
    const bodyStart = headlineEnd + 2; // Account for \n\n
    
    if (highlights.length === 0) {
      return (
        <>
          <h1 className="text-3xl font-bold mb-4 leading-tight">
            {articleHeadline}
          </h1>
          <div className="text-base leading-relaxed whitespace-pre-wrap">
            {articleBody}
          </div>
        </>
      );
    }

    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
    const headlineParts: JSX.Element[] = [];
    const bodyParts: JSX.Element[] = [];
    let headlineIndex = 0;
    let bodyIndex = 0;

    // Separate highlights into headline and body
    const headlineHighlights = sortedHighlights.filter(h => h.endIndex <= headlineEnd);
    const bodyHighlights = sortedHighlights.filter(h => h.startIndex >= bodyStart);

    // Render headline with highlights
    headlineHighlights.forEach((highlight, idx) => {
      // Add text before highlight
      if (headlineIndex < highlight.startIndex) {
        headlineParts.push(
          <span key={`hl-text-${idx}`}>
            {articleHeadline.substring(headlineIndex, highlight.startIndex)}
          </span>
        );
      }

      // Add highlighted text
      const bgColor = 
        highlight.sentiment === "positive" ? "bg-green-200" :
        "bg-red-200";

      headlineParts.push(
        <mark
          key={`hl-highlight-${highlight.id}`}
          className={`${bgColor} cursor-pointer rounded px-0.5`}
          title={highlight.comment || `${highlight.sentiment} sentiment`}
        >
          {articleHeadline.substring(highlight.startIndex, highlight.endIndex)}
        </mark>
      );

      headlineIndex = highlight.endIndex;
    });

    // Add remaining headline text
    if (headlineIndex < articleHeadline.length) {
      headlineParts.push(
        <span key="hl-text-end">
          {articleHeadline.substring(headlineIndex)}
        </span>
      );
    }

    // Render body with highlights
    bodyHighlights.forEach((highlight, idx) => {
      const adjustedStart = highlight.startIndex - bodyStart;
      const adjustedEnd = highlight.endIndex - bodyStart;

      // Add text before highlight
      if (bodyIndex < adjustedStart) {
        bodyParts.push(
          <span key={`body-text-${idx}`}>
            {articleBody.substring(bodyIndex, adjustedStart)}
          </span>
        );
      }

      // Add highlighted text
      const bgColor = 
        highlight.sentiment === "positive" ? "bg-green-200" :
        "bg-red-200";

      bodyParts.push(
        <mark
          key={`body-highlight-${highlight.id}`}
          className={`${bgColor} cursor-pointer rounded px-0.5`}
          title={highlight.comment || `${highlight.sentiment} sentiment`}
        >
          {articleBody.substring(adjustedStart, adjustedEnd)}
        </mark>
      );

      bodyIndex = adjustedEnd;
    });

    // Add remaining body text
    if (bodyIndex < articleBody.length) {
      bodyParts.push(
        <span key="body-text-end">
          {articleBody.substring(bodyIndex)}
        </span>
      );
    }

    return (
      <>
        <h1 className="text-3xl font-bold mb-4 leading-tight">
          {headlineParts.length > 0 ? headlineParts : articleHeadline}
        </h1>
        <div className="text-base leading-relaxed whitespace-pre-wrap">
          {bodyParts.length > 0 ? bodyParts : articleBody}
        </div>
      </>
    );
  };

  const handleSubmit = () => {
    alert(`Survey submitted with ${highlights.length} highlights!`);
    console.log("Highlights:", highlights);
  };

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
            <div className="h-full bg-[#5B9FED]" style={{ width: "40%" }}></div>
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
            Read the article and highlight text
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Select text to highlight it based on your sentiment. You can optionally add comments to your highlights.
          </p>

          {/* Sentiment Selection */}
          <div className="mb-4">
            <p className="text-sm text-[#3D3D3D] mb-2">Select sentiment:</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSentiment("positive")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedSentiment === "positive"
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300"
                }`}
              >
                Positive
              </button>
              <button
                onClick={() => setSelectedSentiment("negative")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedSentiment === "negative"
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300"
                }`}
              >
                Negative
              </button>
            </div>
          </div>

          {/* Article */}
          <div
            ref={articleRef}
            className="bg-white p-6 rounded-lg shadow-sm mb-4 select-text"
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            <div className="prose prose-sm max-w-none text-[#1a1a1a] leading-relaxed">
              {renderHighlightedText()}
            </div>
          </div>

          {/* Highlights Summary */}
          {highlights.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
              <h2 className="text-base font-medium text-[#3D3D3D] mb-3">
                Your Highlights ({highlights.length})
              </h2>
              <div className="space-y-2">
                {highlights.map((highlight) => {
                  const bgColor = 
                    highlight.sentiment === "positive" ? "bg-green-100 border-green-300" :
                    "bg-red-100 border-red-300";
                  
                  return (
                    <div
                      key={highlight.id}
                      className={`p-3 rounded-lg border ${bgColor} relative`}
                    >
                      <button
                        onClick={() => removeHighlight(highlight.id)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs font-medium text-gray-600 mb-1 capitalize">
                        {highlight.sentiment}
                      </p>
                      <p className="text-sm text-[#3D3D3D] pr-6 line-clamp-2">
                        "{highlight.text}"
                      </p>
                      {highlight.comment && (
                        <div className="mt-2 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600 italic">
                            {highlight.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Add a comment (optional)</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-3">
              Selected text: <span className="font-medium">"{pendingHighlight?.text}"</span>
            </p>
            <Textarea
              placeholder="Why did you feel this way about this text?"
              value={currentComment}
              onChange={(e) => setCurrentComment(e.target.value)}
              className="min-h-24"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={skipComment}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={saveHighlight}
              className="flex-1 bg-[var(--azure-70)] hover:bg-[var(--azure-80)]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}