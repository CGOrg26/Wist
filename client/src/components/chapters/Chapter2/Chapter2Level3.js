import * as THREE from "three";
import { getRoleMaterial } from "../../../materials/levelMaterial.js";

export function loadChapter2Level3(role) {
  const group = new THREE.Group();
  const platforms = [];

  const platformMaterial = getRoleMaterial(role, { repeatX: 2, repeatY: 4 });

  // Base platform (NOT a trigger)
  const base = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 90), platformMaterial);
  base.position.set(0, -0.05, -45);
  base.receiveShadow = true;
  base.userData.levelIndex = 3;
  group.add(base);
  platforms.push(base);

  // Daughter platforms
  const floatGeometry = new THREE.BoxGeometry(10, 2, 10);
  const floaters = [
    { z: -46, y: 9 },
    { z: -64, y: 10 },
  ];

  floaters.forEach((f, idx) => {
    const plat = new THREE.Mesh(floatGeometry, platformMaterial);
    plat.position.set(0, f.y, f.z);
    plat.receiveShadow = true;
    plat.userData.id = `ch2_l3_float_${idx + 1}`;
    plat.userData.levelIndex = 3;
    group.add(plat);
    platforms.push(plat);
  });

  // Breakable walls
  const wallMaterial = new THREE.MeshStandardMaterial({ color: "darkred" });
  const walls = [
    { z: -32, height: 24, id: "ch2_l3_w1" },
    { z: -56, height: 28, id: "ch2_l3_w2" },
  ];

  walls.forEach((cfg) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(22, cfg.height, 4), wallMaterial);
    wall.position.set(0, cfg.height / 2, cfg.z);
    wall.receiveShadow = true;
    wall.castShadow = true;

    wall.userData.id = cfg.id;
    wall.userData.levelIndex = 3;
    wall.userData.isBreakable = true;
    wall.userData.onlyMomBreaks = true;
    wall.userData.breakOnTouch = true;

    wall.userData.breakFragmentCount = 160;
    wall.userData.breakFragmentSpread = 6;
    wall.userData.breakFragmentVelocity = 14;
    wall.userData.breakAnimDuration = 1.1;

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

  // Door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(22, 20, 2),
    new THREE.MeshStandardMaterial({ color: "#5a0d0d" })
  );
  door.position.set(0, 7, -74);
  door.receiveShadow = true;
  door.castShadow = true;

  door.userData.id = "ch2_l3_door_1";
  door.userData.levelIndex = 3;
  door.userData.isDoor = true;
  door.userData.openY = 22;
  door.userData.openSpeed = 2.5;
  door.userData.initialState = {
    position: door.position.clone(),
    rotation: door.rotation.clone(),
    scale: door.scale.clone(),
    visible: true,
  };
  group.add(door);
  platforms.push(door);

  // Switch
  const switchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(8, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: "yellow" })
  );
  switchPlate.position.set(0, 15, -74);
  switchPlate.receiveShadow = true;

  switchPlate.userData.id = "ch2_l3_switch_1";
  switchPlate.userData.levelIndex = 3;
  switchPlate.userData.isSwitch = true;
  switchPlate.userData.linkedDoorId = "ch2_l3_door_1";
  switchPlate.userData.initialState = {
    position: switchPlate.position.clone(),
    rotation: switchPlate.rotation.clone(),
    scale: switchPlate.scale.clone(),
    visible: true,
  };
  group.add(switchPlate);
  platforms.push(switchPlate);

  // Exit platform
  const next = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 18), platformMaterial);
  next.position.set(0, 0, -84);
  next.receiveShadow = true;
  next.userData.levelIndex = 3;
  group.add(next);
  platforms.push(next);

  // Side walls
  const sideWallGeometry = new THREE.BoxGeometry(2, 60, 100);
  const invisibleWalls = new THREE.MeshStandardMaterial({
    color: "lightblue",
    transparent: true,
    opacity: 0.0,
  });

  const leftWall = new THREE.Mesh(sideWallGeometry, invisibleWalls);
  leftWall.position.set(-11, 28, -35);
  leftWall.userData.levelIndex = 3;
  group.add(leftWall);
  platforms.push(leftWall);

  const rightWall = new THREE.Mesh(sideWallGeometry, invisibleWalls);
  rightWall.position.set(11, 28, -35);
  rightWall.userData.levelIndex = 3;
  group.add(rightWall);
  platforms.push(rightWall);

  return { group, platforms };
}
