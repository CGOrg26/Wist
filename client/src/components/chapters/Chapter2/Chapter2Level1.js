import * as THREE from "three";
import { getRoleMaterial } from "../../../materials/levelMaterial.js";

export function loadChapter2Level1(role) {
  const group = new THREE.Group();
  const platforms = [];

  const platformMaterial = getRoleMaterial(role, { repeatX: 2, repeatY: 4 });

  // Start platform
  const start = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 20), platformMaterial);
  start.position.z = 10;
  start.receiveShadow = true;
  start.userData.levelIndex = 1;
  group.add(start);
  platforms.push(start);

  // Sinking bridge over the hole (daughter triggers)
  const sinkBridge = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 22), platformMaterial);
  sinkBridge.position.set(0, 8, -11);
  sinkBridge.receiveShadow = true;
  sinkBridge.userData.id = "ch2_sink_bridge_1";
  sinkBridge.userData.levelIndex = 1;
  sinkBridge.userData.isSinkable = true;
  sinkBridge.userData.onlyDaughterSinks = true;   // IMPORTANT
  sinkBridge.userData.sinkTargetY = 0;
  sinkBridge.userData.sinkSpeed = 3.5;
  sinkBridge.userData.initialPosition = sinkBridge.position.clone();
  group.add(sinkBridge);
  platforms.push(sinkBridge);

  // Platform after the hole
  const after = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 40), platformMaterial);
  after.position.z = -42;
  after.receiveShadow = true;
  after.userData.levelIndex = 1;
  group.add(after);
  platforms.push(after);

  // Breakable wall (mother only) - lots of fragments
  const breakWall = new THREE.Mesh(
    new THREE.BoxGeometry(20, 18, 2),
    new THREE.MeshStandardMaterial({ color: "darkred" })
  );
  breakWall.position.set(0, 10, -50);
  breakWall.receiveShadow = true;
  breakWall.castShadow = true;
  breakWall.userData.id = "ch2_break_wall_1";
  breakWall.userData.levelIndex = 1;
  breakWall.userData.isBreakable = true;
  breakWall.userData.onlyMomBreaks = true;
  breakWall.userData.breakFragmentCount = 120;
  breakWall.userData.breakFragmentSpread = 6;
  breakWall.userData.breakFragmentVelocity = 14;
  breakWall.userData.breakAnimDuration = 1.1;
  breakWall.userData.initialPosition = breakWall.position.clone();
  breakWall.userData.initialState = {
    position: breakWall.position.clone(),
    rotation: breakWall.rotation.clone(),
    scale: breakWall.scale.clone(),
    visible: true,
    broken: false,
  };
  group.add(breakWall);
  platforms.push(breakWall);

  // Floating platform
  const floatPlatform = new THREE.Mesh(new THREE.BoxGeometry(10, 1.5, 10), platformMaterial);
  floatPlatform.position.set(0, 9.0, -42);
  floatPlatform.receiveShadow = true;
  floatPlatform.userData.levelIndex = 1;
  group.add(floatPlatform);
  platforms.push(floatPlatform);

  // Spikes (hazard)
  const spikeMaterial = new THREE.MeshStandardMaterial({ color: "crimson" });
  const spikeCount = 10;
  const spikeSpacing = 2.0;
  const spikeStartX = -(spikeCount - 1) * 0.5 * spikeSpacing;

  const spikeShape = new THREE.Shape();
  spikeShape.moveTo(-0.8, 0);
  spikeShape.lineTo(0.8, 0);
  spikeShape.lineTo(0, 2.2);
  spikeShape.lineTo(-0.8, 0);

  const spikeGeometry = new THREE.ExtrudeGeometry(spikeShape, {
    depth: 1.2,
    bevelEnabled: false,
  });
  spikeGeometry.center();

  for (let i = 0; i < spikeCount; i += 1) {
    const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
    spike.position.set(spikeStartX + i * spikeSpacing, 19.8, -50);
    spike.rotation.y = Math.PI / 2;
    spike.receiveShadow = true;
    spike.castShadow = true;
    spike.userData.isHazard = true;
    spike.userData.onlyDaughterHazard = true;
    spike.userData.levelIndex = 1;
    group.add(spike);
    platforms.push(spike);
  }

  // Invisible side walls
  const sideWallGeometry = new THREE.BoxGeometry(2, 50, 120);
  const invisibleWalls = new THREE.MeshStandardMaterial({
    color: "lightblue",
    transparent: true,
    opacity: 0.0,
  });

  const leftWall = new THREE.Mesh(sideWallGeometry, invisibleWalls);
  leftWall.position.set(-11, 24, -30);
  leftWall.userData.levelIndex = 1;
  group.add(leftWall);
  platforms.push(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, invisibleWalls);
  rightWall.position.set(11, 24, -30);
  rightWall.userData.levelIndex = 1;
  group.add(rightWall);
  platforms.push(rightWall);

  // Checkpoint trigger for Level 2
  const checkpoint = new THREE.Mesh(
    new THREE.BoxGeometry(18, 3, 18),
    new THREE.MeshStandardMaterial({ color: "lightblue", transparent: true, opacity: 0.0 })
  );
  checkpoint.position.set(0, 2.5, -68);
  checkpoint.userData.levelCheckpoint = 2;
  checkpoint.userData.levelIndex = 1;
  checkpoint.userData.checkpointTriggered = false;
  checkpoint.userData.isTrigger = true;
  checkpoint.userData.requireGround = true;
  group.add(checkpoint);
  platforms.push(checkpoint);

  return { group, platforms };
}
