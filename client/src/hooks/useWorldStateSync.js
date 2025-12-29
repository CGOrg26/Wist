import { useEffect, useRef } from "react";
import * as THREE from "three";

const LEVEL_SPAWNS = {
  1: { host: { x: -2, y: 3, z: 0 }, client: { x: 2, y: 3, z: 0 } },
  2: { host: { x: -2, y: 3, z: -80 }, client: { x: 2, y: 3, z: -80 } },
  3: { host: { x: -2, y: 3, z: -140 }, client: { x: 2, y: 3, z: -140 } },
};

// FIX: chapter2 spawn positions separated
const CHAPTER2_SPAWNS = {
  1: { host: { x: -2, y: 3, z: 10 }, client: { x: 2, y: 3, z: 10 } },
  2: { host: { x: -2, y: 3, z: -70 }, client: { x: 2, y: 3, z: -70 } },
  3: { host: { x: -2, y: 3, z: -120 }, client: { x: 2, y: 3, z: -120 } },
};

function getSpawnsForLevel(chapter, level) {
  const chapterNumber = Number(chapter) === 2 ? 2 : 1;
  const lvl = Number(level) || 1;
  if (chapterNumber === 2) return CHAPTER2_SPAWNS[lvl] || CHAPTER2_SPAWNS[1];
  return LEVEL_SPAWNS[lvl] || LEVEL_SPAWNS[1];
}

function getCurrentLevel(puzzleState) {
  return Number(puzzleState?.level ?? puzzleState?.levelReached ?? 1);
}

function resetLocalPhysics(player) {
  if (!player) return;
  if (player.velocity?.set) player.velocity.set(0, 0, 0);
  player.onGround = false;
}

function setTargetPosition(target, x, y, z) {
  if (!target) return;
  if (target.mesh?.position?.set) return target.mesh.position.set(x, y, z);
  if (target.position?.set) target.position.set(x, y, z);
}

function resetBreakable(mesh) {
  const st = mesh?.userData?.initialState;
  if (!st) return;

  mesh.position.copy(st.position);
  mesh.rotation.copy(st.rotation);
  mesh.scale.copy(st.scale);
  mesh.visible = st.visible ?? true;
  if (mesh.material) {
    mesh.material.opacity = 1;
    mesh.material.transparent = false;
  }

  mesh.userData.broken = false;
  mesh.userData.breaking = false;
  mesh.userData.resetAt = Date.now();
}

function shouldResetMeshForRespawn(mesh, chapter, level) {
  if (Number(chapter) !== 2) return true;
  if (typeof mesh.userData?.levelIndex === "number") return mesh.userData.levelIndex === level;
  return false;
}

