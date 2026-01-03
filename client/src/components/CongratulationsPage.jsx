import React, { useEffect, useState } from "react";
import "./CongratulationsPage.css";

const CHAPTER_NAMES = {
  1: "Denial",
  2: "Anger",
  3: "Bargaining",
  4: "Depression",
  5: "Acceptance",
};

export default function CongratulationsPage({
  chapterNumber,
  onContinue,
  onBackToLobby,
}) {
  const [showContent, setShowContent] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showMemories, setShowMemories] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 300);
    const t2 = setTimeout(() => setShowKey(true), 1200);
    const t3 = setTimeout(() => setShowMemories(true), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="congrats-screen">
      {/* Floating memory orbs */}
      <div className="memory-orbs-container" aria-hidden="true">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="memory-orb"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 6}s`,
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
            }}
          />
        ))}
      </div>

      {/* Flying white dots (stars) */}
      <div className="stars-container" aria-hidden="true">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Background */}
      <div className="congrats-bg">
        <div className="congrats-gradient"></div>
        <div className="radial-waves"></div>
      </div>

      {/* Main content */}
      <div className={`congrats-content ${showContent ? "visible" : ""}`}>
        {/* Ornate header */}
        <div className="completion-header">
          <div className="header-ornament left"></div>
          <div className="chapter-badge">
            <div className="badge-ring"></div>
            <div className="badge-number">{chapterNumber}</div>
          </div>
          <div className="header-ornament right"></div>
        </div>

        <h1 className="congrats-title">Memory Preserved</h1>

        <div className="congrats-message">
          <p className="congrats-chapter-name">{CHAPTER_NAMES[chapterNumber]}</p>
          <p className="congrats-subtext">has been acknowledged and embraced</p>
        </div>

        {/* SVG Key with ornate design */}
        <div className={`key-collection ${showKey ? "visible" : ""}`}>
          <svg className="ornate-key" viewBox="0 0 200 80" width="240" height="96">
            <defs>
              <linearGradient id="keyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="50%" stopColor="#ffed4e" />
                <stop offset="100%" stopColor="#ff8c42" />
              </linearGradient>
              <filter id="ornateGlow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Key head - ornate circular design */}
            <circle cx="40" cy="40" r="22" fill="none" stroke="url(#keyGrad)" strokeWidth="3" filter="url(#ornateGlow)"/>
            <circle cx="40" cy="40" r="16" fill="none" stroke="url(#keyGrad)" strokeWidth="2"/>
            <circle cx="40" cy="40" r="10" fill="none" stroke="url(#keyGrad)" strokeWidth="2"/>

            {/* Decorative spokes */}
            <line x1="40" y1="18" x2="40" y2="28" stroke="url(#keyGrad)" strokeWidth="2"/>
            <line x1="40" y1="52" x2="40" y2="62" stroke="url(#keyGrad)" strokeWidth="2"/>
            <line x1="18" y1="40" x2="28" y2="40" stroke="url(#keyGrad)" strokeWidth="2"/>
            <line x1="52" y1="40" x2="62" y2="40" stroke="url(#keyGrad)" strokeWidth="2"/>

            {/* Key shaft */}
            <rect x="58" y="37" width="100" height="6" fill="url(#keyGrad)" filter="url(#ornateGlow)" rx="3"/>

            {/* Decorative shaft details */}
            <circle cx="90" cy="40" r="5" fill="url(#keyGrad)"/>
            <circle cx="120" cy="40" r="5" fill="url(#keyGrad)"/>

            {/* Key teeth - ornate pattern */}
            <rect x="155" y="30" width="5" height="13" fill="url(#keyGrad)" rx="1"/>
            <rect x="165" y="26" width="5" height="17" fill="url(#keyGrad)" rx="1"/>
            <rect x="175" y="30" width="5" height="13" fill="url(#keyGrad)" rx="1"/>
            <rect x="185" y="34" width="5" height="9" fill="url(#keyGrad)" rx="1"/>
          </svg>

          <div className="key-label">Essence of {CHAPTER_NAMES[chapterNumber]}</div>
          <div className="key-particles">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="key-particle"
                style={{
                  '--particle-angle': `${(i * 360) / 8}deg`,
                  '--particle-delay': `${i * 0.15}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Progress tracker */}
        <div className={`congrats-progress ${showMemories ? "visible" : ""}`}>
          <div className="progress-label">Journey Progress</div>

          <div className="progress-path">
            <svg className="path-line" viewBox="0 0 400 100" preserveAspectRatio="none">
              <path
                d="M 0 50 Q 100 20, 200 50 T 400 50"
                fill="none"
                stroke="rgba(138, 119, 255, 0.3)"
                strokeWidth="2"
              />
              <path
                className="path-progress"
                d="M 0 50 Q 100 20, 200 50 T 400 50"
                fill="none"
                stroke="url(#progressGrad)"
                strokeWidth="3"
                strokeDasharray="1000"
                strokeDashoffset="1000"
                style={{
                  strokeDashoffset: `${1000 - (chapterNumber / 5) * 1000}`
                }}
              />
              <defs>
                <linearGradient id="progressGrad">
                  <stop offset="0%" stopColor="#8a77ff" />
                  <stop offset="100%" stopColor="#ff6b35" />
                </linearGradient>
              </defs>
            </svg>

            <div className="keys-display">
              {[1, 2, 3, 4, 5].map((keyNum) => (
                <div
                  key={keyNum}
                  className={`key-node ${keyNum <= chapterNumber ? "collected" : ""} ${keyNum === chapterNumber ? "current" : ""}`}
                  style={{ '--node-index': keyNum - 1 }}
                >
                  <div className="node-ring"></div>
                  <div className="node-core"></div>
                  <div className="node-label">{CHAPTER_NAMES[keyNum]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="buttons-row">
          <button className="congrats-continue-btn" onClick={onContinue}>
            <span className="btn-shimmer"></span>
            <span className="btn-text">Continue</span>
          </button>

          {onBackToLobby && (
            <button className="congrats-lobby-btn" onClick={onBackToLobby}>
              <span className="btn-text">Back to Lobby</span>
            </button>
          )}
        </div>
      </div>

      <div className="congrats-vignette"></div>
    </div>
  );
}
