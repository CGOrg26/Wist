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
  onBackToLobby, // ✅ new prop
}) {
  const [showContent, setShowContent] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 300);
    const t2 = setTimeout(() => setShowKey(true), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="congrats-screen">
      {/* ✅ Back to Lobby */}
      {onBackToLobby && (
        <button className="back-lobby-btn" onClick={onBackToLobby}>
          ← Back to Lobby
        </button>
      )}

      {/* Confetti particles */}
      <div className="confetti-container" aria-hidden="true">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              backgroundColor: [
                "#8a77ff",
                "#ff6b35",
                "#ff8c42",
                "#a68fff",
                "#ffb347",
                "#c8b8ff",
              ][Math.floor(Math.random() * 6)],
              width: `${5 + Math.random() * 10}px`,
              height: `${5 + Math.random() * 10}px`,
            }}
          />
        ))}
      </div>

      {/* Firework bursts */}
      <div className="fireworks-container" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="firework"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 40}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            {[...Array(12)].map((_, j) => (
              <div
                key={j}
                className="firework-spark"
                style={{ transform: `rotate(${j * 30}deg)` }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Background gradient */}
      <div className="congrats-bg">
        <div className="congrats-gradient"></div>
        <div className="congrats-atmosphere"></div>
      </div>

      {/* Main content */}
      <div className={`congrats-content ${showContent ? "visible" : ""}`}>
        <div className="congrats-trophy">🏆</div>

        <h1 className="congrats-title">Congratulations!</h1>

        <div className="congrats-message">
          <p className="congrats-text">You've completed</p>
          <p className="congrats-chapter">
            Chapter {chapterNumber}: {CHAPTER_NAMES[chapterNumber]}
          </p>
          <p className="congrats-subtext">Another step toward healing</p>
        </div>

        {/* Key Collection Animation */}
        <div className={`key-collection ${showKey ? "visible" : ""}`}>
          <div className="key-icon">🔑</div>
          <div className="key-shine"></div>
          <div className="key-label">Key Obtained!</div>
          <div className="key-description">
            The key to {CHAPTER_NAMES[chapterNumber]} has been added to your
            collection
          </div>
        </div>

        <div className="congrats-progress">
          <div className="progress-label">
            Keys Collected: {chapterNumber} / 5
          </div>

          <div className="keys-display">
            {[1, 2, 3, 4, 5].map((keyNum) => (
              <div
                key={keyNum}
                className={`key-slot ${
                  keyNum <= chapterNumber ? "collected" : ""
                }`}
              >
                {keyNum <= chapterNumber ? "🔑" : "🔒"}
              </div>
            ))}
          </div>
        </div>

        <div className="buttons-row">
          <button className="congrats-continue-btn elevated" onClick={onContinue}>
            <span className="btn-glow"></span>
            <span className="btn-text">Continue Your Journey</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>

      <div className="congrats-vignette"></div>
    </div>
  );
}
