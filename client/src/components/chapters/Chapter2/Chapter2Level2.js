import * as THREE from "three";
import { getRoleMaterial } from "../../../materials/levelMaterial.js";

export function loadChapter2Level2(role) {
  const group = new THREE.Group();
  const platforms = [];

  const platformMaterial = getRoleMaterial(role, { repeatX: 2, repeatY: 4 });

  // Base platform
  const base = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 90), platformMaterial);
  base.position.z = -30;
  base.receiveShadow = true;
  base.userData.levelIndex = 2;
  group.add(base);
  platforms.push(base);

  // Breakable walls (mom only, one-by-one order, same break settings as Level 1 wall)
  const wallMaterial = new THREE.MeshStandardMaterial({ color: "darkred" });
  const breakGroup = "ch2_level2_walls";

  const walls = [
    { z: 6, height: 20, id: "ch2_w1" },
    { z: -8, height: 26, id: "ch2_w2" },
    { z: -22, height: 32, id: "ch2_w3" },
  ];

  walls.forEach((cfg) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(20, cfg.height, 2), wallMaterial);
    wall.position.set(0, cfg.height / 2, cfg.z);
    wall.receiveShadow = true;
    wall.castShadow = true;

    wall.userData.id = cfg.id;
    wall.userData.levelIndex = 2;
    wall.userData.breakGroup = breakGroup;

    wall.userData.isBreakable = true;
    wall.userData.onlyMomBreaks = true;
    wall.userData.breakOnTouch = true;

    // Same break settings as the Chapter 2 Level 1 wall
    wall.userData.breakFragmentCount = 260;
    wall.userData.breakFragmentSpread = 9;
    wall.userData.breakFragmentVelocity = 20;
    wall.userData.breakAnimDuration = 0.6;

    wall.userData.initialState = {
      position: wall.position.clone(),
      rotation: wall.rotation.clone(),
      scale: wall.scale.clone(),
      visible: true,
      broken: false,
    };

    group.add(wall);
    platforms.push(wall);
  });

  // Floating platforms (daughter)
  const floatGeometry = new THREE.BoxGeometry(10, 2, 10);
  const floaters = [
    { z: -44, y: 8 },
    { z: -56, y: 15 },
    { z: -68, y: 19 },
  ];

  floaters.forEach((f, idx) => {
    const plat = new THREE.Mesh(floatGeometry, platformMaterial);
    plat.position.set(0, f.y, f.z);
    plat.receiveShadow = true;
    plat.userData.id = `ch2_float_${idx + 1}`;
    plat.userData.levelIndex = 2;
    group.add(plat);
    platforms.push(plat);
  });

  // Door gate
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 2),
    new THREE.MeshStandardMaterial({ color: "#5a0d0d" })
  );
  door.position.set(0, 10, -74);
  door.receiveShadow = true;
  door.castShadow = true;

  door.userData.id = "ch2_door_1";
  door.userData.levelIndex = 2;
  door.userData.isDoor = true;
  door.userData.openY = 26;
  door.userData.openSpeed = 2.5;
  door.userData.initialState = {
    position: door.position.clone(),
    rotation: door.rotation.clone(),
    scale: door.scale.clone(),
    visible: true,
  };
  group.add(door);
  platforms.push(door);

  // Switch on top of door
  const switchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(8, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: "yellow" })
  );
  switchPlate.position.set(0, 21.5, -74);
  switchPlate.receiveShadow = true;

  switchPlate.userData.id = "ch2_switch_1";
  switchPlate.userData.levelIndex = 2;
  switchPlate.userData.isSwitch = true;
  switchPlate.userData.linkedDoorId = "ch2_door_1";
  switchPlate.userData.initialState = {
    position: switchPlate.position.clone(),
    rotation: switchPlate.rotation.clone(),
    scale: switchPlate.scale.clone(),
    visible: true,
  };
  group.add(switchPlate);
  platforms.push(switchPlate);

  // Landing after door
  const next = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 18), platformMaterial);
  next.position.set(0, 0, -94);
  next.receiveShadow = true;
  next.userData.levelIndex = 2;
  group.add(next);
  platforms.push(next);

  // Checkpoint trigger for Level 3
  const endCheckpoint = new THREE.Mesh(
    new THREE.BoxGeometry(18, 3, 18),
    new THREE.MeshStandardMaterial({ color: "lightblue", transparent: true, opacity: 0.0 })
  );
  endCheckpoint.position.set(0, 2.5, -94);
  endCheckpoint.userData.levelCheckpoint = 3;
  endCheckpoint.userData.levelIndex = 2;
  endCheckpoint.userData.checkpointTriggered = false;
  endCheckpoint.userData.isTrigger = true;
  endCheckpoint.userData.requireGround = true;
  group.add(endCheckpoint);
  platforms.push(endCheckpoint);

  // Side walls
  const sideWallGeometry = new THREE.BoxGeometry(2, 50, 130);
  const invisibleWalls = new THREE.MeshStandardMaterial({
    color: "lightblue",
    transparent: true,
    opacity: 0.0,
  });

  const leftWall = new THREE.Mesh(sideWallGeometry, invisibleWalls);
  leftWall.position.set(-11, 24, -30);
  leftWall.userData.levelIndex = 2;
  group.add(leftWall);
  platforms.push(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, invisibleWalls);
  rightWall.position.set(11, 24, -30);
  rightWall.userData.levelIndex = 2;
  group.add(rightWall);
  platforms.push(rightWall);

  return { group, platforms };
}
