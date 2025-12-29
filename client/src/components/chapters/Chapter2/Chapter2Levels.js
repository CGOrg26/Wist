import { loadChapter2Level1 } from "./Chapter2Level1.js";
import { loadChapter2Level2 } from "./Chapter2Level2.js";
import { loadChapter2Level3 } from "./Chapter2Level3.js";

export function loadChapter2Levels(scene, role) {
  let zOffset = 0;
  const allPlatforms = [];

  const level1 = loadChapter2Level1(role);
  if (!level1 || !level1.group) {
    console.error("❌ Chapter2 Level1 did not return { group, platforms }");
    return [];
  }

  level1.group.position.z = zOffset;
  scene.add(level1.group);
  allPlatforms.push(...level1.platforms);

  zOffset -= 80;

  const level2 = loadChapter2Level2(role);
  if (!level2 || !level2.group) {
    console.error("❌ Chapter2 Level2 did not return { group, platforms }");
    return allPlatforms;
  }

  level2.group.position.z = zOffset;
  scene.add(level2.group);
  allPlatforms.push(...level2.platforms);

  zOffset -= 80;

  const level3 = loadChapter2Level3(role);
  if (!level3 || !level3.group) {
    console.error("❌ Chapter2 Level3 did not return { group, platforms }");
    return allPlatforms;
  }

  level3.group.position.z = zOffset;
  scene.add(level3.group);
  allPlatforms.push(...level3.platforms);

  return allPlatforms;
}
