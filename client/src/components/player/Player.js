// components/player/Player.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { PlayerInput } from "./PlayerInput.js";
import { PLAYER_COLLISION } from "./PlayerConfig.js";
import { handleCheckpointsAndRespawn } from "./PlayerCheckpoints.js";

export default class Player {
  constructor(scene, platforms, options = {}) {
    this.platforms = platforms;
    this.scene = scene;

    const {
      modelUrl = null,

      // Collider / physics defaults
      geometry = new THREE.BoxGeometry(2, 2, 2),
      material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
      position = new THREE.Vector3(0, 3, 0),

      speed = 20,
      jumpSpeed = 18,
      gravity = -40,

      network = null,
      otherPlayer = null,
      role = "client",
      modelScale = 1,
    } = options;

    this.network = network;
    this.otherPlayer = otherPlayer;
    this.role = role;
    this.modelScale = modelScale;

    // Root group that represents the player (position + rotation live here)
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    scene.add(this.mesh);

    // Invisible collider
    this.collider = new THREE.Mesh(geometry, material);
    this.collider.visible = false;
    this.mesh.add(this.collider);

    // Anim state
    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.fadeDuration = 0.15;

    this.clipNames = {
      rest: "Rest Pose",
      idle: "Idle",
      walk: "Walking",
      sit: "Sitting",
    };

    if (modelUrl) this.loadModel(modelUrl);

    // Physics
    this.velocity = new THREE.Vector3();
    this.speed = speed;
    this.jumpSpeed = jumpSpeed;
    this.gravity = gravity;
    this.onGround = false;
    this.lastGroundObject = null;
    this.breakCooldown = new Set();
    this.sinkingObjects = new Set();
    this.fragments = [];
    this.breakAnimations = [];
    this.doorAnimations = new Set();
    this.activeSwitch = null;
    this.checkpointCooldownUntil = 0;
    this.hazardCooldownUntil = 0;
    this.transition = null;
    this.activeLevel = 1;
    this.breakGroupCooldowns = new Map();

    // Checkpoint flags
    this._reachedLevel2 = false;
    this._reachedLevel3 = false;

    // Input
    this.input = new PlayerInput();

    // Collision settings
    this.playerHalfHeight = PLAYER_COLLISION.HALF_HEIGHT;
    this.playerHalfSize = PLAYER_COLLISION.HALF_SIZE.clone();
    this.skin = PLAYER_COLLISION.SKIN;
    this.rayOriginOffset = PLAYER_COLLISION.RAY_ORIGIN_OFFSET;
    this.groundEpsilon = PLAYER_COLLISION.GROUND_EPSILON;

    this.raycaster = new THREE.Raycaster();
  }

  startTransition(target, options = {}) {
    if (!target) return;
    const { duration = 0.8, height = 6 } = options;
    const start = this.mesh?.position?.clone
      ? this.mesh.position.clone()
      : new THREE.Vector3();
    const end = target.clone ? target.clone() : new THREE.Vector3(target.x, target.y, target.z);

    this.transition = {
      start,
      end,
      duration: Math.max(0.1, duration),
      height: Math.max(0, height),
      elapsed: 0,
    };

    if (this.velocity?.set) this.velocity.set(0, 0, 0);
    this.onGround = false;
  }

  updateTransition(delta) {
    if (!this.transition) return false;

    const t = Math.min(1, (this.transition.elapsed + delta) / this.transition.duration);
    this.transition.elapsed += delta;

    const ease = 1 - Math.pow(1 - t, 3);
    const next = this.transition.start.clone().lerp(this.transition.end, ease);
    const jump = Math.sin(Math.PI * t) * this.transition.height;
    next.y += jump;
    this.mesh.position.copy(next);
    this.onGround = false;

    if (t >= 1) {
      this.mesh.position.copy(this.transition.end);
      this.transition = null;
      return false;
    }

    return true;
  }

