import { useEffect } from "react";
import * as THREE from "three";

import Player from "../components/player/Player.js";
import { loadAllLevels } from "../components/Levels.js";
import { loadChapter2Levels } from "../components/chapters/Chapter2/Chapter2Levels.js";

import momUrl from "../assets/Models/mom.glb";
import urotsukiUrl from "../assets/Models/urotsuki.glb";

export function useThreeSetup({ containerRef, threeRef, network, role, chapter = 1 }) {
  useEffect(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const zoom = 14;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.OrthographicCamera(
      -aspect * zoom,
      aspect * zoom,
      zoom,
      -zoom,
      -200,
      200
    );

    camera.position.set(14, 18, 14);
    camera.rotation.order = "YXZ";
    camera.rotation.y = Math.PI / 4;
    camera.rotation.x = Math.atan(Math.sqrt(2)) * 0.9;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const container = containerRef.current;
    if (container) container.appendChild(renderer.domElement);

    // Lights
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, -10);
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.castShadow = true;
    const cam = dirLight.shadow.camera;
    cam.near = 1;
    cam.far = 100;
    cam.left = -50;
    cam.right = 50;
    cam.top = 50;
    cam.bottom = -50;
    cam.updateProjectionMatrix();
    scene.add(dirLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // Load levels/platforms
    const chapterNumber = Number(chapter) === 2 ? 2 : 1;
    const platforms =
      chapterNumber === 2 ? loadChapter2Levels(scene, role) : loadAllLevels(scene, role);

    const blocks = {};
    platforms.forEach((p, idx) => {
      if (
        p.userData &&
        (p.userData.isPushable ||
          p.userData.isBreakable ||
          p.userData.isSinkable ||
          p.userData.isDoor ||
          p.userData.isSwitch)
      ) {
        const id = p.userData.id || `block-${idx}`;
        blocks[id] = p;
      }
    });

    // Initial spawn offset so they don't overlap before world sync
    const localX = role === "host" ? -2 : 2;
    const remoteX = role === "host" ? 2 : -2;

    const spawnPos = new THREE.Vector3(localX, 3, 0);
    const remoteSpawn = new THREE.Vector3(remoteX, 3, 0);

    // Camera follow offset
    const cameraOffset = new THREE.Vector3(14, 18, 14);

    const CHAR = {
      mom: { url: momUrl, scale: 6.0 },
      uro: { url: urotsukiUrl, scale: 5.0 },
    };

    const localCharKey = role === "host" ? "mom" : "uro";
    const remoteCharKey = role === "host" ? "uro" : "mom";

    const remoteRole = role === "host" ? "client" : "host";

    // Remote avatar
    const remotePlayer = new Player(scene, platforms, {
      position: remoteSpawn,
      speed: 0,
      jumpSpeed: 0,
      gravity: 0,
      network: null,
      otherPlayer: null,
      role: remoteRole,
      modelUrl: CHAR[remoteCharKey].url,
      modelScale: CHAR[remoteCharKey].scale,
    });

    // Local player
    const playerJump = role === "host" ? 24 : 32;
    const player = new Player(scene, platforms, {
      position: spawnPos,
      speed: 10,
      jumpSpeed: playerJump,
      gravity: -50,
      network,
      otherPlayer: remotePlayer.mesh,
      role,
      modelUrl: CHAR[localCharKey].url,
      modelScale: CHAR[localCharKey].scale,
      chapter: chapterNumber,
    });

    threeRef.current = {
      ...threeRef.current,
      scene,
      camera,
      renderer,
      player,
      remotePlayer,
      platforms,
      blocks,
      zoom,
      cameraOffset,
    };

    // Network handlers
    let lastRemotePos = new THREE.Vector3(remoteSpawn.x, remoteSpawn.y, remoteSpawn.z);

    if (network) {
      network.on("remotePlayerMove", ({ position }) => {
        const { remotePlayer } = threeRef.current;
        if (!remotePlayer) return;

        const nextPos = new THREE.Vector3(position.x, position.y, position.z);
        const blocksBreakable = (threeRef.current.platforms || []).filter(
          (obj) => obj?.userData?.isBreakable && !obj.userData.broken
        );
        if (blocksBreakable.length > 0) {
          const remoteBox = new THREE.Box3().setFromObject(remotePlayer.collider);
          const delta = nextPos.clone().sub(remotePlayer.mesh.position);
          remoteBox.translate(delta);
          const blocked = blocksBreakable.some((obj) => {
            const objBox = new THREE.Box3().setFromObject(obj);
            return remoteBox.intersectsBox(objBox);
          });
          if (blocked) {
            return;
          }
        }

        remotePlayer.mesh.position.copy(nextPos);

        const moved = remotePlayer.mesh.position.distanceToSquared(lastRemotePos) > 0.0001;

        if (moved) {
          if (remotePlayer.actions?.[remotePlayer.clipNames.walk]) {
            remotePlayer.fadeToAction(remotePlayer.clipNames.walk, 0.15);
          } else if (remotePlayer.actions?.["Walk"]) {
            remotePlayer.fadeToAction("Walk", 0.15);
          } else if (remotePlayer.actions?.[remotePlayer.clipNames.idle]) {
            remotePlayer.fadeToAction(remotePlayer.clipNames.idle, 0.15);
          }
        } else {
          if (remotePlayer.actions?.[remotePlayer.clipNames.idle]) {
            remotePlayer.fadeToAction(remotePlayer.clipNames.idle, 0.2);
          } else if (remotePlayer.actions?.[remotePlayer.clipNames.rest]) {
            remotePlayer.fadeToAction(remotePlayer.clipNames.rest, 0.2);
          }
        }

        if (moved) {
          const dx = remotePlayer.mesh.position.x - lastRemotePos.x;
          const dz = remotePlayer.mesh.position.z - lastRemotePos.z;
          if (dx * dx + dz * dz > 0.000001) {
            remotePlayer.mesh.rotation.y = Math.atan2(dx, dz);
          }
        }

        lastRemotePos.copy(remotePlayer.mesh.position);
      });

      network.on("objectUpdated", ({ objectId, state }) => {
        const { blocks, player } = threeRef.current;
        const mesh = blocks?.[objectId];
        if (!mesh || !state) return;
        const isBreakable = !!mesh.userData?.isBreakable;
        if (
          isBreakable &&
          typeof state.updatedAt === "number" &&
          typeof mesh.userData?.resetAt === "number" &&
          state.updatedAt < mesh.userData.resetAt
        ) {
          return;
        }

        // Position updates
        const nextX = typeof state.x === "number" ? state.x : mesh.position.x;
        const nextY = typeof state.y === "number" ? state.y : mesh.position.y;
        const nextZ = typeof state.z === "number" ? state.z : mesh.position.z;
        if (nextX !== mesh.position.x || nextY !== mesh.position.y || nextZ !== mesh.position.z) {
          mesh.position.set(nextX, nextY, nextZ);
        }

        // Sync sink flags
        if (typeof state.sunk === "boolean") mesh.userData.sunk = state.sunk;
        if (typeof state.sinking === "boolean") mesh.userData.sinking = state.sinking;

        // Switch/door flags
        if (typeof state.active === "boolean") mesh.userData.active = state.active;
        if (typeof state.opened === "boolean") {
          mesh.userData.opened = state.opened;
          if (state.opened) mesh.userData.opening = true;
        }
        if (typeof state.openTargetY === "number") mesh.userData.openTargetY = state.openTargetY;

        // IMPORTANT: break animation sync for BOTH players
        const wantsBreakAnim =
          (state.breaking === true) ||
          (state.broken === true && mesh.userData?.isBreakable && !mesh.userData.broken);

        if (wantsBreakAnim && mesh.userData?.isBreakable && !mesh.userData.breaking && !mesh.userData.broken) {
          mesh.userData.breaking = true;
          if (mesh.material) mesh.material.transparent = true;

          const animDuration =
            typeof state.breakAnimDuration === "number"
              ? state.breakAnimDuration
              : (typeof mesh.userData.breakAnimDuration === "number" ? mesh.userData.breakAnimDuration : 1.0);

          // play same local animation + fragments on receiver
          if (player?.spawnBreakFragments) player.spawnBreakFragments(mesh);
          if (Array.isArray(player?.breakAnimations)) {
            player.breakAnimations.push({
              mesh,
              ttl: animDuration,
              startTtl: animDuration,
              startScale: mesh.scale.clone(),
            });
          }
        }

        // Apply final broken/visible, BUT don't instantly hide before animation
        if (typeof state.broken === "boolean") {
          mesh.userData.broken = state.broken;
          if (state.broken) {
            // allow local animation to handle hiding; only force if already done
            // (mesh will become invisible when its local break animation ends)
          } else {
            mesh.visible = true;
            mesh.userData.breaking = false;
            if (mesh.material) {
              mesh.material.opacity = 1;
              mesh.material.transparent = false;
            }
          }
        }

        if (typeof state.visible === "boolean") {
          // if server says visible=false after break, accept it
          mesh.visible = state.visible;
        }

        // Door animation kick
        if (
          mesh.userData?.isDoor &&
          (typeof state.openTargetY === "number" || typeof state.opened === "boolean")
        ) {
          if (player?.doorAnimations) player.doorAnimations.add(mesh);
          mesh.userData.opening = true;
        }
      });
    }

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      const { renderer, scene, camera, player, remotePlayer, cameraOffset } = threeRef.current;

      if (!renderer || !scene || !camera || !player) {
        threeRef.current.animationId = requestAnimationFrame(animate);
        return;
      }

      let delta = clock.getDelta();
      const MAX_DELTA = 0.05;
      if (delta > MAX_DELTA) delta = MAX_DELTA;
      if (delta <= 0) {
        threeRef.current.animationId = requestAnimationFrame(animate);
        return;
      }

      const localInTransition = player.updateTransition?.(delta);
      if (!localInTransition) {
        player.update(delta);
      } else {
        player.updateMixerOnly?.(delta);
      }

      if (remotePlayer) {
        remotePlayer.updateTransition?.(delta);
        remotePlayer.updateMixerOnly(delta);
      }

      if (network) {
        const p = player.mesh.position;
        network.sendPlayerMove({ x: p.x, y: p.y, z: p.z });
      }

      camera.position.copy(player.mesh.position).add(cameraOffset);
      camera.lookAt(player.mesh.position);

      renderer.render(scene, camera);
      threeRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const a = w / h;

      const { camera, renderer, zoom } = threeRef.current;
      if (!camera || !renderer) return;

      camera.left = -a * zoom;
      camera.right = a * zoom;
      camera.top = zoom;
      camera.bottom = -zoom;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(threeRef.current.animationId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container?.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [containerRef, threeRef, network, role, chapter]);
}
