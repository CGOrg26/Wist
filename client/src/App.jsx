import { useEffect, useMemo, useRef, useState } from "react";
import GameCanvas from "./components/GameCanvas.jsx";
import { NetworkClient } from "./network/NetworkClient.js";

import GameDialog from "./components/GameDialog.jsx";
import GameStatusBar from "./components/GameStatusBar.jsx";
import MainMenu from "./components/MainMenu.jsx";
import CongratulationsPage from "./components/CongratulationsPage.jsx";
import ChapterTransition from "./components/ChapterTransition.jsx";
import DiaryEntry from "./components/DiaryEntry.jsx";

function App() {
  const [screen, setScreen] = useState("mainMenu"); // "mainMenu" | "lobby" | "waiting" | "game"
  const [prevScreen, setPrevScreen] = useState("mainMenu");
  const [connected, setConnected] = useState(false);

  const [roomIdInput, setRoomIdInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState(null); // "host" or "client"

  const [world, setWorld] = useState(null);
  const [puzzleState, setPuzzleState] = useState(null);
  const [objects, setObjects] = useState(null);
  const [playerPositions, setPlayerPositions] = useState(null);
  const [players, setPlayers] = useState({ host: null, client: null });
  const playerCount = (players?.host ? 1 : 0) + (players?.client ? 1 : 0);

  const [isPaused, setIsPaused] = useState(false);
  const [hasExitedGame, setHasExitedGame] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  // Determine API base URL based on environment
  const getApiBase = () => {
    const hostname = window.location.hostname;
    if (hostname.includes("railway") || hostname.includes("production") || hostname !== "localhost") {
      return "https://wist-back-production.up.railway.app";
    }
    return "http://localhost:3000";
  };
  const API_BASE = getApiBase();
  
  // Initialize user from localStorage if exists (persistent login)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('wist_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [invites, setInvites] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [inviteTarget, setInviteTarget] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [gameChapter, setGameChapter] = useState(1);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showChapterTransition, setShowChapterTransition] = useState(false);
  const [completedChapter, setCompletedChapter] = useState(null);

  // Track completed chapters and show diary on first login
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [showDiary, setShowDiary] = useState(false);
  const [hasSeenDiary, setHasSeenDiary] = useState(false);
  const isChapter2Unlocked = completedChapters.has(1);

  // Lobby sub-modes:
  // home => 4 bottom buttons only
  // continue => list saved games + rejoin
  // join => input room code + join
  const [lobbyMode, setLobbyMode] = useState("home");

  // Invite popup modal
  const [invitePopup, setInvitePopup] = useState({
    open: false,
    roomId: "",
    hostUserId: null,
    hostUsername: "",
  });

  const screenRef = useRef(screen);
  const lastChapterCompleteTokenRef = useRef(0);
  const handledChaptersRef = useRef(new Set());
  const network = useMemo(() => new NetworkClient(), []);

  const refreshGames = async () => {
    if (!user) return;
    const res = await fetch(`${API_BASE}/api/games?userId=${user.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveGames(data.games || []);
  };

  const refreshInvites = async () => {
    if (!user) return;
    const res = await fetch(`${API_BASE}/api/invites?userId=${user.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setInvites(data.invites || []);
  };

  const handleAuthSubmit = async () => {
    setAuthError("");
    if (!authForm.username || !authForm.password) {
      setAuthError("Username and password required");
      return;
    }

    const endpoint = authMode === "login" ? "login" : "register";
    const res = await fetch(`${API_BASE}/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authForm),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAuthError(data.message || "Authentication failed");
      return;
    }

    setUser(data);
    // Save user to localStorage for persistent login
    localStorage.setItem('wist_user', JSON.stringify(data));
    setAuthForm({ username: "", password: "" });

    // Show diary on first login if user hasn't seen it
    const diaryKey = `hasSeenDiary_${data.id}`;
    const seenDiary = localStorage.getItem(diaryKey);
    if (authMode === "register" || !seenDiary) {
      setShowDiary(true);
    }
  };

  const handleLogout = () => {
    network.disconnect();
    network.setUser(null);
    setUser(null);
    // Clear user from localStorage on explicit logout
    localStorage.removeItem('wist_user');
    setAuthForm({ username: "", password: "" });
    setAuthError("");
    setRoomId("");
    setRoomIdInput("");
    setLobbyMode("home");
    setScreen("mainMenu");
  };

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    handledChaptersRef.current = new Set();
  }, [roomId]);

  useEffect(() => {
    // game created - host waits for second player
    network.on("gameCreated", ({ roomId, role }) => {
      setRole(role);
      setRoomId(roomId);
      setConnected(true);
      setPlayers({ host: network.playerId, client: null });
      setScreen("waiting");
      setHasExitedGame(false);
      setInviteStatus("");
      setInviteTarget("");
    });

    // somebody joined (fires on both host + client)
    network.on("playerJoined", ({ roomId, players }) => {
      setPlayers(players);
      console.log("Joined room", roomId, "players:", players);

      const count = (players?.host ? 1 : 0) + (players?.client ? 1 : 0);
      if (count === 2) {
        setPrevScreen(screenRef.current);
        setScreen("game");
      }
    });

    // initial world & puzzle state
    network.on(
      "roomState",
      ({ world, puzzleState, objects, playerPositions }) => {
        if (world !== undefined) setWorld(world);
        if (puzzleState !== undefined) setPuzzleState(puzzleState);
        if (objects !== undefined) setObjects(objects);
        if (playerPositions !== undefined) setPlayerPositions(playerPositions);
        if (puzzleState?.chapter) setGameChapter(puzzleState.chapter);

        console.log("Room state received:", {
          world,
          puzzleState,
          objects,
          playerPositions,
        });
      }
    );

    network.on("puzzleStateChanged", (puzzleState) => {
      setPuzzleState(puzzleState);
      if (puzzleState?.chapter) setGameChapter(puzzleState.chapter);
    });

    network.on("playerLeft", ({ leftPlayerId, players }) => {
      setPlayers(players || { host: null, client: null });
      console.log("Player left:", leftPlayerId, "remaining:", players);
    });

    network.on("joinError", ({ message }) => {
      setDialog({ open: true, title: "Join Error", message });
    });

    network.on("roleAssigned", ({ role }) => {
      setRole(role);
      setConnected(true);
      setHasExitedGame(false);
    });

    network.on("createError", ({ message }) => {
      setDialog({ open: true, title: "Create Error", message });
    });

    network.on("gameClosed", ({ roomId }) => {
      setDialog({
        open: true,
        title: "Game Closed",
        message: `Room ${roomId} was closed by the host.`,
      });
      handleBackToMainMenu();
    });

    network.on("inviteError", ({ message }) => {
      setDialog({ open: true, title: "Invite Error", message });
    });

    network.on("inviteSent", ({ invitedUsername }) => {
      setInviteStatus(`Invite sent to ${invitedUsername}`);
      setInviteTarget("");
      refreshInvites();
    });

    // INVITE POPUP
    network.on("inviteReceived", ({ roomId, hostUserId, hostUsername }) => {
      setInvites((prev) => {
        if (prev.some((invite) => invite.room_id === roomId)) return prev;
        const nextInvite = {
          room_id: roomId,
          host_user_id: hostUserId,
          host_username: hostUsername,
          updated_at: new Date().toISOString(),
        };
        return [nextInvite, ...prev];
      });

      setInvitePopup({
        open: true,
        roomId,
        hostUserId,
        hostUsername,
      });
    });
  }, [network]);

  useEffect(() => {
    if (!user) return;
    network.setUser(user);
    refreshGames();
    refreshInvites();
  }, [user, network]);

  // Menu navigation handlers
  const handlePlayFromMainMenu = () => {
    if (!user) {
      setDialog({
        open: true,
        title: "Login required",
        message: "Please login to start playing.",
      });
      return;
    }
    refreshGames();
    refreshInvites();
    setLobbyMode("home");
    setScreen("lobby");
  };

  const handleBackToMainMenu = () => {
    if (connected) {
      network.disconnect();
    }

    setScreen("mainMenu");
    setConnected(false);
    setRole(null);
    setRoomId("");
    setRoomIdInput("");
    setIsPaused(false);
    setWorld(null);
    setPuzzleState(null);
    setObjects(null);
    setPlayerPositions(null);
    setPlayers({ host: null, client: null });
    setHasExitedGame(false);

    setLobbyMode("home");
    setInviteTarget("");
    setInviteStatus("");
  };

  const handleCreate = () => {
    if (!user) {
      setDialog({
        open: true,
        title: "Login required",
        message: "Please login to create a game.",
      });
      return;
    }
    network.createGame({ chapter: selectedChapter });
  };

  const handleJoin = () => {
    if (!user) {
      setDialog({
        open: true,
        title: "Login required",
        message: "Please login to join a game.",
      });
      return;
    }
    if (!roomIdInput.trim()) {
      setDialog({
        open: true,
        title: "Missing Room ID",
        message: "Please enter a valid Room ID to join.",
      });
      return;
    }
    network.joinGame(roomIdInput.trim());
  };

  const handleAcceptInvite = async (inviteRoomId) => {
    if (!user) return;
    const res = await fetch(`${API_BASE}/api/accept-invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, roomId: inviteRoomId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDialog({
        open: true,
        title: "Invite Error",
        message: data.message || "Failed to accept invite",
      });
      return;
    }
    refreshInvites();
    refreshGames();
    network.joinGame(inviteRoomId);
  };

  const handleRejoinGame = (gameRoomId) => {
    if (connected && roomId === gameRoomId) {
      setScreen("game");
      return;
    }
    network.joinGame(gameRoomId);
  };

  const handleSendInvite = () => {
    if (!inviteTarget.trim()) {
      setDialog({
        open: true,
        title: "Invite Error",
        message: "Please enter a username to invite.",
      });
      return;
    }
    if (!roomId) {
      setDialog({
        open: true,
        title: "Invite Error",
        message: "Create a room first.",
      });
      return;
    }
    network.sendInvite({
      roomId,
      inviteUsername: inviteTarget.trim(),
    });
  };

  // LOBBY button behavior
  const handleContinueGame = async () => {
    if (!user) {
      setDialog({
        open: true,
        title: "Login required",
        message: "Please login to continue a game.",
      });
      return;
    }
    await refreshGames();
    setLobbyMode("continue");
  };

  // ✅ NEW GAME: immediately create + show WAITING screen (not a "Create Room" section)
  const handleLobbyNewGame = () => {
    if (!user) {
      setDialog({
        open: true,
        title: "Login required",
        message: "Please login to create a game.",
      });
      return;
    }
    // clear invite UI
    setInviteTarget("");
    setInviteStatus("");
    // create the game -> network.on("gameCreated") will move to screen="waiting"
    handleCreate();
  };

  const handleLobbyJoinGame = () => {
    if (!user) {
      setDialog({
        open: true,
        title: "Login required",
        message: "Please login to join a game.",
      });
      return;
    }
    setLobbyMode("join");
  };

  const handleLobbyBack = () => {
    if (screen === "lobby" && lobbyMode !== "home") {
      setLobbyMode("home");
      return;
    }
    handleBackToMainMenu();
  };

  const handleExitGame = () => {
    const currentRoomId = roomId;
    const isHostExit = role === "host";

    if (isHostExit) {
      network.exitGame();
      network.disconnect();

      setScreen("lobby");
      setConnected(false);
      setRole(null);

      setRoomIdInput("");
      setRoomId("");

      setIsPaused(false);
      setWorld(null);
      setPuzzleState(null);
      setObjects(null);
      setPlayerPositions(null);
      setPlayers({ host: null, client: null });
      setHasExitedGame(false);

      setLobbyMode("home");
      return;
    }

    setScreen(prevScreen);
    setIsPaused(false);
    setRoomIdInput(currentRoomId);
    setHasExitedGame(true);
  };

  const handleBackFromGame = () => {
    setScreen(prevScreen);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const getGameLevel = (game) => game?.last_level ?? null;

  // Function to show congratulations screen when a chapter is completed
  const handleChapterComplete = (chapterNum) => {
    if (handledChaptersRef.current.has(chapterNum)) {
      return;
    }
    handledChaptersRef.current.add(chapterNum);

    setCompletedChapter(chapterNum);
    setShowCongrats(true);

    // Mark chapter as completed
    setCompletedChapters(prev => {
      const newSet = new Set(prev);
      newSet.add(chapterNum);
      // Store in localStorage
      if (user) {
        localStorage.setItem(`completedChapters_${user.id}`, JSON.stringify([...newSet]));
      }
      return newSet;
    });
  };

  useEffect(() => {
    const token = puzzleState?.chapterCompleteToken;
    const chapter = puzzleState?.chapterCompleted;
    if (
      typeof token === "number" &&
      token !== lastChapterCompleteTokenRef.current &&
      typeof chapter === "number"
    ) {
      if (showCongrats && completedChapter === chapter) {
        lastChapterCompleteTokenRef.current = token;
        return;
      }
      lastChapterCompleteTokenRef.current = token;
      handleChapterComplete(chapter);
    }
  }, [puzzleState, showCongrats, completedChapter]);

  // Function to continue after congratulations
  const handleContinueFromCongrats = () => {
    setShowCongrats(false);
    if (completedChapter === 1) {
      setShowChapterTransition(true);
      return;
    }
    setCompletedChapter(null);
    setScreen("lobby");
    setLobbyMode("home");
  };

  const handleChapterTransitionComplete = () => {
    setShowChapterTransition(false);
    setCompletedChapter(null);
    setSelectedChapter(2);
    setGameChapter(2);
    network.sendPuzzleUpdate({
      chapter: 2,
      levelReached: 1,
      respawnToken: Date.now(),
      respawnLevel: 1,
    });
  };

  // Function to handle diary completion
  const handleDiaryComplete = () => {
    setShowDiary(false);
    if (user) {
      localStorage.setItem(`hasSeenDiary_${user.id}`, "true");
    }
  };

  // Load completed chapters from localStorage when user logs in
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`completedChapters_${user.id}`);
      if (stored) {
        try {
          const chapters = JSON.parse(stored);
          setCompletedChapters(new Set(chapters));
        } catch (e) {
          console.error("Failed to load completed chapters", e);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isChapter2Unlocked && selectedChapter === 2) {
      setSelectedChapter(1);
    }
  }, [isChapter2Unlocked, selectedChapter]);

  // Expose handleChapterComplete globally for game levels to call
  useEffect(() => {
    window.showChapterComplete = handleChapterComplete;
    return () => {
      delete window.showChapterComplete;
    };
  }, []);

  return (
    <>
      {/* Main Menu + Lobby merged */}
      {(screen === "mainMenu" || screen === "lobby") && (
        <MainMenu
          onPlay={handlePlayFromMainMenu}
          user={user}
          authMode={authMode}
          authForm={authForm}
          authError={authError}
          onAuthChange={setAuthForm}
          onAuthSubmit={handleAuthSubmit}
          onToggleAuthMode={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
          onLogout={handleLogout}
          chapter={selectedChapter}
          onChapterChange={(nextChapter) => {
            if (nextChapter === 2 && !isChapter2Unlocked) {
              setDialog({
                open: true,
                title: "Chapter Locked",
                message: "Complete Chapter 1 to unlock Chapter 2.",
              });
              setSelectedChapter(1);
              return;
            }
            setSelectedChapter(nextChapter);
          }}
          completedChapters={completedChapters}
          // Lobby-related props
          lobbyMode={lobbyMode}
          onContinueGame={handleContinueGame}
          onLobbyNewGame={handleLobbyNewGame}
          onLobbyJoinGame={handleLobbyJoinGame}
          onLobbyBack={handleLobbyBack}
          activeGames={activeGames}
          onRejoinGame={handleRejoinGame}
          roomIdInput={roomIdInput}
          onRoomIdInputChange={setRoomIdInput}
          onJoinSubmit={handleJoin}
          invitePopup={invitePopup}
          onInviteDecline={() => setInvitePopup((p) => ({ ...p, open: false }))}
          onInviteAccept={(rid) => {
            setInvitePopup((p) => ({ ...p, open: false }));
            handleAcceptInvite(rid);
          }}
          getGameLevel={getGameLevel}
        />
      )}

      {/* Waiting Screen - Dark Cinematic Theme */}
      {screen === "waiting" && (
        <MainMenu
          user={user}
          authMode={authMode}
          authForm={authForm}
          authError={authError}
          onAuthChange={setAuthForm}
          onAuthSubmit={handleAuthSubmit}
          onToggleAuthMode={() =>
            setAuthMode(authMode === "login" ? "register" : "login")
          }
          onLogout={handleLogout}
          chapter={selectedChapter}
          onChapterChange={(nextChapter) => {
            if (nextChapter === 2 && !isChapter2Unlocked) {
              setDialog({
                open: true,
                title: "Chapter Locked",
                message: "Complete Chapter 1 to unlock Chapter 2.",
              });
              setSelectedChapter(1);
              return;
            }
            setSelectedChapter(nextChapter);
          }}
          completedChapters={completedChapters}
          waitingScreen={true}
          roomId={roomId}
          inviteTarget={inviteTarget}
          onInviteTargetChange={setInviteTarget}
          onSendInvite={handleSendInvite}
          inviteStatus={inviteStatus}
          onBackToLobby={() => {
            setScreen("lobby");
            setLobbyMode("home");
          }}
        />
      )}

      {/* Game Dialog */}
      <GameDialog
        dialog={dialog}
        isWaitingForSecondPlayer={false}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
      />

      {/* Game Canvas */}
      {screen === "game" && connected && (
        <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
          <GameCanvas
            network={network}
            role={role}
            world={world}
            puzzleState={puzzleState}
            objects={objects}
            playerPositions={playerPositions}
            chapter={gameChapter}
          />

          {/* Game Controls Overlay */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "0",
              right: "0",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            <button
              onClick={togglePause}
              style={{
                padding: "12px 20px",
                fontSize: "20px",
                fontWeight: "bold",
                background: isPaused
                  ? "linear-gradient(135deg, #8a77ff 0%, #a68fff 100%)"
                  : "linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)",
                color: "white",
                border: "3px solid",
                borderColor: isPaused ? "rgba(138, 119, 255, 0.6)" : "rgba(255, 140, 66, 0.6)",
                borderRadius: "14px",
                cursor: "pointer",
                boxShadow: isPaused
                  ? "0 4px 15px rgba(138, 119, 255, 0.4), 0 6px 20px rgba(0,0,0,0.3)"
                  : "0 4px 15px rgba(255, 107, 53, 0.4), 0 6px 20px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              <span style={{ fontSize: "24px" }}>{isPaused ? "▶️" : "⏸️"}</span>
              <span>{isPaused ? "RESUME" : "PAUSE"}</span>
            </button>

            <button
              onClick={handleBackFromGame}
              style={{
                padding: "12px 20px",
                fontSize: "20px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #6a5acd 0%, #7b68ee 100%)",
                color: "white",
                border: "3px solid rgba(106, 90, 205, 0.6)",
                borderRadius: "14px",
                cursor: "pointer",
                boxShadow:
                  "0 4px 15px rgba(106, 90, 205, 0.4), 0 6px 20px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              <span>BACK</span>
            </button>

            <button
              onClick={handleExitGame}
              style={{
                padding: "12px 20px",
                fontSize: "20px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #ff4757 0%, #ff6348 100%)",
                color: "white",
                border: "3px solid rgba(255, 71, 87, 0.6)",
                borderRadius: "14px",
                cursor: "pointer",
                boxShadow:
                  "0 4px 15px rgba(255, 71, 87, 0.4), 0 6px 20px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease",
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              <span style={{ fontSize: "24px" }}>🚪</span>
              <span>EXIT</span>
            </button>
          </div>

          {isPaused && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 999,
                backdropFilter: "blur(5px)",
              }}
            >
              <h1
                style={{
                  fontSize: "72px",
                  fontWeight: 900,
                  color: "white",
                  textShadow: "4px 4px 0 rgba(0,0,0,0.5)",
                  marginBottom: "2rem",
                }}
              >
                ⏸️ PAUSED
              </h1>
              <p
                style={{
                  fontSize: "24px",
                  color: "white",
                  textShadow: "2px 2px 0 rgba(0,0,0,0.5)",
                }}
              >
                Click RESUME to continue playing
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status Bar */}
      <GameStatusBar
        connected={connected}
        network={network}
        role={role}
        playerCount={playerCount}
      />

      {/* Congratulations Screen */}
      {showCongrats && (
        <CongratulationsPage
          chapterNumber={completedChapter}
          onContinue={handleContinueFromCongrats}
        />
      )}

      {showChapterTransition && (
        <ChapterTransition
          nextChapterNumber={2}
          onComplete={handleChapterTransitionComplete}
        />
      )}

      {/* Diary Entry - Shows on first login */}
      {showDiary && (
        <DiaryEntry onComplete={handleDiaryComplete} />
      )}
    </>
  );
}

export default App;
