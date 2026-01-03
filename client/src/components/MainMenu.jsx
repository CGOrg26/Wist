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
  completedChapters,
  // Lobby-related props
  lobbyMode,
  onContinueGame,
  onLobbyNewGame,
  onLobbyJoinGame,
  onLobbyBack,
  activeGames,
  onRejoinGame,
  roomIdInput,
  onRoomIdInputChange,
  onJoinSubmit,
  invitePopup,
  onInviteDecline,
  onInviteAccept,
  getGameLevel,
  // Waiting screen props
  waitingScreen,
  roomId,
  inviteTarget,
  onInviteTargetChange,
  onSendInvite,
  inviteStatus,
  onBackToLobby,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [memoryPhase, setMemoryPhase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(!!user);
  const isChapter2Locked = !completedChapters?.has?.(1);

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
    // Use lobby handlers instead of the old ones
    if (onContinueGame) list.push({ key: "continue", label: "Continue Game", onClick: onContinueGame });
    if (onLobbyNewGame) list.push({ key: "new", label: "New Game", onClick: onLobbyNewGame });
    if (onLobbyJoinGame) list.push({ key: "join", label: "Join Game", onClick: onLobbyJoinGame });
    if (onLogout) list.push({ key: "logout", label: "Logout", onClick: onLogout });
    return list;
  }, [user, onContinueGame, onLobbyNewGame, onLobbyJoinGame, onLogout]);

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
          <span className="pill-name">Denial</span>
        </button>
        <button
          className={`pill elevated ${isChapter2Locked ? "locked" : ""} ${chapter === 2 ? "active" : ""}`}
          onClick={() => onChapterChange(2)}
          disabled={isChapter2Locked}
          aria-disabled={isChapter2Locked}
        >
          <span className="pill-num">02</span>
          <span className="pill-name">Anger</span>
          {isChapter2Locked && <span className="pill-lock">Locked</span>}
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

      {/* Waiting Screen Overlay */}
      {waitingScreen && (
        <div className="waiting-screen-overlay">
          <div className="waiting-panel elevated">
            {/* Animated waiting indicator */}
            <div className="waiting-indicator">
              <div className="waiting-pulse-ring"></div>
              <div className="waiting-pulse-ring delay-1"></div>
              <div className="waiting-pulse-ring delay-2"></div>
              <div className="waiting-icon">⏳</div>
            </div>

            <h2 className="waiting-title">Waiting for Player 2</h2>
            <p className="waiting-subtitle">Share the room code or invite a friend to begin</p>

            {/* Room Code Display */}
            <div className="room-code-section">
              <div className="room-code-label">Room Code</div>
              <div className="room-code-display-box elevated">
                <span className="room-code-value">{roomId}</span>
                <div className="room-code-glow"></div>
              </div>
              <div className="room-code-hint">📋 Share this code with your friend</div>
            </div>

            {/* Divider */}
            <div className="waiting-divider">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            {/* Invite Section */}
            <div className="invite-section-wrapper">
              <div className="invite-section-label">Direct Invite</div>
              <div className="invite-input-wrapper">
                <input
                  className="waiting-input elevated"
                  type="text"
                  placeholder="Enter username..."
                  value={inviteTarget || ""}
                  onChange={(e) => onInviteTargetChange && onInviteTargetChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSendInvite && onSendInvite()}
                />
                <button
                  className="waiting-invite-btn elevated"
                  type="button"
                  onClick={() => onSendInvite && onSendInvite()}
                >
                  <span className="invite-btn-icon">✉️</span>
                  <span className="invite-btn-text">Send</span>
                </button>
              </div>

              {inviteStatus && (
                <div className="invite-status-message">
                  ✓ {inviteStatus}
                </div>
              )}
            </div>

            {/* Back Button */}
            <button
              className="waiting-back-btn"
              type="button"
              onClick={() => onBackToLobby && onBackToLobby()}
            >
              ← Back to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Lobby overlay panels */}
      {lobbyMode && lobbyMode !== "home" && !waitingScreen && (
        <div className="lobby-center-panels" style={{ pointerEvents: "auto" }}>
          {/* CONTINUE VIEW */}
          {lobbyMode === "continue" && (
            <div className="lobby-panel elevated">
              <h2 className="lobby-panel-title">Saved Games</h2>

              {!activeGames || activeGames.length === 0 ? (
                <div className="lobby-empty-message">No saved games found.</div>
              ) : (
                <div className="saved-games-list">
                  {activeGames.map((game) => (
                    <div key={game.room_id} className="saved-game-item">
                      <div className="game-info">
                        <div className="game-room">
                          Room {game.room_id}{" "}
                          {getGameLevel && getGameLevel(game)
                            ? `(Level ${getGameLevel(game)})`
                            : ""}
                        </div>
                        <div className="game-opponent">
                          Opponent: {game.opponent_username || "Waiting"}
                        </div>
                      </div>

                      <button
                        className="menu-btn lobby-action-btn elevated"
                        type="button"
                        onClick={() => onRejoinGame && onRejoinGame(game.room_id)}
                      >
                        <span className="btn-text">Rejoin</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="lobby-back-to-home elevated"
                type="button"
                onClick={() => onLobbyBack && onLobbyBack()}
              >
                Back to Lobby
              </button>
            </div>
          )}

          {/* JOIN GAME VIEW */}
          {lobbyMode === "join" && (
            <div className="lobby-panel elevated">
              <h2 className="lobby-panel-title">Join Game</h2>

              <input
                className="auth-input elevated"
                type="text"
                placeholder="Enter Room Code"
                value={roomIdInput || ""}
                onChange={(e) => onRoomIdInputChange && onRoomIdInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onJoinSubmit && onJoinSubmit()}
              />

              <button
                className="menu-btn auth-btn elevated"
                type="button"
                onClick={() => onJoinSubmit && onJoinSubmit()}
              >
                <span className="btn-text">Join</span>
              </button>

              <button
                className="lobby-back-to-home elevated"
                type="button"
                onClick={() => onLobbyBack && onLobbyBack()}
              >
                Back to Lobby
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invite Popup */}
      {invitePopup && invitePopup.open && (
        <div className="invite-popup-overlay" onClick={onInviteDecline}>
          <div className="invite-popup-panel elevated" onClick={(e) => e.stopPropagation()}>
            <h3 className="invite-popup-title">Game Invite</h3>

            <div className="invite-popup-message">
              <b>{invitePopup.hostUsername || invitePopup.hostUserId}</b>{" "}
              invited you to room <b>{invitePopup.roomId}</b>
            </div>

            <div className="invite-popup-actions">
              <button
                className="auth-toggle"
                type="button"
                onClick={onInviteDecline}
              >
                Decline
              </button>

              <button
                className="menu-btn elevated"
                type="button"
                onClick={() => onInviteAccept && onInviteAccept(invitePopup.roomId)}
              >
                <span className="btn-text">Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cinematic-vignette"></div>
    </div>
  );
}
