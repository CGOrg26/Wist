// player/PlayerCheckpoints.js
import { PLAYER_LIMITS } from "./PlayerConfig.js";

/**
 * Handles:
 *  - Level checkpoints (update puzzle level when crossing Z threshold)
 *  - Falling below FALL_LIMIT (trigger respawn for both players)
 *
 * Returns true if Player.update() should early-return and NOT apply newPos.
 */
export function handleCheckpointsAndRespawn(player, newPos) {
  const { network } = player;
  if (!network) {
    // If no network, nothing to sync; just allow movement
    return false;
  }

  const currentZ = newPos.z;

  // ───── Checkpoint: Level 2  ─────
  if (currentZ < PLAYER_LIMITS.LEVEL2_Z_THRESHOLD && !player._reachedLevel2) {
    player._reachedLevel2 = true;
    player.activeLevel = 2;

    network.sendPuzzleUpdate({
      levelReached: 2,
    });
  }

  // ───── Checkpoint: Level 3  ─────
  if (currentZ < PLAYER_LIMITS.LEVEL3_Z_THRESHOLD && !player._reachedLevel3) {
    player._reachedLevel3 = true;
    player.activeLevel = 3;

    network.sendPuzzleUpdate({
      levelReached: 3,
    });
  }

  // ───── Chapter Complete Zone ─────
  // When player reaches the end of level 3 (far negative Z), trigger chapter completion
  // Different thresholds for different chapters
  const chapterNumber = player.chapterNumber || 1;
  const CHAPTER_COMPLETE_THRESHOLDS = {
    1: -220,  // Chapter 1: Trigger after level 3's last platform (~-210)
    2: -245,  // Chapter 2: Trigger after passing the door and exit platform (~-244)
  };
  const CHAPTER_COMPLETE_Z = CHAPTER_COMPLETE_THRESHOLDS[chapterNumber] || -220;

  if (currentZ < CHAPTER_COMPLETE_Z && !player._chapterComplete) {
    player._chapterComplete = true;

    network.sendPuzzleUpdate({
      chapterCompleted: chapterNumber,
      chapterCompleteToken: Date.now(),
    });

    console.log('🎉 Chapter Complete! Z position:', currentZ, 'Chapter:', chapterNumber);

    // Trigger the congratulations screen
    if (typeof window.showChapterComplete === 'function') {
      window.showChapterComplete(chapterNumber);
    }
  }

  // ───── Fall detection ─────
  if (newPos.y < PLAYER_LIMITS.FALL_LIMIT) {
    network.sendPuzzleUpdate({
      respawnToken: Date.now(),
      respawnLevel: typeof player.activeLevel === "number" ? player.activeLevel : 1,
    });

    return true;
  }

  return false;
}
