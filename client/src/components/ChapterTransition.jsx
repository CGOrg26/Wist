import React, { useEffect, useRef, useState } from "react";
import "./ChapterTransition.css";

const CHAPTER_NAMES = {
  1: "Denial",
  2: "Anger",
  3: "Bargaining",
  4: "Depression",
  5: "Acceptance",
};

export default function ChapterTransition({ nextChapterNumber, onComplete }) {
  const [show, setShow] = useState(false);
  const [keyAnimating, setKeyAnimating] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (onComplete) onComplete();
  };

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 120);
    const t2 = setTimeout(() => setKeyAnimating(true), 600);
    const t3 = setTimeout(() => setUnlocking(true), 1800);
    const t4 = setTimeout(() => setUnlocked(true), 2200);
    const t5 = setTimeout(() => finish(), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  return (
    <div className="chapter-transition">
      <div className="transition-bg">
        <div className="transition-glow"></div>
        <div className="transition-shimmer"></div>

        {unlocking && (
          <>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  '--angle': `${(i * 360) / 20}deg`,
                  '--delay': `${i * 0.05}s`
                }}
              />
            ))}
          </>
        )}
      </div>

      <div className={`transition-content ${show ? "visible" : ""} ${unlocked ? "unlocked" : ""}`}>
        <div className={`key-container ${keyAnimating ? "animating" : ""} ${unlocking ? "unlocking" : ""}`}>
          <svg className="key-icon" viewBox="0 0 100 100" width="120" height="120">
            <defs>
              <linearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#ffed4e" />
                <stop offset="100%" stopColor="#ff8c42" />
              </linearGradient>
              <filter id="keyGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <circle cx="30" cy="50" r="15" fill="none" stroke="url(#keyGradient)" strokeWidth="4" filter="url(#keyGlow)"/>
            <circle cx="30" cy="50" r="8" fill="none" stroke="url(#keyGradient)" strokeWidth="2"/>

            <rect x="42" y="47" width="40" height="6" fill="url(#keyGradient)" filter="url(#keyGlow)" rx="2"/>

            <rect x="70" y="42" width="6" height="8" fill="url(#keyGradient)"/>
            <rect x="78" y="42" width="6" height="8" fill="url(#keyGradient)"/>
            <rect x="78" y="50" width="6" height="6" fill="url(#keyGradient)"/>
          </svg>

          <div className="key-shine"></div>
        </div>

        <div className="transition-label">Unlocking Memory</div>
        <h2 className="transition-title">
          Chapter {nextChapterNumber}: {CHAPTER_NAMES[nextChapterNumber] || "Unknown"}
        </h2>
        <p className="transition-subtitle">
          {unlocking ? "The path forward reveals itself..." : "Steeling your heart for what comes next..."}
        </p>

        <button className="transition-btn" type="button" onClick={finish}>
          Continue
        </button>
      </div>
    </div>
  );
}