export function useWorldStateSync({
  roomId,
  world,
  role,
  puzzleState,
  objects,
  playerPositions,
  threeRef,
}) {
  const lastRespawnTokenRef = useRef(null);
  const lastPlacementKeyRef = useRef(null);

  useEffect(() => {
    lastRespawnTokenRef.current = null;
    lastPlacementKeyRef.current = null;
  }, [roomId]);

  // Placement on load + level change
  useEffect(() => {
    const { player, remotePlayer } = threeRef.current || {};
    if (!world || !player || !remotePlayer || !role || !puzzleState) return;

    const chapter = puzzleState.chapter ?? 1;
    const level = getCurrentLevel(puzzleState);
    const key = `${chapter}-${level}`;
    if (player) {
      const current =
        typeof player.activeLevel === "number" ? player.activeLevel : level;
      player.activeLevel = Math.max(current, level);
    }
    if (lastPlacementKeyRef.current === key) return;

    const spawns = getSpawnsForLevel(chapter, level);

    const isFirstPlacement = lastPlacementKeyRef.current === null;
    const hostSaved = isFirstPlacement ? playerPositions?.host : null;
    const clientSaved = isFirstPlacement ? playerPositions?.client : null;

    const hostFinal = hostSaved ?? spawns.host;
    const clientFinal = clientSaved ?? spawns.client;
    const shouldAnimate = false;

    if (!isFirstPlacement) {
      lastPlacementKeyRef.current = key;
      return;
    }

    if (role === "host") {
      if (shouldAnimate && player.startTransition) {
        player.startTransition(new THREE.Vector3(hostFinal.x, hostFinal.y, hostFinal.z));
        remotePlayer.startTransition?.(
          new THREE.Vector3(clientFinal.x, clientFinal.y, clientFinal.z)
        );
      } else {
        setTargetPosition(player, hostFinal.x, hostFinal.y, hostFinal.z);
        setTargetPosition(remotePlayer, clientFinal.x, clientFinal.y, clientFinal.z);
      }
    } else {
      if (shouldAnimate && player.startTransition) {
        player.startTransition(new THREE.Vector3(clientFinal.x, clientFinal.y, clientFinal.z));
        remotePlayer.startTransition?.(
          new THREE.Vector3(hostFinal.x, hostFinal.y, hostFinal.z)
        );
      } else {
        setTargetPosition(player, clientFinal.x, clientFinal.y, clientFinal.z);
        setTargetPosition(remotePlayer, hostFinal.x, hostFinal.y, hostFinal.z);
      }
    }

    if (!shouldAnimate) resetLocalPhysics(player);
    lastPlacementKeyRef.current = key;
  }, [world, role, puzzleState?.chapter, puzzleState?.level, puzzleState?.levelReached, playerPositions, threeRef]);

  // Respawn + reset ONLY current level
  useEffect(() => {
    const { player, remotePlayer, platforms } = threeRef.current || {};
    if (!world || !player || !remotePlayer || !role || !puzzleState) return;

    const token = puzzleState?.respawnToken;
    if (!token) return;
    if (lastRespawnTokenRef.current === token) return;
    lastRespawnTokenRef.current = token;

    const chapter = puzzleState.chapter ?? 1;
    const fallbackLevel = getCurrentLevel(puzzleState);
    const respawnLevel =
      typeof puzzleState?.respawnLevel === "number"
        ? puzzleState.respawnLevel
        : typeof player?.activeLevel === "number"
          ? player.activeLevel
          : fallbackLevel;
    const level = respawnLevel;
    const spawns = getSpawnsForLevel(chapter, level);
    if (player) player.activeLevel = level;

    if (role === "host") {
      setTargetPosition(player, spawns.host.x, spawns.host.y, spawns.host.z);
      setTargetPosition(remotePlayer, spawns.client.x, spawns.client.y, spawns.client.z);
    } else {
      setTargetPosition(player, spawns.client.x, spawns.client.y, spawns.client.z);
      setTargetPosition(remotePlayer, spawns.host.x, spawns.host.y, spawns.host.z);
    }

    resetLocalPhysics(player);

    // IMPORTANT: stop any pending sink/break animations
    player.sinkingObjects?.clear?.();
    player.doorAnimations?.clear?.();
    player.activeSwitch = null;

    if (Array.isArray(player.breakAnimations)) player.breakAnimations.length = 0;

    // Reset current level meshes (including triggers!)
    if (platforms) {
      platforms.forEach((mesh) => {
        if (!mesh) return;
        const isChapter2 = Number(chapter) === 2;
        const isBreakable = !!mesh.userData?.isBreakable;
        const meshLevel = mesh.userData?.levelIndex;
        const isCurrentLevel =
          typeof meshLevel === "number" && typeof level === "number"
            ? meshLevel === level
            : false;
        const forceResetBreakable = isChapter2 && isBreakable && isCurrentLevel;
        if (!forceResetBreakable && !shouldResetMeshForRespawn(mesh, chapter, level)) return;

        // Reset sinkable properly
        if (mesh.userData?.isSinkable) {
          const initPos =
            mesh.userData?.initialPosition ?? mesh.userData?.initialState?.position;
          if (initPos) mesh.position.copy(initPos);

          mesh.userData.sunk = false;
          mesh.userData.sinking = false;

          // ensure not stuck in local set
          player.sinkingObjects?.delete?.(mesh);

          if (role === "host" && player.network && mesh.userData?.id) {
            player.network.sendObjectUpdate(mesh.userData.id, {
              y: mesh.position.y,
              sunk: false,
              sinking: false,
            });
          }
        }

        // Reset breakables
        if (mesh.userData?.isBreakable) {
          resetBreakable(mesh);
          mesh.visible = true;
          if (role === "host" && player.network && mesh.userData?.id) {
            player.network.sendObjectUpdate(mesh.userData.id, {
              broken: false,
              visible: true,
              x: mesh.position.x,
              y: mesh.position.y,
              z: mesh.position.z,
              updatedAt: Date.now(),
            });
          }
        }

        // Reset doors/switches
        if (mesh.userData?.isDoor) {
          const st = mesh.userData?.initialState;
          if (st?.position) mesh.position.copy(st.position);
          mesh.visible = st?.visible ?? true;
          mesh.userData.opened = false;
          mesh.userData.opening = false;
          mesh.userData.openTargetY = undefined;

          if (role === "host" && player.network && mesh.userData?.id) {
            player.network.sendObjectUpdate(mesh.userData.id, {
              opened: false,
              openTargetY: undefined,
              x: mesh.position.x,
              y: mesh.position.y,
              z: mesh.position.z,
              visible: true,
            });
          }
        }

        if (mesh.userData?.isSwitch) {
          mesh.userData.active = false;

          if (role === "host" && player.network && mesh.userData?.id) {
            player.network.sendObjectUpdate(mesh.userData.id, { active: false });
          }
        }

        // Reset checkpoints
        if (mesh.userData?.levelCheckpoint) {
          mesh.userData.checkpointTriggered = false;
        }
      });
    }
  }, [world, role, threeRef, puzzleState?.respawnToken]);
}
