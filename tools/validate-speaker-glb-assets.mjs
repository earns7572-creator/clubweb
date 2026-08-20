/* GLB asset validation: development-only verification of the staged WebDev assets before deployment. */
import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const assets = process.env.CLUBCRAFT_GLB_DIR ?? "/home/ubuntu/webdev-static-assets/clubcraft-glb";
const manifest = JSON.parse(await fs.readFile(path.join(assets, "manifest.json"), "utf8"));
const loader = new GLTFLoader();
for (const [relativePath, expected] of Object.entries(manifest)) {
  const bytes = await fs.readFile(path.join(assets, relativePath));
  if (bytes.readUInt32LE(0) !== 0x46546c67) throw new Error(`${relativePath}: invalid GLB header`);
  const gltf = await new Promise((resolve, reject) => loader.parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject));
  const scene = gltf.scene; const names = new Set(); let triangles = 0;
  scene.traverse((object) => { if (object.name) names.add(object.name); if (object instanceof THREE.Mesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3; });
  const size = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3());
  if (!names.has("Root") || !names.has("Cabinet")) throw new Error(`${relativePath}: Root or Cabinet mesh missing`);
  if (triangles !== expected.triangles) throw new Error(`${relativePath}: expected ${expected.triangles} triangles, found ${triangles}`);
  for (const axis of ["width", "height", "depth"]) if (Math.abs(size[{ width: "x", height: "y", depth: "z" }[axis]] - expected[axis]) > .08) throw new Error(`${relativePath}: ${axis} bounds mismatch`);
  console.log(`ok ${relativePath}: ${triangles} triangles`);
}
console.log(`Validated ${Object.keys(manifest).length} GLB speaker assets.`);