  loadModel(url) {
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        this.model = gltf.scene;

        const s =
          typeof this.modelScale === "number"
            ? new THREE.Vector3(
                this.modelScale,
                this.modelScale,
                this.modelScale
              )
            : this.modelScale;

        this.model.scale.copy(s);

        this.model.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        this.mesh.add(this.model);

        // Animation setup
        this.mixer = new THREE.AnimationMixer(this.model);
        this.actions = {};
        gltf.animations.forEach((clip) => {
          this.actions[clip.name] = this.mixer.clipAction(clip);
        });

        console.log(`[${this.role}] clips:`, Object.keys(this.actions));

        // Start idle/rest
        if (this.actions[this.clipNames.idle])
          this.fadeToAction(this.clipNames.idle, 0);
        else if (this.actions[this.clipNames.rest])
          this.fadeToAction(this.clipNames.rest, 0);
        else if (gltf.animations[0])
          this.fadeToAction(gltf.animations[0].name, 0);
      },
      undefined,
      (err) => console.error("GLTF load error:", err)
    );
  }

  fadeToAction(name, duration = this.fadeDuration) {
    const next = this.actions?.[name];
    if (!next) return;
    if (next === this.activeAction) return;

    next.reset().play();

    if (this.activeAction) {
      this.activeAction.fadeOut(duration);
      next.fadeIn(duration);
    } else {
      next.play();
    }

    this.activeAction = next;
  }

  // For remote avatars: update animations ONLY
  updateMixerOnly(delta) {
    if (this.mixer) this.mixer.update(delta);
  }

  castRay(origin, direction, maxDistance) {
    this.raycaster.set(origin, direction.normalize());
    const hits = this.raycaster.intersectObjects(this.platforms, false);
    if (hits.length === 0) return null;
    const hit = hits.find((h) => !h.object?.userData?.isTrigger);
    if (!hit) return null;
    return hit.distance <= maxDistance ? hit : null;
  }

  breakObject(obj) {
    if (!obj || !obj.userData?.id) return false;
    if (obj.userData.broken || obj.userData.breaking) return false;
    if (obj.userData.breakGroup) {
      const group = obj.userData.breakGroup;
      const now = Date.now();
      const until = this.breakGroupCooldowns.get(group);
      if (typeof until === "number" && now < until) return false;
      const groupBreaking = this.platforms.some(
        (mesh) =>
          mesh &&
          mesh !== obj &&
          mesh.userData?.breakGroup === group &&
          mesh.userData.breaking
      );
      if (groupBreaking) return false;
    }
    if (obj.userData.breakGroup) {
      const group = obj.userData.breakGroup;
      const groupBreaking = this.platforms.some(
        (mesh) =>
          mesh &&
          mesh !== obj &&
          mesh.userData?.breakGroup === group &&
          mesh.userData.breaking
      );
      if (groupBreaking) return;
    }

    const hitsRequired = Number(obj.userData.breakHitsRequired) || 1;
    if (hitsRequired > 1) {
      if (!obj.userData.breakHitsRemaining)
        obj.userData.breakHitsRemaining = hitsRequired;
      const now = Date.now();
      const last = obj.userData.lastHitAt || 0;
      if (now - last < 250) return;
      obj.userData.lastHitAt = now;
      obj.userData.breakHitsRemaining -= 1;
      if (obj.userData.breakHitsRemaining > 0) {
        return;
      }
    }

    if (!obj.userData.breaking) {
      obj.userData.breaking = true;
      const mat = obj.material;
      if (mat) mat.transparent = true;
      const animDuration =
        typeof obj.userData?.breakAnimDuration === "number"
          ? obj.userData.breakAnimDuration
          : 0.6;
      if (obj.userData.breakGroup) {
        this.breakGroupCooldowns.set(
          obj.userData.breakGroup,
          Date.now() + Math.ceil(animDuration * 1000)
        );
      }
      this.breakAnimations.push({
        mesh: obj,
        ttl: animDuration,
        startTtl: animDuration,
        startScale: obj.scale.clone(),
      });
      this.spawnBreakFragments(obj);
      // Sync to client after the local break animation finishes
      if (this.network) {
        setTimeout(() => {
          this.network.sendObjectUpdate(obj.userData.id, {
            broken: true,
            x: obj.position.x,
            y: obj.position.y,
            z: obj.position.z,
            visible: false,
            updatedAt: Date.now(),
          });
        }, Math.max(0, animDuration * 1000));
      }
    }
    return true;
  }

  setSwitchState(switchObj, isActive) {
    if (!switchObj) return;
    if (!!switchObj.userData.active === isActive) return;

    const linkedDoorId = switchObj.userData?.linkedDoorId;
    const door = this.platforms.find(
      (obj) => obj?.userData?.id === linkedDoorId
    );

    switchObj.userData.active = isActive;
    if (door) {
      const closedY =
        door.userData?.initialState?.position?.y ?? door.position.y;
      const openY =
        typeof door.userData?.openY === "number" ? door.userData.openY : 16;
      const targetY = isActive ? openY : closedY;

      door.userData.opened = isActive;
      door.userData.openTargetY = targetY;
      door.userData.opening = true;
      this.doorAnimations.add(door);
    }

    if (this.network) {
      this.network.sendObjectUpdate(switchObj.userData.id, {
        active: isActive,
      });
      if (linkedDoorId) {
        this.network.sendObjectUpdate(linkedDoorId, {
          opened: isActive,
          openTargetY: door ? door.userData.openTargetY : undefined,
        });
      }
    }
  }

  updateDoorAnimations(delta) {
    if (this.doorAnimations.size === 0) return;

    this.doorAnimations.forEach((door) => {
      const targetY =
        typeof door.userData?.openTargetY === "number"
          ? door.userData.openTargetY
          : door.position.y;
      const speed =
        typeof door.userData?.openSpeed === "number" ? door.userData.openSpeed : 2.5;
      const t = 1 - Math.exp(-speed * delta);
      const nextY = door.position.y + (targetY - door.position.y) * t;
      door.position.y = nextY;

      if (Math.abs(door.position.y - targetY) <= 0.02) {
        door.position.y = targetY;
        door.userData.opening = false;
        this.doorAnimations.delete(door);
      }
    });
  }

  checkBreakOnTouch() {
    if (this.role !== "host") return;
    const playerBox = new THREE.Box3().setFromObject(this.collider);
    let closest = null;
    let closestDist = Infinity;
    this.platforms.forEach((obj) => {
      if (!obj?.userData?.breakOnTouch) return;
      if (!obj?.userData?.isBreakable) return;
      if (
        typeof obj.userData.levelIndex === "number" &&
        typeof this.activeLevel === "number" &&
        obj.userData.levelIndex !== this.activeLevel
      )
        return;
      if (obj.userData.onlyMomBreaks && this.role !== "host") return;
      if (obj.userData.broken || obj.userData.breaking) return;
      if (obj.userData.breakGroup) {
        const group = obj.userData.breakGroup;
        const groupBreaking = this.platforms.some(
          (mesh) => mesh?.userData?.breakGroup === group && mesh.userData.breaking
        );
        if (groupBreaking) return;
      }
      const objBox = new THREE.Box3().setFromObject(obj);
      objBox.expandByScalar(0.2);
      if (!playerBox.intersectsBox(objBox)) return;
      const dist = this.mesh.position.distanceTo(obj.position);
      if (dist < closestDist) {
        closestDist = dist;
        closest = obj;
      }
    });
    if (closest) this.breakObject(closest);
  }

  checkLevelCheckpoints() {
    const now = Date.now();
    if (now < this.checkpointCooldownUntil) return;

    const playerBox = new THREE.Box3().setFromObject(this.collider);
    for (const obj of this.platforms) {
      const level = obj?.userData?.levelCheckpoint;
      if (!level) continue;
      if (obj.userData.checkpointTriggered) continue;
      if (obj.userData.requireGround && !this.onGround) continue;
      const objBox = new THREE.Box3().setFromObject(obj);
      if (playerBox.intersectsBox(objBox)) {
        obj.userData.checkpointTriggered = true;
        this.checkpointCooldownUntil = now + 500;
        this.activeLevel = level;
        if (this.network) {
          this.network.sendPuzzleUpdate({
            levelReached: level,
          });
        }
        return;
      }
    }
  }

  spawnBreakFragments(obj) {
    if (!this.scene || !obj) return;

    const color =
      obj.material && obj.material.color
        ? obj.material.color
        : new THREE.Color(0x888888);
    const pieceGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);

    const fragmentCount = Math.max(
      1,
      Number(obj.userData?.breakFragmentCount) || 12
    );
    const spread = Number(obj.userData?.breakFragmentSpread) || 2;
    const velocityScale = Number(obj.userData?.breakFragmentVelocity) || 6;

    for (let i = 0; i < fragmentCount; i += 1) {
      const scale = 0.5 + Math.random() * 0.7;
      const pieceMaterial = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const piece = new THREE.Mesh(pieceGeometry, pieceMaterial);
      piece.scale.set(scale, scale, scale);
      piece.position.copy(obj.position);
      piece.position.x += (Math.random() - 0.5) * spread * 2;
      piece.position.y += Math.random() * spread * 0.6 + 1;
      piece.position.z += (Math.random() - 0.5) * spread * 2;
      piece.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      piece.castShadow = true;
      piece.receiveShadow = true;
      this.scene.add(piece);

      this.fragments.push({
        mesh: piece,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * velocityScale,
          Math.random() * velocityScale + velocityScale * 0.4,
          (Math.random() - 0.5) * velocityScale
        ),
        rotVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ),
        ttl: 1.4,
        startTtl: 1.4,
      });
    }
  }

  updateFragments(delta) {
    if (this.fragments.length === 0) return;
    const gravity = -18;

    this.fragments = this.fragments.filter((frag) => {
      frag.velocity.y += gravity * delta;
      frag.mesh.position.addScaledVector(frag.velocity, delta);
      frag.mesh.rotation.x += frag.rotVelocity.x * delta;
      frag.mesh.rotation.y += frag.rotVelocity.y * delta;
      frag.mesh.rotation.z += frag.rotVelocity.z * delta;
      frag.ttl -= delta;
      const alpha = Math.max(0, frag.ttl / frag.startTtl);
      if (frag.mesh.material) frag.mesh.material.opacity = alpha;
      if (frag.ttl <= 0) {
        this.scene.remove(frag.mesh);
        return false;
      }
      return true;
    });
  }

  updateBreakAnimations(delta) {
    if (this.breakAnimations.length === 0) return;
    this.breakAnimations = this.breakAnimations.filter((anim) => {
      anim.ttl -= delta;
      const t = Math.max(0, anim.ttl / anim.startTtl);
      const mesh = anim.mesh;
      if (mesh.material) mesh.material.opacity = t;
      const scale = anim.startScale.clone().multiplyScalar(t);
      mesh.scale.copy(scale);
      if (anim.ttl <= 0) {
        mesh.visible = false;
        mesh.userData.broken = true;
        mesh.userData.breaking = false;
        mesh.position.set(99999, 99999, 99999);
        if (this.network && mesh.userData?.id) {
          this.network.sendObjectUpdate(mesh.userData.id, {
            broken: true,
            x: mesh.position.x,
            y: mesh.position.y,
            z: mesh.position.z,
            visible: false,
          });
        }
        return false;
      }
      return true;
    });
  }

  checkHazardHit() {
    const now = Date.now();
    if (now < this.hazardCooldownUntil) return false;
    const isDaughter = this.role !== "host";
    if (!isDaughter) return false;

    const playerBox = new THREE.Box3().setFromObject(this.collider);
    for (const obj of this.platforms) {
      if (!obj?.userData?.isHazard) continue;
      const hazardBox = new THREE.Box3().setFromObject(obj);
      hazardBox.expandByScalar(0.15);
      if (playerBox.intersectsBox(hazardBox)) {
        this.hazardCooldownUntil = now + 500;
        if (this.network) {
          this.network.sendPuzzleUpdate({
            respawnToken: now,
            respawnLevel: typeof this.activeLevel === "number" ? this.activeLevel : 1,
          });
        }
        return true;
      }
    }

    return false;
  }

  updateSinkingObjects(delta) {
    if (this.sinkingObjects.size === 0) return;

    this.sinkingObjects.forEach((obj) => {
      const targetY =
        typeof obj.userData.sinkTargetY === "number"
          ? obj.userData.sinkTargetY
          : obj.position.y - 4;
      const speed =
        typeof obj.userData.sinkSpeed === "number" ? obj.userData.sinkSpeed : 6;

      const t = 1 - Math.exp(-speed * delta);
      const nextY = obj.position.y + (targetY - obj.position.y) * t;
      if (Math.abs(nextY - obj.position.y) > 0.001) {
        obj.position.y = nextY;
        if (this.network && obj.userData?.id) {
          this.network.sendObjectUpdate(obj.userData.id, { y: nextY });
        }
      }

      if (Math.abs(obj.position.y - targetY) <= 0.02) {
        obj.userData.sunk = true;
        obj.userData.sinking = false;
        obj.position.y = targetY;
        if (this.network && obj.userData?.id) {
          this.network.sendObjectUpdate(obj.userData.id, {
            y: obj.position.y,
            sunk: true,
            sinking: false,
          });
        }
        this.sinkingObjects.delete(obj);
      }
    });
  }

  update(delta) {
    // Update animations
    if (this.mixer) this.mixer.update(delta);

    // INPUT
    const { moveX, moveZ, jumpPressed } = this.input.getInputState();
    const inputDir = new THREE.Vector3(moveX, 0, moveZ);
    const isMoving = inputDir.lengthSq() > 0.0001;

    // Switch anim
    if (isMoving) {
      if (this.actions[this.clipNames.walk])
        this.fadeToAction(this.clipNames.walk, 0.15);
      else if (this.actions[this.clipNames.idle])
        this.fadeToAction(this.clipNames.idle, 0.15);
    } else {
      if (this.actions[this.clipNames.idle])
        this.fadeToAction(this.clipNames.idle, 0.2);
      else if (this.actions[this.clipNames.rest])
        this.fadeToAction(this.clipNames.rest, 0.2);
    }

    // Movement velocity
    if (isMoving) {
      inputDir.normalize().multiplyScalar(this.speed);
      this.velocity.x = inputDir.x;
      this.velocity.z = inputDir.z;

      // Face movement direction
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y = angle;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Jump
    if (jumpPressed && this.onGround) {
      this.velocity.y = this.jumpSpeed;
      this.onGround = false;
    }

    // Gravity
    this.velocity.y += this.gravity * delta;

    let deltaPos = this.velocity.clone().multiplyScalar(delta);
    let newPos = this.mesh.position.clone();

    // X movement (+ pushables)
    if (deltaPos.x !== 0) {
      const dirX = new THREE.Vector3(Math.sign(deltaPos.x), 0, 0);
      const originX = new THREE.Vector3(
        this.mesh.position.x,
        this.mesh.position.y,
        this.mesh.position.z
      );

      const maxX = this.playerHalfSize.x + this.skin + Math.abs(deltaPos.x);
      const hitX = this.castRay(originX, dirX, maxX);

      if (hitX) {
        const hitObj = hitX.object;
        const isSinkable = !!hitObj?.userData?.isSinkable;
        const isSunk = !!hitObj?.userData?.sunk;
        const isMom = this.role === "host";
        const allowPassThrough = isSinkable && isMom && !isSunk;
        const isBreakable = !!hitObj?.userData?.isBreakable;
        const onlyMom = !!hitObj?.userData?.onlyMomBreaks;
        const canBreak = isBreakable && (!onlyMom || this.role === "host");

        if (allowPassThrough) {
          // Let mom walk onto the sinkable before it sinks
        } else if (canBreak) {
          const didBreak = this.breakObject(hitObj);
          if (!didBreak) {
            deltaPos.x = 0;
            this.velocity.x = 0;
          }
        } else if (hitObj.userData && hitObj.userData.isPushable) {
          const onlyHost = !!hitObj.userData.onlyHostCanPush;
          const canPush = !onlyHost || this.role === "host";

          if (canPush) {
            hitObj.position.x += deltaPos.x;

            if (this.network && hitObj.userData.id) {
              this.network.sendObjectUpdate(hitObj.userData.id, {
                x: hitObj.position.x,
                y: hitObj.position.y,
                z: hitObj.position.z,
              });
            }
          } else {
            deltaPos.x = 0;
            this.velocity.x = 0;
          }
        } else {
          deltaPos.x = 0;
          this.velocity.x = 0;
        }
      }
    }
    newPos.x += deltaPos.x;

    // Z movement (+ pushables)
    if (deltaPos.z !== 0) {
      const dirZ = new THREE.Vector3(0, 0, Math.sign(deltaPos.z));
      const originZ = new THREE.Vector3(
        newPos.x,
        this.mesh.position.y,
        this.mesh.position.z
      );

      const maxZ = this.playerHalfSize.z + this.skin + Math.abs(deltaPos.z);
      const hitZ = this.castRay(originZ, dirZ, maxZ);

      if (hitZ) {
        const hitObj = hitZ.object;
        const isSinkable = !!hitObj?.userData?.isSinkable;
        const isSunk = !!hitObj?.userData?.sunk;
        const isMom = this.role === "host";
        const allowPassThrough = isSinkable && isMom && !isSunk;
        const isBreakable = !!hitObj?.userData?.isBreakable;
        const onlyMom = !!hitObj?.userData?.onlyMomBreaks;
        const canBreak = isBreakable && (!onlyMom || this.role === "host");

        if (allowPassThrough) {
          // Let mom walk onto the sinkable before it sinks
        } else if (canBreak) {
          const didBreak = this.breakObject(hitObj);
          if (!didBreak) {
            deltaPos.z = 0;
            this.velocity.z = 0;
          }
        } else if (hitObj.userData && hitObj.userData.isPushable) {
          const onlyHost = !!hitObj.userData.onlyHostCanPush;
          const canPush = !onlyHost || this.role === "host";

          if (canPush) {
            hitObj.position.z += deltaPos.z;

            if (this.network && hitObj.userData.id) {
              this.network.sendObjectUpdate(hitObj.userData.id, {
                x: hitObj.position.x,
                y: hitObj.position.y,
                z: hitObj.position.z,
              });
            }
          } else {
            deltaPos.z = 0;
            this.velocity.z = 0;
          }
        } else {
          deltaPos.z = 0;
          this.velocity.z = 0;
        }
      }
    }
    newPos.z += deltaPos.z;

    // Vertical movement & ground/ceiling
    this.onGround = false;
    let deltaY = deltaPos.y;

    // Ceiling
    if (deltaY > 0) {
      const upDir = new THREE.Vector3(0, 1, 0);
      const upOrigin = new THREE.Vector3(
        newPos.x,
        this.mesh.position.y + this.playerHalfHeight - this.skin,
        newPos.z
      );

      const maxUp = this.skin + Math.abs(deltaY);
      const hitUp = this.castRay(upOrigin, upDir, maxUp);

      if (hitUp) {
        const ceilingY = hitUp.point.y;
        newPos.y = ceilingY - this.playerHalfHeight - this.skin;
        deltaY = 0;
        this.velocity.y = 0;
      }
    }

    newPos.y += deltaY;

    // Ground
    const downDir = new THREE.Vector3(0, -1, 0);
    const downOrigin = new THREE.Vector3(
      newPos.x,
      newPos.y + this.rayOriginOffset,
      newPos.z
    );

    const maxDown =
      this.playerHalfHeight +
      this.groundEpsilon +
      Math.max(0, -this.velocity.y * delta);

    const hitDown = this.castRay(downOrigin, downDir, maxDown);

    if (hitDown && this.velocity.y <= 0) {
      const groundY = hitDown.point.y;
      const groundObj = hitDown.object;
      const isSinkable = !!groundObj?.userData?.isSinkable;
      const isSunk = !!groundObj?.userData?.sunk;
      const isMom = this.role === "host";
      const isDaughter = !isMom;

      if (!(isSinkable && isMom && !isSunk)) {
        newPos.y = groundY + this.playerHalfHeight;
        this.velocity.y = 0;
        this.onGround = true;
      }

      this.lastGroundObject = groundObj;
      if (this.onGround && typeof groundObj?.userData?.levelIndex === "number") {
        this.activeLevel = groundObj.userData.levelIndex;
      }

      const isBreakable = !!groundObj?.userData?.isBreakable;
      const onlyMom = !!groundObj?.userData?.onlyMomBreaks;
      const onlyDaughter = !!groundObj?.userData?.onlyDaughterSinks;

      const canBreak = isBreakable && (!onlyMom || isMom);
      if (canBreak) {
        const id = groundObj.userData?.id;
        if (id && !this.breakCooldown.has(id)) {
          this.breakCooldown.add(id);

          // Optional: small delay for "crack then break"
          setTimeout(() => {
            this.breakObject(groundObj);
          }, 150);
        }
      }

      const canSink = isSinkable && (!onlyDaughter || isDaughter);
      if (canSink && !groundObj.userData?.sunk && !groundObj.userData?.sinking) {
        groundObj.userData.sinking = true;
        this.sinkingObjects.add(groundObj);
      }

      if (
        groundObj?.userData?.levelCheckpoint &&
        !groundObj.userData.checkpointTriggered
      ) {
        groundObj.userData.checkpointTriggered = true;
        if (this.network) {
          this.network.sendPuzzleUpdate({
            level: groundObj.userData.levelCheckpoint,
            forceLevel: true,
          });
        }
      }
    }

    // Player–player collision (horizontal)
    if (this.otherPlayer) {
      const otherPos = this.otherPlayer.position;

      const dx = newPos.x - otherPos.x;
      const dz = newPos.z - otherPos.z;
      const distSq = dx * dx + dz * dz;

      const radius = 1.0;
      const minDist = radius * 2;
      const minDistSq = minDist * minDist;

      if (distSq < minDistSq) {
        const dist = Math.sqrt(distSq) || 0.0001;
        const overlap = minDist - dist;

        const nx = dx / dist;
        const nz = dz / dist;

        newPos.x += nx * overlap;
        newPos.z += nz * overlap;
      }
    }

    // Checkpoints & Respawn
    const shouldStop = handleCheckpointsAndRespawn(this, newPos);
    if (shouldStop) return;

    // Apply position
    this.mesh.position.copy(newPos);

    // Switch handling (daughter only)
    if (this.role !== "host") {
      const playerBox = new THREE.Box3().setFromObject(this.collider);
      let hitSwitch = null;
      this.platforms.forEach((obj) => {
        if (!obj?.userData?.isSwitch) return;
        const switchBox = new THREE.Box3().setFromObject(obj);
        switchBox.expandByScalar(0.3);
        if (playerBox.intersectsBox(switchBox)) {
          hitSwitch = obj;
        }
      });

      if (hitSwitch) {
        this.setSwitchState(hitSwitch, true);
        this.activeSwitch = hitSwitch;
      } else if (this.activeSwitch) {
        this.setSwitchState(this.activeSwitch, false);
        this.activeSwitch = null;
      }
    }

    // Per-frame updates
    this.updateFragments(delta);
    this.updateSinkingObjects(delta);
    this.updateBreakAnimations(delta);
    this.updateDoorAnimations(delta);
    this.checkBreakOnTouch();
    this.checkLevelCheckpoints();

    // Ensure any opening door animates even if the update arrived early
    this.platforms.forEach((obj) => {
      if (obj?.userData?.isDoor && obj.userData.opening) {
        this.doorAnimations.add(obj);
      }
    });

    if (this.checkHazardHit()) return;
  }

  dispose() {
    if (this.input) this.input.dispose();
  }
}
