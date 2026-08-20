import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const root = path.resolve(import.meta.dirname, ".."); const assets = path.join(root, "client/public/models/speakers");
const manifest = JSON.parse(await fs.readFile(path.join(assets, "manifest.json"), "utf8")); const loader = new GLTFLoader();
const required = new Set(["Root", "Cabinet", "Woofer", "Horn", "Port", "Grille", "EmitterLow", "EmitterMid", "EmitterHigh"]);
for (const [relative, expected] of Object.entries(manifest)) {
  const bytes = await fs.readFile(path.join(assets, relative)); if (bytes.readUInt32LE(0) !== 0x46546c67) throw new Error(`${relative}: invalid GLB header`);
  const gltf = await new Promise((resolve, reject) => loader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject)); const box = new THREE.Box3().setFromObject(gltf.scene); const size = box.getSize(new THREE.Vector3()); let triangles = 0; const names = new Set(); gltf.scene.traverse((object) => { if (required.has(object.name)) names.add(object.name); if (object instanceof THREE.Mesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3; });
  if (!names.has("Root") || !names.has("Cabinet")) throw new Error(`${relative}: Root/Cabinet missing`); if (triangles !== expected.triangles) throw new Error(`${relative}: triangle count mismatch`); for (const [axis, value] of [["width", size.x], ["height", size.y], ["depth", size.z]]) if (Math.abs(value - expected[axis]) > .08) throw new Error(`${relative}: ${axis} mismatch ${value}`);
  console.log(`ok ${relative} ${triangles} triangles ${expected.sizeKb}KB ${[...names].join(",")}`);
}
console.log(`Validated ${Object.keys(manifest).length} GLB assets.`);
