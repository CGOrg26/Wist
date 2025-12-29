import { useEffect, useMemo, useState } from "react";
import "./DiaryEntry.css";

const PAGES = [
  {
    title: "",
    content: `Dear Diary,

Today is the day. The moving truck is coming at 3pm, theyre going to take all our stuff away to our new house. I still cant believe mom is doing this. She's really just going to erase everything from our lives like this?

Ever since dad passed away she's been pretending he never existed and now this? I refuse to let this happen. I won't forget dad and I won't leave my home.

Ill hide away the house keys so she can't give them away anymore. This way our lives could stay the same as they were before

Wish me luck!
Joy`,
  },
  {
    title: "What happened next...",
    content: `When Joy hid the keys, something unexpected happened. The house... changed. Mother and daughter found themselves pulled into an unknown realm - a place born from grief and memory.

To escape and find peace, they must journey through 5 chapters, each representing a stage of grief:

Chapter 1: Denial
Chapter 2: Anger
Chapter 3: Bargaining
Chapter 4: Depression
Chapter 5: Acceptance

In each chapter, they must work together to collect a key. Only by gathering all 5 keys can they unlock the door to healing and find their way home.

Their journey begins now...`,
  },
];

export default function DiaryEntry({ onComplete }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);

  const tokens = useMemo(() => {
    const content = PAGES[currentPage].content || "";
    const parts = content.split(/(\s+)/);
    return parts.map((text) => ({
      text,
      isWord: /\S/.test(text),
    }));
  }, [currentPage]);

  const wordCount = useMemo(
    () => tokens.filter((t) => t.isWord).length,
    [tokens]
  );

  useEffect(() => {
    setVisibleCount(0);
    if (wordCount === 0) return undefined;
    const interval = setInterval(() => {
      setVisibleCount((count) => {
        if (count >= wordCount) {
          clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 220);
    return () => clearInterval(interval);
  }, [wordCount]);

  const handleNext = () => {
    if (currentPage < PAGES.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="diary-overlay">
      <div className="diary-container">
        <div className="diary-page">
          <div className="diary-content">
            {PAGES[currentPage].title ? (
              <h2 className="diary-title">{PAGES[currentPage].title}</h2>
            ) : null}
            <div className="diary-text">
              {visibleCount === 0 ? <span className="diary-cursor" /> : null}
              {(() => {
                let seenWords = 0;
                return tokens.map((token, idx) => {
                  if (token.isWord) {
                    const isVisible = seenWords < visibleCount;
                    const isCursorHere = seenWords === visibleCount - 1;
                    seenWords += 1;
                    return (
                      <span key={`${currentPage}-${idx}`}>
                        <span
                          className={`diary-word ${isVisible ? "visible" : ""}`}
                        >
                          {token.text}
                        </span>
                        {isVisible && isCursorHere ? (
                          <span className="diary-cursor" />
                        ) : null}
                      </span>
                    );
                  }
                  return seenWords > 0 && seenWords <= visibleCount
                    ? token.text
                    : "";
                });
              })()}
            </div>

            <div className="diary-date">
              {currentPage === 0 ? "March 15th, 2023" : ""}
            </div>
          </div>

          <div className="diary-navigation">
            <button className="diary-btn skip-btn" onClick={handleSkip}>
              Skip Intro
            </button>
            <div className="page-indicator">
              {PAGES.map((_, idx) => (
                <div
                  key={idx}
                  className={`page-dot ${idx === currentPage ? "active" : ""} ${idx < currentPage ? "completed" : ""}`}
                />
              ))}
            </div>
            <button className="diary-btn next-btn" onClick={handleNext}>
              {currentPage < PAGES.length - 1 ? "Next →" : "Begin Journey"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
