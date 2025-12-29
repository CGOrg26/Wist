// client/src/components/MainMenu.jsx
import React, { useState, useEffect, useMemo } from "react";
import "./MainMenu.css";

import familyFull from "../assets/menu.jpeg";
import dadRemoved from "../assets/dad_removed.png";
import houseRemoved from "../assets/house_removed.png";

export default function MainMenu({
  onPlay,
  onNewGame,
  onJoinGame,
  onBack,
  user,
  authMode,
  authForm,
  authError,
  onAuthChange,
  onAuthSubmit,
  onToggleAuthMode,
  onLogout,
  chapter,
  onChapterChange,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [memoryPhase, setMemoryPhase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(!!user);

  // Handle smooth transition when user logs in
  useEffect(() => {
    if (user && !showMainMenu) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowMainMenu(true);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 600);
    } else if (!user && showMainMenu) {
      setIsTransitioning(true);
      setTimeout(() => {
        setShowMainMenu(false);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 100);
      }, 600);
    }
  }, [user, showMainMenu]);

  useEffect(() => {
    if (!user) return;
    const timer1 = setTimeout(() => setMemoryPhase(1), 6000);
    const timer2 = setTimeout(() => setMemoryPhase(2), 12000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [user]);

  const menuItems = useMemo(() => {
    if (!user) return [];
    const list = [];
    if (onPlay) list.push({ key: "continue", label: "Continue Game", onClick: onPlay });
    if (onNewGame) list.push({ key: "new", label: "New Game", onClick: onNewGame });
    if (onJoinGame) list.push({ key: "join", label: "Join Game", onClick: onJoinGame });
    if (onBack) list.push({ key: "back", label: "Back", onClick: onBack });
    return list;
  }, [user, onPlay, onNewGame, onJoinGame, onBack]);

  useEffect(() => {
    if (!user || menuItems.length === 0) return;
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setActiveIndex((i) => (i - 1 + menuItems.length) % menuItems.length);
      }
      if (e.key === "ArrowRight") {
        setActiveIndex((i) => (i + 1) % menuItems.length);
      }
      if (e.key === "Enter") {
        menuItems[activeIndex]?.onClick?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [user, menuItems, activeIndex]);

  useEffect(() => {
    setActiveIndex(0);
  }, [user]);

  // ============= LOBBY =============
  if (!showMainMenu) {
    return (
      <div className={`main-menu ${isTransitioning ? 'transitioning-out' : ''}`}>
        <div className="menu-background">
          <div className="bg-clouds">
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="cloud cloud-3"></div>
          </div>

          <div className="memory-particles">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 8}s`,
                  animationDuration: `${6 + Math.random() * 6}s`,
                }}
              />
            ))}
          </div>

          <div className="game-title">
            <h1 className="title-text">WIST</h1>
            <p className="subtitle">A journey through fading memories</p>
          </div>

          <div className="auth-panel elevated">
            <div className="auth-decorative-top"></div>
            <div className="auth-decorative-bottom"></div>

            <div className="auth-title">
              {authMode === "login" ? "Welcome Back" : "Begin Your Journey"}
            </div>

            <div className="auth-subtitle">
              {authMode === "login"
                ? "Return to your memories"
                : "Create your story"}
            </div>

            <div className="auth-fields">
              <input
                className="auth-input elevated"
                type="text"
                placeholder="Username"
                value={authForm.username}
                onChange={(e) =>
                  onAuthChange({ ...authForm, username: e.target.value })
                }
                onKeyPress={(e) => e.key === 'Enter' && onAuthSubmit()}
              />
              <input
                className="auth-input elevated"
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) =>
                  onAuthChange({ ...authForm, password: e.target.value })
                }
                onKeyPress={(e) => e.key === 'Enter' && onAuthSubmit()}
              />
            </div>

            {authError && <div className="auth-error">{authError}</div>}

            <div className="auth-actions">
              <button className="menu-btn auth-btn elevated" onClick={onAuthSubmit}>
                <span className="btn-text">
                  {authMode === "login" ? "Enter" : "Create Account"}
                </span>
              </button>

              <button className="auth-toggle" onClick={onToggleAuthMode}>
                {authMode === "login"
                  ? "New here? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>

          <div className="menu-decorations">
            <div className="crystal-glow crystal-left"></div>
            <div className="crystal-glow crystal-right"></div>
          </div>
        </div>
      </div>
    );
  }

  // ============= MAIN MENU =============
  return (
    <div className={`dark-memory-menu ${isTransitioning ? 'transitioning-in' : ''}`}>
      {/* Deep atmospheric background */}
      <div className="void-bg">
        <div className="deep-gradient"></div>
        <div className="atmosphere-fog"></div>
      </div>

      {/* Floating embers */}
      <div className="embers-container" aria-hidden="true">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="ember"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 8}s`,
            }}
          />
        ))}
      </div>

      {/* Memory spotlight */}
      <div className="memory-spotlight">
        <div className="spotlight-beam"></div>
        
        <div className="drawing-frame elevated">
          <div className="frame-glow"></div>
          
          <div className="memory-image">
            <img className="img-layer base-layer" src={houseRemoved} alt="" />
            <img className="img-layer mid-layer" src={dadRemoved} alt="" />
            <img className="img-layer top-layer" src={familyFull} alt="" />
            
            <div className="darkness-overlay overlay-1"></div>
            <div className="darkness-overlay overlay-2"></div>
          </div>
        </div>

        {/* Phase indicators */}
        <div className="phase-indicators">
          <div className={`phase-dot elevated ${memoryPhase >= 0 ? 'active' : ''}`}>
            <span className="phase-label">Complete</span>
          </div>
          <div className={`phase-dot elevated ${memoryPhase >= 1 ? 'active' : ''}`}>
            <span className="phase-label">Broken</span>
          </div>
          <div className={`phase-dot elevated ${memoryPhase >= 2 ? 'active' : ''}`}>
            <span className="phase-label">Lost</span>
          </div>
        </div>
      </div>

      {/* Story captions */}
      <div className="memory-captions">
        <div className={`caption elevated ${memoryPhase >= 1 ? 'visible' : ''}`}>
          <p>"He left us behind..."</p>
        </div>
        <div className={`caption elevated ${memoryPhase >= 2 ? 'visible' : ''}`}>
          <p>"And took our home with him."</p>
        </div>
      </div>

      {/* Title */}
      <div className="elegant-title">
        <h1 className="wist-glow">WIST</h1>
        <div className="title-line"></div>
        <p className="tagline">A memory that won't fade</p>
      </div>

      {/* Chapter selector */}
      <div className="chapter-pills">
        <button
          className={`pill elevated ${chapter === 1 ? "active" : ""}`}
          onClick={() => onChapterChange(1)}
        >
          <span className="pill-num">01</span>
          <span className="pill-name">Innocence</span>
        </button>
        <button
          className={`pill elevated ${chapter === 2 ? "active" : ""}`}
          onClick={() => onChapterChange(2)}
        >
          <span className="pill-num">02</span>
          <span className="pill-name">Anger</span>
        </button>
      </div>

      {/* Main menu */}
      <nav className="sleek-nav elevated">
        <div className="nav-container">
          {menuItems.map((item, idx) => (
            <button
              key={item.key}
              className={`nav-item ${idx === activeIndex ? "active" : ""}`}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={item.onClick}
              type="button"
            >
              <span className="nav-glow"></span>
              <span className="nav-text">{item.label}</span>
              <span className="nav-arrow">→</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="cinematic-vignette"></div>
    </div>
  );
}